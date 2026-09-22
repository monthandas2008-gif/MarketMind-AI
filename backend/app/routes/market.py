"""
Market data API routes for quotes, historical OHLCV, market overviews, and active stocks.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.models.market import MarketDataPoint, MarketOverview, StockInfo
from app.services.market_data import market_data_service
from app.services.news import news_service
from app.db.queries import get_active_stocks, get_historical_market_data

from app.models.instrument import InstrumentSearchResult
from app.services.instrument_master import instrument_master

router = APIRouter(prefix="/api/market", tags=["Market Data"])

@router.get("/overview", response_model=MarketOverview)
async def get_market_overview(
    symbols: Optional[str] = Query(None, description="Comma-separated symbols to filter/overview"),
    force_refresh: bool = Query(False, description="Bypass cache and force fresh data fetch")
):
    """Returns real-time NIFTY 50 index performance alongside top gainers and losers."""
    try:
        sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()] if symbols else None
        return await market_data_service.fetch_nifty50_overview(symbols=sym_list, use_cache=not force_refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market overview: {e}")

@router.post("/sync", response_model=MarketOverview)
async def sync_live_market(symbols: Optional[str] = Query(None, description="Comma-separated symbols to filter/overview")):
    """Forces an immediate synchronization of real-time market data across tracked equities and benchmarks."""
    try:
        market_data_service.invalidate_all_caches()
        sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()] if symbols else None
        return await market_data_service.fetch_nifty50_overview(symbols=sym_list, use_cache=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Market sync failed: {e}")

@router.get("/search", response_model=List[InstrumentSearchResult])
async def search_instruments(q: str = Query("", description="Query for symbol, company name, sector or alias")):
    """Searches instruments master locally in-memory for instant keystroke lookups."""
    try:
        return instrument_master.search(q, limit=15)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

@router.get("/instruments")
async def get_all_instruments(sector: Optional[str] = None):
    """Returns all supported Indian equity instruments with sector metadata."""
    try:
        if sector:
            return instrument_master.get_by_sector(sector)
        return instrument_master.get_all_instruments()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch instruments: {e}")

@router.get("/stocks", response_model=List[StockInfo])
async def list_stocks():
    """Returns all active Indian equities and indices from instrument master and database."""
    try:
        # Return all supported instruments from instrument master mapped to StockInfo
        all_inst = instrument_master.get_all_instruments()
        return [
            StockInfo(
                symbol=inst.symbol,
                company_name=inst.company_name,
                exchange=inst.exchange,
                sector=inst.sector,
                yfinance_symbol=inst.provider_symbol
            )
            for inst in all_inst
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stocks: {e}")

@router.get("/stock/{symbol}")
async def get_stock_data(symbol: str):
    """Returns the latest quote and pre-computed technical indicators for a symbol."""
    sym_clean = symbol.upper().strip()
    try:
        quote = await market_data_service.fetch_stock_quote(sym_clean)
        indicators = await market_data_service.compute_indicators(sym_clean)
        return {
            "symbol": sym_clean,
            "quote": quote.model_dump(),
            "indicators": indicators
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Could not retrieve data for {sym_clean}: {e}")

@router.get("/history/{symbol}", response_model=List[MarketDataPoint])
async def get_stock_history(
    symbol: str, 
    period: str = Query("3mo", description="1mo, 3mo, 6mo, 1y"),
    force_refresh: bool = Query(False, description="Bypass cache and force fresh OHLCV fetch")
):
    """Returns chronological historical OHLCV data for charting."""
    sym_clean = symbol.upper().strip()
    try:
        if not force_refresh:
            # First check DB
            db_history = await get_historical_market_data(sym_clean, limit=90)
            if len(db_history) >= 20:
                return db_history

        # If sparse in DB or forced refresh, fetch live
        return await market_data_service.fetch_historical(sym_clean, period=period, use_cache=not force_refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history for {sym_clean}: {e}")

@router.get("/movers")
async def get_significant_movers(threshold: float = Query(2.0, description="Percentage change threshold")):
    """Identifies stocks showing abnormal price action or volume spikes."""
    try:
        return await market_data_service.identify_significant_movers(threshold_pct=threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to identify movers: {e}")

@router.get("/news")
async def get_market_news(symbol: Optional[str] = None, limit: int = Query(10, ge=1, le=50)):
    """Returns recent market news or stock-specific news with source attribution."""
    try:
        if symbol:
            return await news_service.fetch_stock_news(symbol.upper().strip(), limit=limit)
        return await news_service.fetch_market_news(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch news: {e}")
