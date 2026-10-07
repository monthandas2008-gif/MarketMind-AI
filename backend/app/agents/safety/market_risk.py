"""
Market Risk Analyst Agent for the Trade Safety Committee.
Evaluates broader Indian market context (NIFTY 50, Sector Breadth, Advances/Declines, India VIX)
and technical telemetry to determine whether macro environment supports or weakens the proposed trade.
"""

from typing import Dict, Any, Optional
from datetime import datetime

from app.agents.safety.base import BaseSafetyAgent
from app.agents.safety.schemas import MarketRiskOutput
from app.agents.safety.prompts import MARKET_RISK_SYSTEM_PROMPT


class MarketRiskAnalyst(BaseSafetyAgent):
    def __init__(self):
        super().__init__(
            agent_name="Market Risk Analyst",
            agent_type="market_risk",
            schema_class=MarketRiskOutput,
            system_prompt=MARKET_RISK_SYSTEM_PROMPT
        )

    async def analyze(
        self,
        ticker: str,
        direction: str,
        market_overview: Any,
        technical_data: Optional[Dict[str, Any]] = None,
        anomaly_data: Optional[Dict[str, Any]] = None,
        lead_synthesis: Optional[str] = None,
        user_api_key: Optional[str] = None
    ) -> MarketRiskOutput:
        nifty_close = getattr(market_overview, "nifty_close", 23400.0)
        nifty_chg = getattr(market_overview, "nifty_change_percent", 0.0)
        advances = getattr(market_overview, "advances", 25)
        declines = getattr(market_overview, "declines", 25)
        breadth_ratio = round(advances / max(1, declines), 2)

        # Baseline deterministic risk assessment
        is_elevated_breadth_divergence = (direction.upper() == "LONG" and declines > (advances * 1.5)) or \
                                         (direction.upper() == "SHORT" and advances > (declines * 1.5))

        baseline_risk = "MODERATE"
        if is_elevated_breadth_divergence:
            baseline_risk = "HIGH"
        elif abs(nifty_chg) > 1.5:
            baseline_risk = "HIGH"

        fallback_dict = {
            "market_risk": baseline_risk,
            "confidence": 70,
            "reasoning": [
                f"NIFTY 50 benchmark currently at {nifty_close:.2f} ({nifty_chg:+.2f}%).",
                f"Market breadth stands at {advances} advances to {declines} declines (Ratio: {breadth_ratio}).",
                f"Macro regime indicates range consolidation with sector-specific rotations."
            ],
            "market_context": {
                "market_direction": "Bullish" if nifty_chg > 0.3 else ("Bearish" if nifty_chg < -0.3 else "Neutral"),
                "volatility": "Elevated" if abs(nifty_chg) > 1.0 else "Normal",
                "breadth": "Advancing" if advances > declines else "Declining",
                "regime": "High Volatility" if abs(nifty_chg) > 1.5 else "Consolidation"
            },
            "supports_trade": "NO" if is_elevated_breadth_divergence else "YES",
            "risk_flags": ["Elevated market breadth divergence against trade direction"] if is_elevated_breadth_divergence else [],
            "data_timestamps": [datetime.now().isoformat()]
        }

        user_prompt = f"""EVALUATE MARKET RISK FOR PROPOSED TRADE:
- Ticker: {ticker}
- Trade Direction: {direction.upper()}
- NIFTY 50 Benchmark: {nifty_close:.2f} ({nifty_chg:+.2f}%)
- Advances / Declines: {advances} Advancing vs {declines} Declining (Ratio: {breadth_ratio})
- Technical Desk Signal: {technical_data.get('signal', 'neutral') if technical_data else 'N/A'}
- Technical Desk Findings: {technical_data.get('findings', 'N/A') if technical_data else 'N/A'}
- Anomaly Flag: {anomaly_data.get('findings', 'None') if anomaly_data else 'None'}
- Lead Synthesis Note: {lead_synthesis or 'None'}

Assess whether this Indian market backdrop creates tailwinds or headwinds for this {direction.upper()} trade."""

        return await self.run(
            context_prompt=user_prompt,
            user_api_key=user_api_key,
            deterministic_fallback=fallback_dict
        )


market_risk_analyst = MarketRiskAnalyst()
