"""
SynthesisAgent for MarketMind.
Combines findings from Technical, News, and Anomaly agents alongside macroeconomic benchmark context.
Synthesizes a cohesive, evidence-graded intelligence briefing and persists results to the database.
"""

import json
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List

from app.models.analysis import AgentResult, Evidence, StockAnalysis
from app.llm.client import gemini_client
from app.llm.prompts import SYNTHESIS_SYSTEM_PROMPT
from app.db.client import db

logger = logging.getLogger(__name__)

class SynthesisAgent:
    @property
    def name(self) -> str:
        return "synthesis"

    async def synthesize(
        self,
        symbol: str,
        agent_results: Dict[str, AgentResult],
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResult:
        context = context or {}
        quote = context.get("quote", {})
        nifty_context = context.get("nifty", {})
        indicators = context.get("indicators", {})

        tech_res = agent_results.get("technical")
        news_res = agent_results.get("news")
        anom_res = agent_results.get("anomaly")

        close_val = quote.get("close") or indicators.get("latest_close", 0.0)
        sma20 = indicators.get("sma_20")
        sma50 = indicators.get("sma_50")
        boll_up = indicators.get("bollinger_upper")
        boll_low = indicators.get("bollinger_lower")
        atr = indicators.get("atr_14") or (close_val * 0.015 if close_val else 10.0)
        rsi = indicators.get("rsi_14")

        # Compile comprehensive input prompt for synthesis
        user_prompt = f"""SYNTHESIS REQUEST FOR INDIAN EQUITY: {symbol.upper()}

BENCHMARK CONTEXT:
- Nifty 50 Index: {nifty_context.get('close', 'N/A')} ({nifty_context.get('change_percent', 'N/A')}%)
- Stock Last Price: Rs {close_val} ({quote.get('change_percent', 'N/A')}%)

1. TECHNICAL AGENT FINDINGS & PRE-COMPUTED INDICATORS:
Signal: {tech_res.signal.upper() if tech_res else 'N/A'} (Confidence: {tech_res.confidence if tech_res else 'N/A'})
- 14D RSI: {rsi}
- 20-DMA: Rs {sma20} | 50-DMA: Rs {sma50}
- Bollinger Upper: Rs {boll_up} | Lower: Rs {boll_low}
- 14D ATR: Rs {atr}
Summary: {tech_res.findings if tech_res else 'No technical report available.'}

2. NEWS INTELLIGENCE FINDINGS:
Signal: {news_res.signal.upper() if news_res else 'N/A'} (Confidence: {news_res.confidence if news_res else 'N/A'})
Summary: {news_res.findings if news_res else 'No news intelligence available.'}

3. ANOMALY / PATTERN DETECTION FINDINGS:
Summary: {anom_res.findings if anom_res else 'No anomaly detection available.'}

Synthesize these multi-agent findings into a final actionable trader intelligence briefing with precise support, resistance, invalidation levels, and tactical recommendation.
"""

        try:
            raw_response = await gemini_client.generate(
                system_prompt=SYNTHESIS_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            data = json.loads(raw_response)
        except Exception as e:
            logger.error(f"Synthesis agent failed to parse LLM response: {e}")
            # Deterministic mathematical fallback for levels
            supp = sma20 or boll_low or round(close_val * 0.97, 2)
            res = boll_up or round(close_val * 1.04, 2)
            inval = round(supp - atr, 2)
            risk_dist = abs(close_val - inval) if (close_val and inval) else 1.0
            rew_dist = abs(res - close_val) if (close_val and res) else 2.0
            rr_ratio = f"1:{round(rew_dist / risk_dist, 1)}" if risk_dist > 0 else "1:2.0"

            tactical = "ACCUMULATE ON DIP" if tech_res and tech_res.signal == "bullish" else (
                "DEFENSIVE CONSOLIDATION" if tech_res and tech_res.signal == "neutral" else "CAUTION / TRAP RISK"
            )

            data = {
                "summary": f"Synthesis for {symbol.upper()} shows technical posture at {tech_res.signal if tech_res else 'neutral'} with news catalyst sentiment classified as {news_res.signal if news_res else 'neutral'}.",
                "tactical_setup": tactical,
                "signal": tech_res.signal if tech_res else "neutral",
                "confidence": "high" if tech_res and tech_res.confidence == "high" else "moderate",
                "evidence_strength": "strong" if tech_res and news_res else "moderate",
                "catalyst_alignment": "ALIGNED CONVICTION" if tech_res and news_res and tech_res.signal == news_res.signal else "TECHNICAL MOMENTUM",
                "actionable_levels": {
                    "immediate_support": f"Rs {supp}",
                    "key_resistance": f"Rs {res}",
                    "invalidation_level": f"Rs {inval}",
                    "reward_risk_ratio": rr_ratio
                },
                "trader_takeaway": f"Maintain discipline around Rs {supp} key support. Invalidation rule triggers below Rs {inval}.",
                "key_factors": [
                    f"Price trading relative to 20-DMA (Rs {sma20 or 'N/A'})",
                    f"Momentum RSI at {rsi or 'N/A'}"
                ],
                "uncertainty_note": "Ensure position size aligns with stop-loss distance to prevent adverse slippage.",
                "evidence": []
            }

        # Consolidate all evidence items from sub-agents
        consolidated_evidence: List[Evidence] = []
        for ag in [tech_res, news_res, anom_res]:
            if ag and ag.evidence:
                consolidated_evidence.extend(ag.evidence)

        evidence_strength = data.get("evidence_strength", "moderate").lower()
        if evidence_strength not in ["strong", "moderate", "limited"]:
            evidence_strength = "moderate"

        signal_val = data.get("signal", "neutral").lower()
        if signal_val not in ["bullish", "neutral", "bearish"]:
            signal_val = "neutral"

        conf_val = data.get("confidence", "moderate").lower()
        if conf_val not in ["high", "moderate", "low"]:
            conf_val = "moderate"

        # Format comprehensive findings string combining tactical setup and actionable levels
        tactical_setup = data.get("tactical_setup", "RANGE-BOUND NEUTRAL")
        levels = data.get("actionable_levels", {})
        supp_str = levels.get("immediate_support", "N/A")
        res_str = levels.get("key_resistance", "N/A")
        inval_str = levels.get("invalidation_level", "N/A")
        rr_str = levels.get("reward_risk_ratio", "N/A")
        takeaway = data.get("trader_takeaway", "")
        summary_text = data.get("summary", "Synthesis complete.")

        formatted_findings = (
            f"🎯 TACTICAL SETUP: {tactical_setup}\n\n"
            f"{summary_text}\n\n"
            f"📊 ACTIONABLE TRADING LEVELS:\n"
            f"• Key Support: {supp_str}\n"
            f"• Key Resistance: {res_str}\n"
            f"• Invalidation Level: {inval_str}\n"
            f"• Estimated Risk-Reward: {rr_str}\n\n"
            f"💡 TRADER ACTIONABLE TAKEAWAY:\n{takeaway}"
        )

        synthesis_result = AgentResult(
            agent_name=self.name,
            symbol=symbol.upper(),
            findings=formatted_findings,
            signal=signal_val,
            confidence=conf_val,
            evidence=consolidated_evidence,
            timestamp=datetime.now()
        )

        # Store complete analysis in database
        trade_date_str = str(quote.get("trade_date") or date.today().isoformat())
        await db.save_agent_analysis({
            "symbol": symbol.upper(),
            "analysis_date": trade_date_str,
            "analysis_type": context.get("trigger", "on_demand"),
            "technical_summary": tech_res.findings if tech_res else None,
            "technical_signal": tech_res.signal if tech_res else None,
            "technical_indicators": [e.model_dump() for e in tech_res.evidence] if tech_res else None,
            "news_summary": news_res.findings if news_res else None,
            "news_sentiment": news_res.signal if news_res else None,
            "news_sources": [e.model_dump() for e in news_res.evidence] if news_res else None,
            "anomaly_detected": anom_res.signal != "neutral" if anom_res else False,
            "anomaly_summary": anom_res.findings if anom_res else None,
            "anomaly_metrics": [e.model_dump() for e in anom_res.evidence] if anom_res else None,
            "synthesis": synthesis_result.findings,
            "evidence_strength": evidence_strength,
            "uncertainty_note": data.get("uncertainty_note", "Standard market volatility risks apply."),
            "key_factors": data.get("key_factors", []),
            "raw_payload": json.dumps(data)
        })

        return synthesis_result

synthesis_agent = SynthesisAgent()
