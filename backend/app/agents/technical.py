"""
TechnicalAnalysisAgent for MarketMind.
Analyzes pre-computed mathematical technical indicators (RSI, MACD, moving averages,
Bollinger Bands, volume ratios) and translates them into an analytical momentum signal.
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.agents.base import AnalysisAgent
from app.models.analysis import AgentResult, Evidence
from app.llm.client import gemini_client
from app.llm.prompts import TECHNICAL_SYSTEM_PROMPT
from app.services.market_data import market_data_service

logger = logging.getLogger(__name__)

class TechnicalAnalysisAgent(AnalysisAgent):
    @property
    def name(self) -> str:
        return "technical"

    async def analyze(self, symbol: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        context = context or {}
        indicators = context.get("indicators")
        if not indicators:
            indicators = await market_data_service.compute_indicators(symbol)

        quote = context.get("quote")
        if not quote:
            try:
                q_model = await market_data_service.fetch_stock_quote(symbol)
                quote = q_model.model_dump()
            except Exception as e:
                logger.warning(f"Could not fetch quote for {symbol}: {e}")
                quote = {}

        # Construct prompt for the LLM
        user_prompt = f"""Analyze the technical setup for NSE stock: {symbol.upper()}

CURRENT PRICE DATA:
- Last Close: Rs {indicators.get('latest_close', quote.get('close', 'N/A'))}
- Today's Change: {quote.get('change_percent', 'N/A')}%
- Today's Volume: {indicators.get('current_volume', quote.get('volume', 'N/A')):,} (Ratio to 20d avg: {indicators.get('volume_ratio', 'N/A')}x)

PRE-COMPUTED TECHNICAL INDICATORS:
- 14-Day RSI: {indicators.get('rsi_14', 'N/A')} (Oversold < 30, Overbought > 70)
- MACD: {indicators.get('macd', 'N/A')} | Signal Line: {indicators.get('macd_signal', 'N/A')} | Histogram: {indicators.get('macd_diff', 'N/A')}
- 20-Day SMA: Rs {indicators.get('sma_20', 'N/A')} (Price vs SMA20: {indicators.get('price_vs_sma20_pct', 'N/A')}%)
- 50-Day SMA: Rs {indicators.get('sma_50', 'N/A')}
- 20-Day EMA: Rs {indicators.get('ema_20', 'N/A')}
- Bollinger Bands: Upper Rs {indicators.get('bollinger_upper', 'N/A')} | Mid Rs {indicators.get('bollinger_mid', 'N/A')} | Lower Rs {indicators.get('bollinger_lower', 'N/A')}
- 14-Day Average True Range (ATR): Rs {indicators.get('atr_14', 'N/A')}

Formulate an objective technical assessment with evidence grounded strictly in these figures.
"""

        try:
            raw_response = await gemini_client.generate(
                system_prompt=TECHNICAL_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            data = json.loads(raw_response)
        except Exception as e:
            logger.error(f"Technical agent failed to parse LLM response: {e}")
            data = {
                "summary": f"Technical momentum shows RSI at {indicators.get('rsi_14')} and 20d SMA at Rs {indicators.get('sma_20')}.",
                "signal": "neutral",
                "confidence": "moderate",
                "evidence": []
            }

        evidence_list = []
        for ev in data.get("evidence", []):
            evidence_list.append(Evidence(
                claim=ev.get("claim", ""),
                source=ev.get("source", "yfinance technical calculation"),
                source_url=ev.get("source_url"),
                data_point=ev.get("data_point")
            ))

        # Always ensure at least one primary deterministic evidence item exists
        if not evidence_list and indicators.get("rsi_14") is not None:
            evidence_list.append(Evidence(
                claim=f"14-day RSI is {indicators.get('rsi_14')}, trading at {indicators.get('price_vs_sma20_pct')}% vs 20-day SMA.",
                source="Deterministic mathematical calculation",
                source_url=None,
                data_point={
                    "rsi": indicators.get("rsi_14"),
                    "sma_20": indicators.get("sma_20"),
                    "volume_ratio": indicators.get("volume_ratio")
                }
            ))

        signal_val = data.get("signal", "neutral").lower()
        if signal_val not in ["bullish", "neutral", "bearish"]:
            signal_val = "neutral"

        conf_val = data.get("confidence", "moderate").lower()
        if conf_val not in ["high", "moderate", "low"]:
            conf_val = "moderate"

        return AgentResult(
            agent_name=self.name,
            symbol=symbol.upper(),
            findings=data.get("summary", "Technical assessment completed."),
            signal=signal_val,
            confidence=conf_val,
            evidence=evidence_list,
            timestamp=datetime.now()
        )

technical_agent = TechnicalAnalysisAgent()
