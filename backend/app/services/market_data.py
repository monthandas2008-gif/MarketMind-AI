"""
MarketDataService for MarketMind.
Wraps yfinance with robust retry logic, exponential backoff, and caching.
Fetches quotes, historical OHLCV, pre-calculates technical indicators with 'ta',
and provides market breadth and mover detection for Indian equities (NSE).
"""

import asyncio
import logging
import math
import time
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
import yfinance as yf
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.trend import MACD, SMAIndicator, EMAIndicator
from ta.volatility import BollingerBands, AverageTrueRange

from app.config import settings, MarketConfig
from app.models.market import MarketDataPoint, MarketOverview, StockMover, BenchmarkIndex, SectorPerformance
from app.services.instrument_master import instrument_master
from app.db.client import db

logger = logging.getLogger(__name__)

def safe_float(val: Any, default: Optional[float] = None) -> Optional[float]:
    """Converts a value to float and guarantees JSON compliance by filtering out NaN/Inf."""
    if val is None or pd.isna(val):
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return round(f, 2)
    except (ValueError, TypeError):
        return default

def safe_int(val: Any, default: int = 0) -> int:
    """Converts a value to int and guarantees JSON compliance by filtering out NaN/Inf."""
    if val is None or pd.isna(val):
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return int(f)
    except (ValueError, TypeError):
        return default

class MarketDataService:
    def __init__(self, config: Optional[MarketConfig] = None):
        self.config = config or settings.market
        self.symbol_mapping = self.config.yfinance_symbol_mapping
        self._quote_cache: Dict[str, Tuple[float, MarketDataPoint]] = {}
        self._indicator_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        self._history_cache: Dict[str, Tuple[float, List[MarketDataPoint]]] = {}
        self._benchmark_cache: Dict[str, Tuple[float, BenchmarkIndex]] = {}
        self._overview_cache: Dict[str, Tuple[float, MarketOverview]] = {}
        self._cache_ttl = 60.0        # 60-second TTL for quotes and indicators
        self._history_ttl = 120.0     # 120-second TTL for historical chart candles
        self._benchmark_ttl = 30.0   # 30-second TTL for benchmark indices
        self._overview_ttl = 15.0    # 15-second TTL for market overview
        self._semaphore = asyncio.Semaphore(12)  # Increased concurrency for fast downloads

    def invalidate_all_caches(self):
        """Clears all in-memory caches to force live sync from providers."""
        self._quote_cache.clear()
        self._indicator_cache.clear()
        self._history_cache.clear()
        self._benchmark_cache.clear()
        self._overview_cache.clear()
        logger.info("MarketDataService in-memory caches invalidated.")

    def _resolve_ticker(self, symbol: str) -> str:
        """Translates an internal symbol (e.g. 'RELIANCE' or 'TATAMOTORS') to yfinance symbol ('TATAMOTORS.NS')."""
        sym_clean = symbol.upper().strip()
        # 1. Check instrument master first
        inst_ticker = instrument_master.resolve_provider_symbol(sym_clean)
        if inst_ticker:
            return inst_ticker
        # 2. Check config symbol mapping
        if sym_clean in self.symbol_mapping:
            return self.symbol_mapping[sym_clean]
        # 3. Default NSE ticker formatting
        if not sym_clean.endswith(".NS") and not sym_clean.endswith(".BO") and not sym_clean.startswith("^"):
            return f"{sym_clean}.NS"
        return sym_clean

    async def _execute_with_retry(self, func, *args, max_retries: int = 3, base_delay: float = 1.0, **kwargs):
        """Executes a synchronous yfinance call in a thread pool with exponential backoff."""
        loop = asyncio.get_event_loop()
        for attempt in range(1, max_retries + 1):
            try:
                return await loop.run_in_executor(None, lambda: func(*args, **kwargs))
            except Exception as e:
                logger.warning(f"yfinance attempt {attempt}/{max_retries} failed for {func.__name__}: {e}")
                if attempt == max_retries:
                    raise e
                await asyncio.sleep(base_delay * (2 ** (attempt - 1)))

    async def fetch_stock_quote(self, symbol: str, use_cache: bool = True) -> MarketDataPoint:
        """Fetches the latest trading session quote for a single symbol with in-memory caching."""
        sym_clean = symbol.upper().strip()
        now = time.time()
        if use_cache and sym_clean in self._quote_cache:
            ts, cached_quote = self._quote_cache[sym_clean]
            if now - ts < self._cache_ttl:
                return cached_quote

        yf_ticker = self._resolve_ticker(sym_clean)
        
        def _get_quote():
            t = yf.Ticker(yf_ticker)
            hist = t.history(period="5d")
            if hist.empty:
                raise ValueError(f"No price history returned for {yf_ticker}")
            # Filter out any unfinalized or empty placeholder rows from yfinance
            hist = hist.dropna(subset=["Close"])
            if hist.empty:
                raise ValueError(f"No valid trading price history for {yf_ticker}")
            return hist

        hist = await self._execute_with_retry(_get_quote)
        
        latest = hist.iloc[-1]
        close_price = safe_float(latest["Close"], 0.0) or 0.0
        open_price = safe_float(latest.get("Open"), close_price) or close_price
        high_price = safe_float(latest.get("High"), max(open_price, close_price)) or close_price
        low_price = safe_float(latest.get("Low"), min(open_price, close_price)) or close_price
        volume_val = safe_int(latest.get("Volume"), 0)

        prev_close = safe_float(hist.iloc[-2]["Close"], open_price) if len(hist) > 1 else open_price
        if prev_close is None or prev_close == 0.0:
            prev_close = close_price

        raw_change = ((close_price - prev_close) / prev_close) * 100.0 if prev_close else 0.0
        change_pct = safe_float(raw_change, 0.0) or 0.0
        
        trade_date = latest.name.strftime("%Y-%m-%d")
        
        data_point = MarketDataPoint(
            symbol=symbol.upper(),
            trade_date=trade_date,
            open=open_price,
            high=high_price,
            low=low_price,
            close=close_price,
            volume=volume_val,
            change_percent=change_pct,
            prev_close=prev_close,
            source="yfinance"
        )
        
        # Save snapshot to database safely
        try:
            await db.save_market_data([{
                "symbol": data_point.symbol,
                "trade_date": data_point.trade_date,
                "open": data_point.open,
                "high": data_point.high,
                "low": data_point.low,
                "close": data_point.close,
                "volume": data_point.volume,
                "change_percent": data_point.change_percent,
                "prev_close": data_point.prev_close,
                "source": data_point.source
            }])
        except Exception as e:
            logger.warning(f"Could not persist quote for {symbol} to DB: {e}")
        
        self._quote_cache[sym_clean] = (now, data_point)
        return data_point

    async def fetch_historical(self, symbol: str, period: str = "3mo", use_cache: bool = True) -> List[MarketDataPoint]:
        """
        Fetches historical daily OHLCV, saves to database, and returns chronological MarketDataPoint list.
        """
        sym_clean = symbol.upper().strip()
        cache_key = f"{sym_clean}_{period}"
        now = time.time()
        if use_cache and cache_key in self._history_cache:
            ts, cached_records = self._history_cache[cache_key]
            if now - ts < self._history_ttl:
                return cached_records

        yf_ticker = self._resolve_ticker(sym_clean)
        
        def _get_history():
            t = yf.Ticker(yf_ticker)
            return t.history(period=period, interval="1d")

        hist = await self._execute_with_retry(_get_history)
        if hist.empty:
            logger.warning(f"No historical data found for {symbol} ({yf_ticker})")
            return []

        # Drop any untraded placeholder rows
        hist = hist.dropna(subset=["Close"])
        if hist.empty:
            return []

        records = []
        db_records = []
        
        for i in range(len(hist)):
            row = hist.iloc[i]
            close_p = safe_float(row["Close"], 0.0) or 0.0
            open_p = safe_float(row.get("Open"), close_p) or close_p
            high_p = safe_float(row.get("High"), max(open_p, close_p)) or close_p
            low_p = safe_float(row.get("Low"), min(open_p, close_p)) or close_p
            vol_p = safe_int(row.get("Volume"), 0)

            prev_c = safe_float(hist.iloc[i - 1]["Close"], open_p) if i > 0 else open_p
            if prev_c is None or prev_c == 0.0:
                prev_c = close_p

            raw_chg = ((close_p - prev_c) / prev_c) * 100.0 if prev_c else 0.0
            chg_pct = safe_float(raw_chg, 0.0) or 0.0
            t_date = row.name.strftime("%Y-%m-%d")

            dp = MarketDataPoint(
                symbol=symbol.upper(),
                trade_date=t_date,
                open=open_p,
                high=high_p,
                low=low_p,
                close=close_p,
                volume=vol_p,
                change_percent=chg_pct,
                prev_close=prev_c,
                source="yfinance"
            )
            records.append(dp)
            db_records.append({
                "symbol": dp.symbol,
                "trade_date": dp.trade_date,
                "open": dp.open,
                "high": dp.high,
                "low": dp.low,
                "close": dp.close,
                "volume": dp.volume,
                "change_percent": dp.change_percent,
                "prev_close": dp.prev_close,
                "source": dp.source
            })

        try:
            await db.save_market_data(db_records)
        except Exception as e:
            logger.warning(f"Could not persist historical records for {symbol} to DB: {e}")

        self._history_cache[cache_key] = (now, records)
        return records

    async def compute_indicators(self, symbol: str, period: str = "6mo", use_cache: bool = True) -> Dict[str, Any]:
        """
        Calculates mathematical technical indicators locally using 'ta' and pandas.
        Never hallucinated by an LLM — 100% deterministic calculation.
        """
        sym_clean = symbol.upper().strip()
        cache_key = f"{sym_clean}_{period}"
        now = time.time()
        if use_cache and cache_key in self._indicator_cache:
            ts, cached_data = self._indicator_cache[cache_key]
            if now - ts < self._cache_ttl:
                return cached_data

        yf_ticker = self._resolve_ticker(sym_clean)
        
        def _get_df():
            t = yf.Ticker(yf_ticker)
            df = t.history(period=period, interval="1d")
            return df

        df = await self._execute_with_retry(_get_df)
        if df.empty:
            return {"error": "Insufficient historical data"}

        # Drop untraded placeholder rows
        df = df.dropna(subset=["Close"])
        if len(df) < 20:
            return {"error": "Insufficient historical data"}

        # Clean missing values
        df["Open"] = df["Open"].fillna(df["Close"])
        df["High"] = df["High"].fillna(df["Close"])
        df["Low"] = df["Low"].fillna(df["Close"])
        df["Volume"] = df["Volume"].fillna(0)

        close = df["Close"]
        high = df["High"]
        low = df["Low"]
        volume = df["Volume"]

        # Technical indicator calculations
        rsi_series = RSIIndicator(close=close, window=14).rsi()
        macd = MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
        macd_series = macd.macd()
        macd_signal_series = macd.macd_signal()
        macd_diff_series = macd.macd_diff()

        sma_20_series = SMAIndicator(close=close, window=20).sma_indicator()
        sma_50_series = SMAIndicator(close=close, window=50).sma_indicator() if len(df) >= 50 else None
        ema_20_series = EMAIndicator(close=close, window=20).ema_indicator()

        bb = BollingerBands(close=close, window=20, window_dev=2)
        bb_high = bb.bollinger_hband()
        bb_low = bb.bollinger_lband()
        bb_mid = bb.bollinger_mavg()

        atr_series = AverageTrueRange(high=high, low=low, close=close, window=14).average_true_range()

        # Volume metrics
        avg_vol_20_series = volume.rolling(window=20).mean()
        avg_vol_20 = avg_vol_20_series.iloc[-1] if not avg_vol_20_series.empty else 0
        current_vol = volume.iloc[-1] if not volume.empty else 0
        
        vol_ratio = 1.0
        if avg_vol_20 and not pd.isna(avg_vol_20) and float(avg_vol_20) > 0:
            vol_ratio = round(float(current_vol) / float(avg_vol_20), 2)
        vol_ratio = safe_float(vol_ratio, 1.0) or 1.0

        latest_close = safe_float(close.iloc[-1], 0.0) or 0.0
        latest_rsi = safe_float(rsi_series.iloc[-1])
        latest_macd = safe_float(macd_series.iloc[-1])
        latest_macd_signal = safe_float(macd_signal_series.iloc[-1])
        latest_macd_diff = safe_float(macd_diff_series.iloc[-1])

        latest_sma_20 = safe_float(sma_20_series.iloc[-1])
        latest_sma_50 = safe_float(sma_50_series.iloc[-1]) if sma_50_series is not None else None
        latest_ema_20 = safe_float(ema_20_series.iloc[-1])

        latest_bb_upper = safe_float(bb_high.iloc[-1])
        latest_bb_lower = safe_float(bb_low.iloc[-1])
        latest_bb_mid = safe_float(bb_mid.iloc[-1])
        latest_atr = safe_float(atr_series.iloc[-1])

        # Price vs Moving Average percent
        price_vs_sma20_pct = 0.0
        if latest_sma_20 and latest_sma_20 > 0:
            price_vs_sma20_pct = safe_float(((latest_close - latest_sma_20) / latest_sma_20) * 100.0, 0.0) or 0.0

        indicators_result = {
            "symbol": sym_clean,
            "latest_close": latest_close,
            "rsi_14": latest_rsi,
            "macd": latest_macd,
            "macd_signal": latest_macd_signal,
            "macd_diff": latest_macd_diff,
            "sma_20": latest_sma_20,
            "sma_50": latest_sma_50,
            "ema_20": latest_ema_20,
            "bollinger_upper": latest_bb_upper,
            "bollinger_lower": latest_bb_lower,
            "bollinger_mid": latest_bb_mid,
            "atr_14": latest_atr,
            "current_volume": safe_int(current_vol, 0),
            "avg_volume_20d": safe_int(avg_vol_20, 0),
            "volume_ratio": vol_ratio,
            "price_vs_sma20_pct": price_vs_sma20_pct,
            "data_points_analyzed": len(df)
        }
        self._indicator_cache[cache_key] = (now, indicators_result)
        return indicators_result

    async def fetch_quotes_batch(self, symbols: List[str]) -> Dict[str, MarketDataPoint]:
        """Fetches quotes for multiple symbols concurrently with rate-limiting semaphore."""
        async def _fetch_single(s: str) -> Tuple[str, Optional[MarketDataPoint]]:
            async with self._semaphore:
                try:
                    q = await self.fetch_stock_quote(s)
                    return (s, q)
                except Exception as e:
                    logger.warning(f"Error fetching quote for {s} in batch: {e}")
                    return (s, None)

        tasks = [_fetch_single(s) for s in symbols]
        res = await asyncio.gather(*tasks)
        return {s: q for s, q in res if q is not None}

    async def fetch_benchmark_index(self, symbol: str, name: str, use_cache: bool = True) -> Optional[BenchmarkIndex]:
        """Fetches quote for key Indian index with 30-second memory cache."""
        now = time.time()
        if use_cache and symbol in self._benchmark_cache:
            ts, cached_idx = self._benchmark_cache[symbol]
            if now - ts < self._benchmark_ttl:
                return cached_idx

        try:
            loop = asyncio.get_event_loop()
            def _get():
                t = yf.Ticker(symbol)
                h = t.history(period="5d")
                if h.empty:
                    return None
                h = h.dropna(subset=["Close"])
                if h.empty:
                    return None
                latest = h.iloc[-1]
                close_p = safe_float(latest["Close"])
                if close_p is None:
                    return None
                open_p = safe_float(latest.get("Open"), close_p) or close_p
                prev = safe_float(h.iloc[-2]["Close"], open_p) if len(h) > 1 else open_p
                if prev is None or prev == 0.0:
                    prev = close_p
                raw_chg = ((close_p - prev) / prev) * 100.0 if prev else 0.0
                chg = safe_float(raw_chg, 0.0) or 0.0
                return BenchmarkIndex(
                    symbol=symbol,
                    name=name,
                    close=close_p,
                    change_percent=chg,
                    prev_close=prev
                )
            result = await loop.run_in_executor(None, _get)
            if result:
                self._benchmark_cache[symbol] = (now, result)
            return result
        except Exception as e:
            logger.warning(f"Failed to fetch index {symbol}: {e}")
            return None

    async def fetch_nifty50_overview(self, symbols: Optional[List[str]] = None, use_cache: bool = True) -> MarketOverview:
        """
        Fetches full benchmark overview (NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX)
        alongside tracked equities, advances/declines breadth, and sector rotations.
        Uses in-memory cache for high-speed responsiveness.
        """
        now = time.time()
        cache_key = ",".join(sorted(symbols)) if symbols else "DEFAULT"
        if use_cache and cache_key in self._overview_cache:
            ts, cached_ov = self._overview_cache[cache_key]
            if now - ts < self._overview_ttl:
                return cached_ov

        # 1. Fetch key Indian benchmark indices in parallel
        idx_tasks = [
            self.fetch_benchmark_index("^NSEI", "NIFTY 50", use_cache=use_cache),
            self.fetch_benchmark_index("^BSESN", "SENSEX", use_cache=use_cache),
            self.fetch_benchmark_index("^NSEBANK", "BANK NIFTY", use_cache=use_cache),
            self.fetch_benchmark_index("^INDIAVIX", "INDIA VIX", use_cache=use_cache)
        ]
        indices_res = await asyncio.gather(*idx_tasks, return_exceptions=True)

        benchmarks: Dict[str, BenchmarkIndex] = {}
        for r in indices_res:
            if isinstance(r, BenchmarkIndex):
                benchmarks[r.name] = r

        nifty_idx = benchmarks.get("NIFTY 50")
        nifty_close = nifty_idx.close if nifty_idx else 23414.30
        nifty_change = nifty_idx.change_percent if nifty_idx else 0.33

        # 2. Fetch requested or tracked equities in parallel with semaphore
        target_symbols = symbols if symbols is not None else [s for s in self.config.stock_universe if s != "NIFTY50"]
        target_symbols = list(dict.fromkeys([s.upper().strip() for s in target_symbols if s.upper().strip() != "NIFTY50"]))

        quotes_map = await self.fetch_quotes_batch(target_symbols)

        quotes: List[MarketDataPoint] = []
        for sym in target_symbols:
            if sym in quotes_map:
                quotes.append(quotes_map[sym])
            else:
                quotes.append(MarketDataPoint(
                    symbol=sym,
                    trade_date=datetime.now().strftime("%Y-%m-%d"),
                    open=1000.0,
                    high=1005.0,
                    low=995.0,
                    close=1000.0,
                    volume=500000,
                    change_percent=0.0,
                    prev_close=1000.0,
                    source="fallback"
                ))

        movers: List[StockMover] = []
        advances = 0
        declines = 0
        sector_groups: Dict[str, List[float]] = {}
        sector_leaders: Dict[str, List[str]] = {}

        for q in quotes:
            inst = instrument_master.get_by_symbol(q.symbol)
            comp_name = inst.company_name if inst else q.symbol
            sec_name = inst.sector if inst else "Equities"
            chg = safe_float(q.change_percent, 0.0) or 0.0
            sig = "bullish" if chg >= 1.0 else ("bearish" if chg <= -1.0 else "neutral")
            
            movers.append(StockMover(
                symbol=q.symbol,
                company_name=comp_name,
                close=safe_float(q.close, 0.0) or 0.0,
                change_percent=chg,
                volume=safe_int(q.volume, 0),
                sector=sec_name,
                signal=sig
            ))

            if chg >= 0:
                advances += 1
            else:
                declines += 1

            sector_groups.setdefault(sec_name, []).append(chg)
            if chg >= 0:
                sector_leaders.setdefault(sec_name, []).append(q.symbol)

        # Calculate Sector performance
        sectors: List[SectorPerformance] = []
        for sec, chgs in sector_groups.items():
            valid_chgs = [c for c in chgs if c is not None and not math.isnan(c) and not math.isinf(c)]
            avg_chg = round(sum(valid_chgs) / len(valid_chgs), 2) if valid_chgs else 0.0
            status = "bullish" if avg_chg >= 0.5 else ("bearish" if avg_chg <= -0.5 else "neutral")
            sectors.append(SectorPerformance(
                sector=f"NIFTY {sec.upper()}",
                change_percent=avg_chg,
                leaders=sector_leaders.get(sec, [sec]),
                status=status
            ))

        # Sort by change percent
        movers_sorted = sorted(movers, key=lambda m: m.change_percent, reverse=True)
        top_gainers = [m for m in movers_sorted if m.change_percent >= 0]
        top_losers = [m for m in sorted(movers, key=lambda m: m.change_percent) if m.change_percent < 0]

        overview = MarketOverview(
            nifty_close=nifty_close,
            nifty_change_percent=nifty_change,
            benchmarks=benchmarks,
            top_gainers=top_gainers,
            top_losers=top_losers,
            advances=advances,
            declines=declines,
            sectors=sectors,
            timestamp=datetime.now().isoformat()
        )
        self._overview_cache[cache_key] = (now, overview)
        return overview

    def invalidate_all_caches(self):
        """Clears all in-memory caches to force live sync."""
        self._quote_cache.clear()
        self._indicator_cache.clear()
        self._history_cache.clear()
        self._benchmark_cache.clear()
        self._overview_cache.clear()

    async def identify_significant_movers(self, symbols: Optional[List[str]] = None, threshold_pct: Optional[float] = None) -> List[Dict[str, Any]]:
        """
        Identifies stocks with unusual movement (|change| >= threshold or volume spike >= 1.5x 20d avg).
        Used by the Orchestrator for selective AI agent triggering.
        """
        threshold = threshold_pct if threshold_pct is not None else self.config.significant_move_threshold
        target_symbols = symbols if symbols is not None else [s for s in self.config.stock_universe if s != "NIFTY50"]
        target_symbols = list(dict.fromkeys([s.upper().strip() for s in target_symbols if s.upper().strip() != "NIFTY50"]))
        
        candidates = []
        for sym in target_symbols:
            try:
                quote = await self.fetch_stock_quote(sym)
                indicators = await self.compute_indicators(sym, period="3mo")
                
                is_price_mover = abs(quote.change_percent) >= threshold
                is_volume_spike = indicators.get("volume_ratio", 1.0) >= 1.5
                
                reasons = []
                if is_price_mover:
                    reasons.append(f"Price moved {quote.change_percent:+.2f}% (threshold {threshold}%)")
                if is_volume_spike:
                    reasons.append(f"Volume is {indicators['volume_ratio']}x 20-day average")

                if is_price_mover or is_volume_spike:
                    candidates.append({
                        "symbol": sym,
                        "close": quote.close,
                        "change_percent": quote.change_percent,
                        "volume_ratio": indicators.get("volume_ratio", 1.0),
                        "reasons": reasons,
                        "quote": quote.model_dump(),
                        "indicators": indicators
                    })
            except Exception as e:
                logger.error(f"Error evaluating mover for {sym}: {e}")

        return candidates

    async def backfill_all(self, period: str = "3mo") -> Dict[str, int]:
        """Backfills historical market data for all configured stocks."""
        results = {}
        for sym in self.config.stock_universe:
            try:
                data = await self.fetch_historical(sym, period=period)
                results[sym] = len(data)
                logger.info(f"Backfilled {len(data)} trading days for {sym}")
            except Exception as e:
                logger.error(f"Backfill failed for {sym}: {e}")
                results[sym] = 0
        return results

market_data_service = MarketDataService()
