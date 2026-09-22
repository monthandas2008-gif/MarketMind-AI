"""
NewsIntelligenceAgent for MarketMind.
Analyzes verified Indian financial news, evaluates sentiment and corporate catalysts,
and preserves exact URLs and outlet attribution for total evidence provenance.
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

from app.agents.base import AnalysisAgent
from app.models.analysis import AgentResult, Evidence
from app.llm.client import gemini_client
from app.llm.prompts import NEWS_SYSTEM_PROMPT
from app.services.news import news_service

logger = logging.getLogger(__name__)

class NewsIntelligenceAgent(AnalysisAgent):
    @property
    def name(self) -> str:
        return "news"

    async def analyze(self, symbol: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        context = context or {}
        articles: List[Dict[str, Any]] = context.get("news")
        if articles is None:
            articles = await news_service.fetch_stock_news(symbol, days=3, limit=8)

        if not articles:
            # Explicit evidence absence — never hallucinate
            return AgentResult(
                agent_name=self.name,
                symbol=symbol.upper(),
                findings=f"No high-impact news stories detected for {symbol.upper()} within the recent monitored window. Movement is more likely driven by technical momentum, sector rotation, or broader market sentiment.",
                signal="neutral",
                confidence="moderate",
                evidence=[
                    Evidence(
                        claim="No idiosyncratic company news headlines published in past 3 days.",
                        source="Google News / Indian Financial Media RSS",
                        source_url=None,
                        data_point={"articles_found": 0}
                    )
                ],
                timestamp=datetime.now()
            )

        # Format real articles for the prompt
        formatted_articles = []
        for idx, a in enumerate(articles[:8], 1):
            formatted_articles.append(
                f"[{idx}] {a['headline']}\n"
                f"    Source: {a['source_name']} | Published: {a.get('published_at', 'Recent')}\n"
                f"    Link: {a['source_url']}\n"
                f"    Excerpt: {a.get('summary', '')[:200]}"
            )

        user_prompt = f"""Evaluate the recent financial news coverage for Indian equity: {symbol.upper()}

VERIFIED RECENT ARTICLES:
{chr(10).join(formatted_articles)}

Identify any significant corporate events (earnings, management changes, regulatory circulars, large orders, sector cues), evaluate the sentiment, and cite the specific articles as evidence.
"""

        try:
            raw_response = await gemini_client.generate(
                system_prompt=NEWS_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            data = json.loads(raw_response)
        except Exception as e:
            logger.error(f"News agent failed to parse LLM response: {e}")
            data = {
                "summary": f"Recent media coverage includes {len(articles)} articles regarding {symbol.upper()} operations and market performance.",
                "sentiment": "neutral",
                "confidence": "moderate",
                "evidence": []
            }

        evidence_list = []
        for ev in data.get("evidence", []):
            evidence_list.append(Evidence(
                claim=ev.get("claim", ""),
                source=ev.get("source", "Financial Media"),
                source_url=ev.get("source_url"),
                data_point=ev.get("data_point")
            ))

        # Guarantee factual evidence provenance if model missed it
        if not evidence_list and articles:
            top_a = articles[0]
            evidence_list.append(Evidence(
                claim=top_a["headline"],
                source=top_a.get("source_name", "Financial Press"),
                source_url=top_a.get("source_url"),
                data_point={"published_at": top_a.get("published_at")}
            ))

        sentiment = data.get("sentiment", "neutral").lower()
        signal_mapping = {"positive": "bullish", "negative": "bearish", "neutral": "neutral"}
        signal_val = signal_mapping.get(sentiment, "neutral")

        conf_val = data.get("confidence", "moderate").lower()
        if conf_val not in ["high", "moderate", "low"]:
            conf_val = "moderate"

        return AgentResult(
            agent_name=self.name,
            symbol=symbol.upper(),
            findings=data.get("summary", "News intelligence analysis complete."),
            signal=signal_val,
            confidence=conf_val,
            evidence=evidence_list,
            timestamp=datetime.now()
        )

news_agent = NewsIntelligenceAgent()
