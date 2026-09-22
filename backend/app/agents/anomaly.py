"""
AnomalyPatternAgent for MarketMind.
Identifies unusual price surges, volume spikes, gap opens, and historical volatility anomalies
using rigorous deterministic z-score and statistical calculations, then leverages Gemini
for contextual market interpretation.
"""

import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
import numpy as np
import pandas as pd
import yfinance as yf

from app.agents.base import AnalysisAgent
from app.models.analysis import AgentResult, Evidence
from app.llm.client import gemini_client
from app.llm.prompts import ANOMALY_SYSTEM_PROMPT
from app.services.market_data import market_data_service

logger = logging.getLogger(__name__)

class AnomalyPatternAgent(AnalysisAgent):
    @property
    def name(self) -> str:
        return "anomaly"

    def compute_statistical_anomalies(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Pure Python mathematical calculation of statistical deviations.
        Zero LLM arithmetic — completely deterministic.
        """
        if df.empty or len(df) < 20:
            return {"anomaly_detected": False, "reason": "Insufficient historical data"}

        close = df["Close"]
        volume = df["Volume"]
        high = df["High"]
        low = df["Low"]
        opens = df["Open"]

        # 1. Volume Z-Score
        vol_20 = volume.tail(20)
        vol_mean = float(vol_20.mean())
        vol_std = float(vol_20.std()) if float(vol_20.std()) > 0 else 1.0
        current_vol = float(volume.iloc[-1])
        vol_zscore = round((current_vol - vol_mean) / vol_std, 2)
        vol_ratio = round(current_vol / vol_mean, 2) if vol_mean > 0 else 1.0

        # 2. Daily Price Return Z-Score
        returns = close.pct_change().tail(20).dropna()
        ret_mean = float(returns.mean())
        ret_std = float(returns.std()) if float(returns.std()) > 0 else 0.01
        current_return = float(returns.iloc[-1])
        return_zscore = round((current_return - ret_mean) / ret_std, 2)
        daily_pct_change = round(current_return * 100, 2)

        # 3. Gap Open calculation
        prev_close = float(close.iloc[-2]) if len(close) > 1 else float(opens.iloc[-1])
        today_open = float(opens.iloc[-1])
        gap_pct = round(((today_open - prev_close) / prev_close) * 100, 2) if prev_close else 0.0

        # 4. Intraday True Range vs 20-day Average Range
        intraday_range = float(high.iloc[-1] - low.iloc[-1])
        hist_ranges = (high - low).tail(20)
        mean_range = float(hist_ranges.mean())
        range_expansion_ratio = round(intraday_range / mean_range, 2) if mean_range > 0 else 1.0

        # Deterministic Anomaly Flag Evaluation
        is_volume_anomaly = vol_zscore >= 2.0 or vol_ratio >= 1.8
        is_price_anomaly = abs(return_zscore) >= 2.0 or abs(daily_pct_change) >= 2.5
        is_gap_anomaly = abs(gap_pct) >= 1.2
        is_volatility_spike = range_expansion_ratio >= 2.0

        anomaly_detected = is_volume_anomaly or is_price_anomaly or is_gap_anomaly or is_volatility_spike

        detected_flags = []
        if is_volume_anomaly:
            detected_flags.append(f"Volume spike: {vol_ratio}x 20-day mean (Z-Score: +{vol_zscore})")
        if is_price_anomaly:
            detected_flags.append(f"Abnormal price move: {daily_pct_change:+.2f}% (Z-Score: {return_zscore})")
        if is_gap_anomaly:
            detected_flags.append(f"Significant gap at open: {gap_pct:+.2f}%")
        if is_volatility_spike:
            detected_flags.append(f"Volatility expansion: {range_expansion_ratio}x 20-day average range")

        return {
            "anomaly_detected": anomaly_detected,
            "detected_flags": detected_flags,
            "volume_zscore": vol_zscore,
            "volume_ratio": vol_ratio,
            "return_zscore": return_zscore,
            "daily_pct_change": daily_pct_change,
            "gap_pct": gap_pct,
            "range_expansion_ratio": range_expansion_ratio,
            "current_volume": int(current_vol),
            "avg_volume_20d": int(vol_mean)
        }

    async def analyze(self, symbol: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        context = context or {}
        
        # Load historical price dataframe
        yf_ticker = market_data_service._resolve_ticker(symbol)
        loop = asyncio.get_event_loop()
        try:
            df = await loop.run_in_executor(None, lambda: yf.Ticker(yf_ticker).history(period="3mo", interval="1d"))
        except Exception as e:
            logger.error(f"Failed to fetch historical data for anomaly check on {symbol}: {e}")
            df = pd.DataFrame()

        stats = self.compute_statistical_anomalies(df)

        if not stats.get("anomaly_detected"):
            return AgentResult(
                agent_name=self.name,
                symbol=symbol.upper(),
                findings=f"Trading activity for {symbol.upper()} is within normal statistical parameters. Volume is {stats.get('volume_ratio', 1.0)}x of 20-day average (Z-Score {stats.get('volume_zscore', 0.0)}), and price change of {stats.get('daily_pct_change', 0.0)}% is within standard historical deviation.",
                signal="neutral",
                confidence="high",
                evidence=[
                    Evidence(
                        claim=f"Volume Z-score ({stats.get('volume_zscore')}) and Return Z-score ({stats.get('return_zscore')}) are within normal [-2, +2] standard deviation range.",
                        source="MarketMind deterministic statistical engine",
                        source_url=None,
                        data_point={
                            "volume_zscore": stats.get("volume_zscore"),
                            "return_zscore": stats.get("return_zscore"),
                            "daily_pct_change": stats.get("daily_pct_change")
                        }
                    )
                ],
                timestamp=datetime.now()
            )

        # If mathematical anomaly exists, formulate LLM prompt for pattern interpretation
        user_prompt = f"""Interpret these statistical anomalies for Indian equity: {symbol.upper()}

DETERMINISTIC STATISTICAL METRICS:
- Flags Triggered: {', '.join(stats.get('detected_flags', []))}
- Volume Z-Score: {stats.get('volume_zscore')} (Ratio: {stats.get('volume_ratio')}x 20d average)
- Return Z-Score: {stats.get('return_zscore')} (Daily Change: {stats.get('daily_pct_change')}%)
- Gap Open Percentage: {stats.get('gap_pct')}%
- Intraday Range Expansion: {stats.get('range_expansion_ratio')}x 20d average range

Formulate a concise explanation of whether this represents aggressive institutional accumulation, distribution, panic selling, or technical breakout.
"""

        try:
            raw_response = await gemini_client.generate(
                system_prompt=ANOMALY_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            data = json.loads(raw_response)
        except Exception as e:
            logger.error(f"Anomaly agent failed to parse LLM response: {e}")
            data = {
                "summary": f"Statistical anomaly detected: {'; '.join(stats.get('detected_flags', []))}.",
                "anomaly_detected": True,
                "evidence": []
            }

        evidence_list = []
        for flag in stats.get("detected_flags", []):
            evidence_list.append(Evidence(
                claim=flag,
                source="Statistical Z-Score Calculation",
                source_url=None,
                data_point=stats
            ))

        # Determine analytical signal based on return direction
        ret_val = stats.get("daily_pct_change", 0.0)
        if ret_val >= 2.0:
            signal_val = "bullish"
        elif ret_val <= -2.0:
            signal_val = "bearish"
        else:
            signal_val = "neutral"

        return AgentResult(
            agent_name=self.name,
            symbol=symbol.upper(),
            findings=data.get("summary", f"Anomaly detected: {'; '.join(stats.get('detected_flags', []))}"),
            signal=signal_val,
            confidence="high",
            evidence=evidence_list,
            timestamp=datetime.now()
        )

anomaly_agent = AnomalyPatternAgent()
