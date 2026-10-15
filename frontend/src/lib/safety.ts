/**
 * TypeScript Interfaces and Typed API Client for Trader Safety Intelligence.
 * Strictly educational risk analytics, committee review, position sizing, and journal.
 */

export type SafetyRecommendation =
  | 'SAFE_TO_REVIEW'
  | 'PROCEED_WITH_CAUTION'
  | 'PAUSE_AND_REVIEW'
  | 'DO_NOT_PROCEED';

export interface DeterministicCalculations {
  capital: number;
  requested_quantity: number;
  recommended_quantity: number;
  entry_price: number;
  stop_loss: number;
  target?: number;
  requested_risk_amount: number;
  recommended_risk_amount: number;
  estimated_charges: number;
  estimated_slippage: number;
  estimated_worst_case_loss: number;
  remaining_daily_risk_budget: number;
  proposed_sector_exposure_percent: number;
  proposed_single_stock_concentration_percent: number;
  risk_reward_ratio?: number;
}

export interface MarketRiskAgentOutput {
  agent_name: string;
  agent_type: string;
  status: 'COMPLETED' | 'UNAVAILABLE' | 'FAILED';
  market_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' | 'UNKNOWN';
  confidence: number;
  reasoning: string[];
  market_context: {
    market_direction: string;
    volatility: string;
    breadth: string;
    regime: string;
  };
  supports_trade: 'YES' | 'NO' | 'UNCLEAR';
  risk_flags: string[];
  data_timestamps: string[];
  timestamp: string;
}

export interface PortfolioRiskAgentOutput {
  agent_name: string;
  agent_type: string;
  status: 'COMPLETED' | 'UNAVAILABLE' | 'FAILED';
  risk_status: 'SAFE' | 'CAUTION' | 'LIMIT_REACHED' | 'INSUFFICIENT_DATA';
  confidence: number;
  reasoning: string[];
  calculations: DeterministicCalculations;
  breaches: string[];
  risk_flags: string[];
  timestamp: string;
}

export interface TradePlanAgentOutput {
  agent_name: string;
  agent_type: string;
  status: 'COMPLETED' | 'UNAVAILABLE' | 'FAILED';
  plan_quality: 'STRONG' | 'ADEQUATE' | 'WEAK' | 'INCOMPLETE' | 'INSUFFICIENT_DATA';
  confidence: number;
  reasoning: string[];
  missing_fields: string[];
  logical_issues: string[];
  invalidating_conditions: string[];
  risk_flags: string[];
  timestamp: string;
}

export interface NewsEvidenceItem {
  headline: string;
  publisher: string;
  published_at?: string;
  source_url?: string;
  source_reliability: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'MIXED' | 'NEUTRAL';
  materiality: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'COMPANY' | 'SECTOR' | 'MACRO' | 'REGULATORY' | 'MARKET';
  fact_or_speculation: 'FACT' | 'SPECULATION' | 'MIXED';
}

export interface NewsEvidenceAgentOutput {
  agent_name: string;
  agent_type: string;
  status: 'COMPLETED' | 'UNAVAILABLE' | 'FAILED';
  evidence_signal: 'POSITIVE' | 'NEGATIVE' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
  confidence: number;
  reasoning: string[];
  news_items: NewsEvidenceItem[];
  risk_flags: string[];
  timestamp: string;
}

export interface DetectedBehaviourPattern {
  pattern: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence: string[];
  recommendation: string;
}

export interface BehaviourAgentOutput {
  agent_name: string;
  agent_type: string;
  status: 'COMPLETED' | 'UNAVAILABLE' | 'FAILED';
  behaviour_status: 'HEALTHY' | 'ATTENTION_NEEDED' | 'PAUSE_RECOMMENDED';
  confidence: number;
  reasoning: string[];
  detected_patterns: DetectedBehaviourPattern[];
  risk_flags: string[];
  timestamp: string;
}

export interface ReviewerAgentOutput {
  agent_name: string;
  agent_type: string;
  status: 'COMPLETED' | 'UNAVAILABLE' | 'FAILED';
  safety_recommendation: SafetyRecommendation;
  confidence: number;
  reasoning: string[];
  supporting_evidence: string[];
  counter_evidence: string[];
  agent_disagreement: 'LOW' | 'MEDIUM' | 'HIGH';
  key_risks: string[];
  what_would_change_review: string[];
  data_sources: Array<{ label: string; url?: string }>;
  disclaimer: string;
  timestamp: string;
}

export interface TradeSafetyReviewResponse {
  workflow_id: string;
  generated_at: string;
  market_session: string;
  ticker: string;
  safety_recommendation: SafetyRecommendation;
  overall_confidence: number;
  agents: {
    market_risk: MarketRiskAgentOutput;
    portfolio_risk: PortfolioRiskAgentOutput;
    trade_plan: TradePlanAgentOutput;
    news_evidence: NewsEvidenceAgentOutput;
    behaviour: BehaviourAgentOutput;
    reviewer: ReviewerAgentOutput;
  };
  deterministic_calculations: DeterministicCalculations;
  disclaimer: string;
}

export interface PositionCalculationRequest {
  capital: number;
  risk_percent: number;
  entry_price: number;
  stop_loss: number;
  target?: number;
  instrument_type?: string;
  direction?: 'BUY' | 'SELL';
}

export interface PositionCalculationResponse {
  capital: number;
  risk_percent: number;
  max_risk_amount: number;
  risk_per_share: number;
  maximum_quantity: number;
  recommended_quantity: number;
  position_value: number;
  estimated_charges: number;
  estimated_slippage: number;
  net_risk_with_friction: number;
  worst_case_loss: number;
  capital_commitment_percent: number;
  reward_risk_ratio: number;
  formula_notes: string;
}

export interface RiskProfile {
  id?: string;
  user_id: string;
  trading_capital: number;
  risk_per_trade_percent: number;
  max_daily_loss_percent: number;
  max_open_positions: number;
  max_sector_exposure_percent: number;
  max_single_stock_exposure_percent: number;
  max_trades_per_day: number;
  cooling_off_minutes: number;
  account_mode: string;
  updated_at?: string;
}

export interface JournalAnalytics {
  total_trades: number;
  win_rate_percent?: number;
  win_rate_pct?: number;
  profit_factor: number;
  expectancy_per_trade?: number;
  expectancy?: number;
  max_drawdown: number;
  longest_losing_streak: number;
  gross_pnl?: number;
  total_charges?: number;
  net_pnl?: number;
  total_net_pnl?: number;
  loss_streak_active?: boolean;
  status_summary?: string;
}

export interface TradeJournalEntry {
  id?: string;
  user_id: string;
  ticker: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  target?: number;
  quantity: number;
  entry_time: string;
  exit_time?: string;
  charges?: number;
  net_pnl?: number;
  status: 'OPEN' | 'CLOSED';
  exit_reason?: string;
  trade_plan_id?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function requestTradeSafetyReview(payload: {
  ticker: string;
  direction: 'LONG' | 'SHORT';
  entry_price: number;
  stop_loss?: number;
  target?: number;
  quantity: number;
  strategy?: string;
  setup?: string;
  notes?: string;
  capital?: number;
  risk_percent?: number;
  user_id?: string;
}): Promise<TradeSafetyReviewResponse> {
  const res = await fetch(`${API_BASE}/api/safety/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to execute safety review' }));
    throw new Error(err.detail || 'Safety review failed');
  }
  return res.json();
}

export async function calculatePositionSize(
  payload: PositionCalculationRequest
): Promise<PositionCalculationResponse> {
  const res = await fetch(`${API_BASE}/api/risk/position-calculator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to calculate position size' }));
    throw new Error(err.detail || 'Position sizing calculation failed');
  }
  return res.json();
}

export async function fetchRiskProfile(userId: string): Promise<RiskProfile> {
  const res = await fetch(`${API_BASE}/api/risk/profile?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch risk profile');
  return res.json();
}

export async function saveRiskProfile(profile: RiskProfile): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/risk/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to save risk profile');
  return res.json();
}

export async function fetchPortfolioExposure(userId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/risk/exposure?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch exposure');
  return res.json();
}

export interface TradePlan {
  id: string;
  user_id: string;
  ticker: string;
  direction: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  entry_price: number;
  stop_loss: number;
  target: number;
  quantity: number;
  instrument_type?: string;
  strategy?: string;
  setup?: string;
  planned_holding_period?: string;
  invalidating_condition?: string;
  user_notes?: string;
  status: 'DRAFT' | 'ACTIVE' | 'APPROVED' | 'ARCHIVED' | 'EXECUTED';
  created_at?: string;
}

export async function fetchTradePlans(userId: string): Promise<TradePlan[]> {
  const res = await fetch(`${API_BASE}/api/journal/plans?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch trade plans');
  const data = await res.json();
  return data.plans || [];
}

export async function fetchJournalTrades(userId: string): Promise<TradeJournalEntry[]> {
  const res = await fetch(`${API_BASE}/api/journal/trades?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch journal trades');
  const data = await res.json();
  return data.trades || [];
}

export async function recordJournalTrade(trade: TradeJournalEntry): Promise<{ status: string; trade_id?: string }> {
  const res = await fetch(`${API_BASE}/api/journal/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trade),
  });
  if (!res.ok) throw new Error('Failed to record trade');
  return res.json();
}

export async function fetchJournalAnalytics(userId: string): Promise<JournalAnalytics> {
  const res = await fetch(`${API_BASE}/api/journal/analytics?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch journal analytics');
  return res.json();
}

export async function recordSafetyOverride(payload: {
  user_id: string;
  workflow_id: string;
  override_reason: string;
}): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/safety/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to log safety override');
  return res.json();
}
