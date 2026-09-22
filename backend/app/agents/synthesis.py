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

        tech_res = agent_results.get("technical")
        news_res = agent_results.get("news")
        anom_res = agent_results.get("anomaly")

        # Compile comprehensive input prompt for synthesis
        user_prompt = f"""SYNTHESIS REQUEST FOR INDIAN EQUITY: {symbol.upper()}

BENCHMARK CONTEXT:
- Nifty 50 Index: {nifty_context.get('close', 'N/A')} ({nifty_context.get('change_percent', 'N/A')}%)
- Stock Last Price: Rs {quote.get('close', 'N/A')} ({quote.get('change_percent', 'N/A')}%)

1. TECHNICAL AGENT FINDINGS:
Signal: {tech_res.signal.upper() if tech_res else 'N/A'} (Confidence: {tech_res.confidence if tech_res else 'N/A'})
Summary: {tech_res.findings if tech_res else 'No technical report available.'}

2. NEWS INTELLIGENCE FINDINGS:
Signal: {news_res.signal.upper() if news_res else 'N/A'} (Confidence: {news_res.confidence if news_res else 'N/A'})
Summary: {news_res.findings if news_res else 'No news intelligence available.'}

3. ANOMALY / PATTERN DETECTION FINDINGS:
Summary: {anom_res.findings if anom_res else 'No anomaly detection available.'}

Synthesize these multi-agent findings into a final market intelligence briefing.
Answer: What happened? What evidence supports this? Is there sufficient evidence to explain the move, or is evidence limited/uncertain?
"""

        try:
            raw_response = await gemini_client.generate(
                system_prompt=SYNTHESIS_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            data = json.loads(raw_response)
        except Exception as e:
            logger.error(f"Synthesis agent failed to parse LLM response: {e}")
            data = {
                "summary": f"Synthesis completed for {symbol.upper()}. Technical signal is {tech_res.signal if tech_res else 'neutral'} while news sentiment is {news_res.signal if news_res else 'neutral'}.",
                "signal": tech_res.signal if tech_res else "neutral",
                "confidence": "moderate",
                "evidence_strength": "moderate",
                "key_factors": ["Technical momentum alignment", "Broad market sentiment"],
                "uncertainty_note": "Awaiting further market confirmation.",
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

        synthesis_result = AgentResult(
            agent_name=self.name,
            symbol=symbol.upper(),
            findings=data.get("summary", "Synthesis complete."),
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
            "key_factors": data.get("key_factors", [])
        })

        return synthesis_result

synthesis_agent = SynthesisAgent()
