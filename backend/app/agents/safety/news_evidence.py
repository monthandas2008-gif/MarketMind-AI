"""
News Evidence Analyst Agent for the Trade Safety Committee.
Evaluates whether verified financial news items from MarketMind's News Desk
materially validate or contradict the user's trade direction.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime

from app.agents.safety.base import BaseSafetyAgent
from app.agents.safety.schemas import NewsEvidenceOutput, NewsEvidenceItem
from app.agents.safety.prompts import NEWS_EVIDENCE_SYSTEM_PROMPT


class NewsEvidenceAnalyst(BaseSafetyAgent):
    def __init__(self):
        super().__init__(
            agent_name="News Evidence Analyst",
            agent_type="news_evidence",
            schema_class=NewsEvidenceOutput,
            system_prompt=NEWS_EVIDENCE_SYSTEM_PROMPT
        )

    async def analyze(
        self,
        ticker: str,
        direction: str,
        news_articles: Optional[List[Dict[str, Any]]] = None,
        user_api_key: Optional[str] = None
    ) -> NewsEvidenceOutput:
        articles = news_articles or []
        parsed_items: List[NewsEvidenceItem] = []
        positive_count = 0
        negative_count = 0

        for a in articles[:6]:
            source_name = a.get("source_name", "Financial Press")
            # Assign source reliability tier
            rel = "MEDIUM"
            src_lower = source_name.lower()
            if "exchange" in src_lower or "sebi" in src_lower or "bse" in src_lower or "nse" in src_lower:
                rel = "HIGHEST"
            elif "investor" in src_lower or "filing" in src_lower:
                rel = "HIGH"
            elif any(p in src_lower for p in ["economic times", "livemint", "moneycontrol", "reuters", "bloomberg"]):
                rel = "MEDIUM"

            headline = a.get("headline", "")
            # Simple keyword sentiment detection for deterministic baseline
            h_lower = headline.lower()
            sentiment = "NEUTRAL"
            if any(w in h_lower for w in ["profit", "surges", "growth", "order", "rally", "upgrade", "deal"]):
                sentiment = "POSITIVE"
                positive_count += 1
            elif any(w in h_lower for w in ["drop", "decline", "fall", "loss", "probe", "downgrade", "penalty", "war", "risk"]):
                sentiment = "NEGATIVE"
                negative_count += 1

            parsed_items.append(
                NewsEvidenceItem(
                    headline=headline,
                    publisher=source_name,
                    published_at=str(a.get("published_at", "")),
                    source_url=a.get("source_url", ""),
                    source_reliability=rel,
                    sentiment=sentiment,
                    materiality="MEDIUM",
                    category="COMPANY",
                    fact_or_speculation="FACT" if rel in ["HIGHEST", "HIGH"] else "MIXED"
                )
            )

        # Baseline evidence signal
        if positive_count > negative_count and positive_count > 0:
            baseline_signal = "POSITIVE"
        elif negative_count > positive_count and negative_count > 0:
            baseline_signal = "NEGATIVE"
        elif positive_count == 0 and negative_count == 0 and not articles:
            baseline_signal = "INSUFFICIENT_DATA"
        else:
            baseline_signal = "NEUTRAL"

        dir_clean = direction.upper().strip()
        contradiction = (dir_clean == "LONG" and baseline_signal == "NEGATIVE") or \
                        (dir_clean == "SHORT" and baseline_signal == "POSITIVE")

        fallback_dict = {
            "evidence_signal": baseline_signal,
            "confidence": 75 if articles else 50,
            "reasoning": [
                f"Evaluated {len(articles)} verified media reports for {ticker}.",
                f"Identified {positive_count} positive and {negative_count} adverse news catalysts.",
                "Corporate headline flow indicates standard quarterly developments." if articles else "No high-impact corporate alerts found."
            ],
            "news_items": [item.model_dump() for item in parsed_items],
            "risk_flags": ["Adverse headlines conflict with trade direction"] if contradiction else []
        }

        articles_summary = "\n".join([
            f"- [{item.publisher}] {item.headline} (URL: {item.source_url})"
            for item in parsed_items
        ]) or "No recent corporate headlines detected."

        user_prompt = f"""EVALUATE NEWS EVIDENCE FOR PROPOSED TRADE:
- Ticker: {ticker}
- Trade Direction: {dir_clean}
- Verified News Articles ({len(parsed_items)} items):
{articles_summary}

Determine whether current verified news materially supports or poses headline risk against this {dir_clean} trade."""

        return await self.run(
            context_prompt=user_prompt,
            user_api_key=user_api_key,
            deterministic_fallback=fallback_dict
        )


news_evidence_analyst = NewsEvidenceAnalyst()
