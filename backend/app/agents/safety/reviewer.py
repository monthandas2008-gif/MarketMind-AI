"""
Trade Safety Reviewer Agent for the Trade Safety Committee.
Acts as the final coordinator, synthesizing outputs from the 5 specialized analysts
into a cohesive, explainable Safety Review Card with explicit disagreement scoring.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime

from app.agents.safety.base import BaseSafetyAgent
from app.agents.safety.schemas import (
    ReviewerOutput,
    MarketRiskOutput,
    PortfolioRiskOutput,
    TradePlanOutput,
    NewsEvidenceOutput,
    BehaviourOutput,
    DataSourceCitation
)
from app.agents.safety.prompts import REVIEWER_SYSTEM_PROMPT


class TradeSafetyReviewer(BaseSafetyAgent):
    def __init__(self):
        super().__init__(
            agent_name="Trade Safety Reviewer",
            agent_type="reviewer",
            schema_class=ReviewerOutput,
            system_prompt=REVIEWER_SYSTEM_PROMPT
        )

    async def review(
        self,
        ticker: str,
        direction: str,
        market_risk: MarketRiskOutput,
        portfolio_risk: PortfolioRiskOutput,
        trade_plan: TradePlanOutput,
        news_evidence: NewsEvidenceOutput,
        behaviour: BehaviourOutput,
        user_api_key: Optional[str] = None
    ) -> ReviewerOutput:
        supporting_evidence: List[str] = []
        counter_evidence: List[str] = []
        key_risks: List[str] = []
        what_would_change: List[str] = []

        # Analyze agreements & conflicts
        if market_risk.supports_trade == "YES":
            supporting_evidence.append("Broader market regime and breadth align with trade direction.")
        elif market_risk.supports_trade == "NO":
            counter_evidence.append(f"Market Risk Analyst indicates headwind (Risk level: {market_risk.market_risk}).")
            key_risks.append(f"Adverse market breadth / volatility ({market_risk.market_risk})")

        if portfolio_risk.risk_status == "SAFE":
            supporting_evidence.append("Position size and sector exposure respect portfolio limits.")
        else:
            counter_evidence.append(f"Portfolio Risk Analyst flagged: {portfolio_risk.risk_status}.")
            for b in portfolio_risk.breaches:
                key_risks.append(b)
            what_would_change.append(f"Reducing trade quantity to recommended {portfolio_risk.calculations.recommended_quantity} shares.")

        if trade_plan.plan_quality in ["STRONG", "ADEQUATE"]:
            supporting_evidence.append(f"Trade plan is structured with valid invalidation parameters (Quality: {trade_plan.plan_quality}).")
        else:
            counter_evidence.append(f"Trade plan quality flagged as {trade_plan.plan_quality}.")
            for issue in trade_plan.logical_issues:
                key_risks.append(issue)
            if "stop_loss" in trade_plan.missing_fields:
                what_would_change.append("Defining an explicit price invalidation stop-loss below key support.")

        if news_evidence.evidence_signal in ["POSITIVE", "NEUTRAL"]:
            supporting_evidence.append("No adverse regulatory or high-impact corporate alerts found.")
        elif news_evidence.evidence_signal == "NEGATIVE":
            counter_evidence.append("News Evidence Analyst flagged adverse corporate/regulatory headlines.")
            key_risks.append("Adverse headline momentum")

        if behaviour.behaviour_status == "HEALTHY":
            supporting_evidence.append("Discipline metrics clean: zero revenge trading or streak tilt detected.")
        else:
            counter_evidence.append(f"Behavioural Coach flagged: {behaviour.behaviour_status}.")
            for p in behaviour.detected_patterns:
                key_risks.append(f"Behavioral pattern: {p.pattern}")
            what_would_change.append("Completing mandatory 1-hour screen cool-off period.")

        # Disagreement score calculation
        disagreement: str = "LOW"
        if len(supporting_evidence) > 0 and len(counter_evidence) >= 2:
            disagreement = "HIGH"
        elif len(counter_evidence) > 0:
            disagreement = "MEDIUM"

        # Deterministic Safety Recommendation Hierarchy:
        # 1. Missing stop-loss OR daily loss limit reached OR severe behavioral tilt -> DO_NOT_PROCEED or PAUSE_AND_REVIEW
        if "Missing Stop-Loss" in trade_plan.risk_flags or "stop_loss" in trade_plan.missing_fields:
            safety_rec = "DO_NOT_PROCEED"
        elif behaviour.behaviour_status == "PAUSE_RECOMMENDED" or portfolio_risk.risk_status == "LIMIT_REACHED":
            safety_rec = "PAUSE_AND_REVIEW"
        elif len(counter_evidence) >= 2 or market_risk.market_risk in ["HIGH", "EXTREME"] or portfolio_risk.risk_status == "CAUTION":
            safety_rec = "PROCEED_WITH_CAUTION"
        elif len(counter_evidence) == 0 and trade_plan.plan_quality == "STRONG":
            safety_rec = "SAFE_TO_REVIEW"
        else:
            safety_rec = "PROCEED_WITH_CAUTION"

        # Overall Confidence
        avg_confidence = int((
            market_risk.confidence +
            portfolio_risk.confidence +
            trade_plan.confidence +
            news_evidence.confidence +
            behaviour.confidence
        ) / 5)

        # Penalize confidence if high disagreement or missing data
        if disagreement == "HIGH":
            avg_confidence = max(40, avg_confidence - 15)
        elif disagreement == "MEDIUM":
            avg_confidence = max(50, avg_confidence - 5)

        data_sources = [
            DataSourceCitation(label="NSE Real-Time Telemetry", url="https://www.nseindia.com"),
            DataSourceCitation(label="MarketMind Technical Analysis Desk", url=None),
            DataSourceCitation(label="Verified Financial Press RSS Feeds", url=None)
        ]

        fallback_dict = {
            "safety_recommendation": safety_rec,
            "confidence": avg_confidence,
            "reasoning": [
                f"Consolidated findings across 5 Trade Safety Committee analysts for {direction.upper()} {ticker}.",
                f"Primary recommendation: {safety_rec} (Disagreement level: {disagreement}).",
                f"Identified {len(supporting_evidence)} supporting factors and {len(counter_evidence)} risk cautions."
            ],
            "supporting_evidence": supporting_evidence or ["Standard market participation"],
            "counter_evidence": counter_evidence or ["Standard market volatility risk"],
            "agent_disagreement": disagreement,
            "key_risks": key_risks or ["General market directional risk"],
            "what_would_change_review": what_would_change or ["Monitoring technical invalidation levels"],
            "data_sources": [ds.model_dump() for ds in data_sources],
            "disclaimer": "Educational research and decision quality guardrail only. MarketMind does not execute trades or provide financial advice."
        }

        user_prompt = f"""SYNTHESIZE FINAL TRADE SAFETY REVIEW FOR {direction.upper()} {ticker}:
- Market Risk Analyst: {market_risk.market_risk} (Supports: {market_risk.supports_trade})
- Portfolio Risk Analyst: {portfolio_risk.risk_status} (Breaches: {portfolio_risk.breaches or 'None'})
- Trade Plan Analyst: {trade_plan.plan_quality} (Issues: {trade_plan.logical_issues or 'None'})
- News Evidence Analyst: {news_evidence.evidence_signal}
- Behavioural Coach: {behaviour.behaviour_status} (Patterns: {[p.pattern for p in behaviour.detected_patterns] or 'None'})
- Baseline Recommendation: {safety_rec}
- Key Risks Identified: {key_risks}

Produce a transparent, balanced executive safety card synthesizing these 5 viewpoints."""

        return await self.run(
            context_prompt=user_prompt,
            user_api_key=user_api_key,
            deterministic_fallback=fallback_dict
        )


trade_safety_reviewer = TradeSafetyReviewer()
