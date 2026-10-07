"""
Pydantic Schemas and Typed Contracts for the Trade Safety Committee.
Defines all inputs, deterministic metrics, and structured outputs for each of the 5 agents + reviewer.
"""

from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime


# =====================================================================
# 1. ENUMS & LITERALS
# =====================================================================

AgentStatus = Literal["COMPLETED", "UNAVAILABLE", "FAILED"]

MarketRiskLevel = Literal["LOW", "MODERATE", "HIGH", "EXTREME", "UNKNOWN"]
SupportsTrade = Literal["YES", "NO", "UNCLEAR"]

PortfolioRiskStatus = Literal["SAFE", "CAUTION", "LIMIT_REACHED", "INSUFFICIENT_DATA"]

PlanQuality = Literal["STRONG", "ADEQUATE", "WEAK", "INCOMPLETE", "INSUFFICIENT_DATA"]

NewsEvidenceSignal = Literal["POSITIVE", "NEGATIVE", "MIXED", "NEUTRAL", "INSUFFICIENT_DATA"]
SourceReliability = Literal["HIGHEST", "HIGH", "MEDIUM", "LOW_MEDIUM", "VERY_LOW"]
NewsFactType = Literal["FACT", "SPECULATION", "MIXED"]

BehaviourStatus = Literal["HEALTHY", "ATTENTION_NEEDED", "PAUSE_RECOMMENDED"]

SafetyRecommendation = Literal[
    "SAFE_TO_REVIEW",
    "PROCEED_WITH_CAUTION",
    "PAUSE_AND_REVIEW",
    "DO_NOT_PROCEED"
]

AgentDisagreement = Literal["LOW", "MEDIUM", "HIGH"]


# =====================================================================
# 2. DETERMINISTIC CALCULATIONS MODEL
# =====================================================================

class DeterministicSafetyCalculations(BaseModel):
    capital: float = 100000.0
    requested_quantity: int = 0
    recommended_quantity: int = 0
    entry_price: float = 0.0
    stop_loss: float = 0.0
    target: float = 0.0
    requested_risk_amount: float = 0.0
    recommended_risk_amount: float = 0.0
    estimated_charges: float = 0.0
    estimated_slippage: float = 0.0
    estimated_worst_case_loss: float = 0.0
    remaining_daily_risk_budget: float = 0.0
    proposed_sector_exposure_percent: float = 0.0
    proposed_single_stock_concentration_percent: float = 0.0
    risk_reward_ratio: float = 0.0


# =====================================================================
# 3. INDIVIDUAL AGENT OUTPUT SCHEMAS
# =====================================================================

class MarketContext(BaseModel):
    market_direction: str = "Neutral"
    volatility: str = "Normal"
    breadth: str = "Balanced"
    regime: str = "Consolidation"


class MarketRiskOutput(BaseModel):
    agent_name: str = "Market Risk Analyst"
    agent_type: str = "market_risk"
    status: AgentStatus = "COMPLETED"
    market_risk: MarketRiskLevel = "MODERATE"
    confidence: int = Field(default=70, ge=0, le=100)
    reasoning: List[str] = Field(default_factory=list)
    market_context: MarketContext = Field(default_factory=MarketContext)
    supports_trade: SupportsTrade = "UNCLEAR"
    risk_flags: List[str] = Field(default_factory=list)
    data_timestamps: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class PortfolioRiskOutput(BaseModel):
    agent_name: str = "Portfolio Risk Analyst"
    agent_type: str = "portfolio_risk"
    status: AgentStatus = "COMPLETED"
    risk_status: PortfolioRiskStatus = "SAFE"
    confidence: int = Field(default=80, ge=0, le=100)
    reasoning: List[str] = Field(default_factory=list)
    calculations: DeterministicSafetyCalculations = Field(default_factory=DeterministicSafetyCalculations)
    breaches: List[str] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class TradePlanOutput(BaseModel):
    agent_name: str = "Trade Plan Analyst"
    agent_type: str = "trade_plan"
    status: AgentStatus = "COMPLETED"
    plan_quality: PlanQuality = "ADEQUATE"
    confidence: int = Field(default=75, ge=0, le=100)
    reasoning: List[str] = Field(default_factory=list)
    missing_fields: List[str] = Field(default_factory=list)
    logical_issues: List[str] = Field(default_factory=list)
    invalidating_conditions: List[str] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class NewsEvidenceItem(BaseModel):
    headline: str
    publisher: str = "Financial Press"
    published_at: str = ""
    source_url: str = ""
    source_reliability: SourceReliability = "MEDIUM"
    sentiment: Literal["POSITIVE", "NEGATIVE", "MIXED", "NEUTRAL"] = "NEUTRAL"
    materiality: Literal["LOW", "MEDIUM", "HIGH"] = "MEDIUM"
    category: Literal["COMPANY", "SECTOR", "MACRO", "REGULATORY", "MARKET"] = "COMPANY"
    fact_or_speculation: NewsFactType = "FACT"


class NewsEvidenceOutput(BaseModel):
    agent_name: str = "News Evidence Analyst"
    agent_type: str = "news_evidence"
    status: AgentStatus = "COMPLETED"
    evidence_signal: NewsEvidenceSignal = "NEUTRAL"
    confidence: int = Field(default=70, ge=0, le=100)
    reasoning: List[str] = Field(default_factory=list)
    news_items: List[NewsEvidenceItem] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class DetectedBehaviourPattern(BaseModel):
    pattern: str
    severity: Literal["LOW", "MEDIUM", "HIGH"] = "MEDIUM"
    evidence: List[str] = Field(default_factory=list)
    recommendation: str = ""


class BehaviourOutput(BaseModel):
    agent_name: str = "Behavioural Coach"
    agent_type: str = "behaviour"
    status: AgentStatus = "COMPLETED"
    behaviour_status: BehaviourStatus = "HEALTHY"
    confidence: int = Field(default=85, ge=0, le=100)
    reasoning: List[str] = Field(default_factory=list)
    detected_patterns: List[DetectedBehaviourPattern] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class DataSourceCitation(BaseModel):
    label: str
    url: Optional[str] = None


class ReviewerOutput(BaseModel):
    agent_name: str = "Trade Safety Reviewer"
    agent_type: str = "reviewer"
    status: AgentStatus = "COMPLETED"
    safety_recommendation: SafetyRecommendation = "PROCEED_WITH_CAUTION"
    confidence: int = Field(default=75, ge=0, le=100)
    reasoning: List[str] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    counter_evidence: List[str] = Field(default_factory=list)
    agent_disagreement: AgentDisagreement = "LOW"
    key_risks: List[str] = Field(default_factory=list)
    what_would_change_review: List[str] = Field(default_factory=list)
    data_sources: List[DataSourceCitation] = Field(default_factory=list)
    disclaimer: str = (
        "Educational research only. MarketMind does not execute orders or provide personalized financial advice."
    )
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


# =====================================================================
# 4. COMMITTEE API REQUEST & RESPONSE SCHEMAS
# =====================================================================

class TradeSafetyReviewRequest(BaseModel):
    ticker: str
    direction: Literal["LONG", "SHORT"] = "LONG"
    entry_price: float
    stop_loss: Optional[float] = None
    target: Optional[float] = None
    quantity: int = 1
    strategy: str = "Discretionary"
    setup: str = "Price Action Support/Resistance"
    notes: Optional[str] = ""
    capital: Optional[float] = None
    risk_percent: Optional[float] = None
    force_refresh: bool = False
    user_id: Optional[str] = None


class CommitteeAgentsPayload(BaseModel):
    market_risk: MarketRiskOutput
    portfolio_risk: PortfolioRiskOutput
    trade_plan: TradePlanOutput
    news_evidence: NewsEvidenceOutput
    behaviour: BehaviourOutput
    reviewer: ReviewerOutput


class TradeSafetyReviewResponse(BaseModel):
    workflow_id: str
    generated_at: str
    market_session: str
    ticker: str
    safety_recommendation: SafetyRecommendation
    overall_confidence: int
    agents: CommitteeAgentsPayload
    deterministic_calculations: Dict[str, Any]
    disclaimer: str = (
        "Educational research and trade decision quality review. "
        "MarketMind does not execute trades, place orders, or provide financial advice."
    )


# =====================================================================
# 5. RISK CALCULATOR, JOURNAL & PROFILE SCHEMAS
# =====================================================================

class PositionCalculationRequest(BaseModel):
    capital: float = Field(..., gt=0, description="Available trading capital in INR")
    risk_percent: float = Field(1.0, gt=0, le=10.0, description="Max risk percentage per trade")
    entry_price: float = Field(..., gt=0)
    stop_loss: float = Field(..., ge=0)
    target: Optional[float] = None
    instrument_type: str = "EQUITY"
    direction: Literal["BUY", "SELL"] = "BUY"


class PositionCalculationResponse(BaseModel):
    capital: float
    risk_percent: float
    max_risk_amount: float
    risk_per_share: float
    maximum_quantity: int
    recommended_quantity: int
    position_value: float
    estimated_charges: float
    estimated_slippage: float
    net_risk_with_friction: float
    worst_case_loss: float
    capital_commitment_percent: float
    reward_risk_ratio: float
    formula_notes: str


class RiskProfileRequest(BaseModel):
    user_id: str
    trading_capital: float = Field(..., gt=0)
    risk_per_trade_percent: float = Field(1.0, gt=0, le=10.0)
    max_daily_loss_percent: float = Field(3.0, gt=0, le=20.0)
    max_open_positions: int = Field(5, ge=1, le=20)
    max_sector_exposure_percent: float = Field(25.0, gt=0, le=100.0)
    max_single_stock_exposure_percent: float = Field(15.0, gt=0, le=100.0)
    max_trades_per_day: int = Field(6, ge=1, le=50)
    cooling_off_minutes: int = Field(30, ge=5, le=240)
    account_mode: str = "paper"


class RiskProfileResponse(RiskProfileRequest):
    id: Optional[str] = None
    updated_at: Optional[str] = None


class TradeJournalEntryRequest(BaseModel):
    user_id: str
    ticker: str
    direction: Literal["BUY", "SELL"] = "BUY"
    entry_price: float
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    target: Optional[float] = None
    quantity: int
    entry_time: str
    exit_time: Optional[str] = None
    charges: float = 0.0
    net_pnl: float = 0.0
    status: Literal["OPEN", "CLOSED"] = "OPEN"
    exit_reason: Optional[str] = None
    trade_plan_id: Optional[str] = None


class TradeJournalAnalyticsResponse(BaseModel):
    total_trades: int
    win_rate_percent: float
    profit_factor: float
    expectancy_per_trade: float
    max_drawdown: float
    longest_losing_streak: int
    gross_pnl: float
    total_charges: float
    net_pnl: float
    loss_streak_active: bool
    status_summary: str

