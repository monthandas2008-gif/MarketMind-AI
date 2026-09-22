/**
 * MarketMind TypeScript type definitions
 * Mirrors the backend Pydantic models
 */

export interface StockInfo {
  symbol: string;
  company_name: string;
  exchange: string;
  sector: string;
  yfinance_symbol: string;
  is_index?: boolean;
  is_active?: boolean;
}

export interface MarketDataPoint {
  symbol: string;
  trade_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change_percent: number;
  prev_close: number;
  source: string;
}

export interface BenchmarkIndex {
  symbol: string;
  name: string;
  close: number;
  change_percent: number;
  prev_close?: number;
}

export interface SectorPerformance {
  sector: string;
  change_percent: number;
  leaders: string[];
  status: 'bullish' | 'neutral' | 'bearish';
}

export interface StockMover {
  symbol: string;
  company_name: string;
  close: number;
  change_percent: number;
  volume: number;
  sector?: string;
  signal?: 'bullish' | 'neutral' | 'bearish';
}

export interface MarketOverview {
  nifty_close: number;
  nifty_change_percent: number;
  benchmarks?: Record<string, BenchmarkIndex>;
  top_gainers: StockMover[];
  top_losers: StockMover[];
  advances?: number;
  declines?: number;
  sectors?: SectorPerformance[];
  timestamp: string;
}

export interface Evidence {
  claim: string;
  source: string;
  source_url: string | null;
  data_point: string | null;
}

export type Signal = 'bullish' | 'neutral' | 'bearish';
export type Confidence = 'high' | 'moderate' | 'low';
export type EvidenceStrength = 'strong' | 'moderate' | 'limited';

export interface AgentResult {
  agent_name: string;
  symbol: string;
  findings: string;
  signal: Signal;
  confidence: Confidence;
  evidence: Evidence[];
  timestamp: string;
}

export interface StockAnalysis {
  symbol: string;
  technical: AgentResult | null;
  news: AgentResult | null;
  anomaly: AgentResult | null;
  synthesis: AgentResult | null;
  analysis_date: string;
}

export interface DailyReport {
  report_date: string;
  market_summary: string;
  nifty_close: number;
  nifty_change_percent: number;
  top_gainers: StockMover[];
  top_losers: StockMover[];
  unusual_activity: Record<string, unknown>[];
  technical_intelligence: string;
  news_intelligence: string;
  anomalies: string;
  ai_synthesis: string;
  evidence_strength: EvidenceStrength;
  sources: Record<string, unknown>[];
  created_at: string;
}

export interface ReportSummary {
  report_date: string;
  market_summary: string;
  nifty_change_percent: number;
}

export interface ChatRequest {
  query: string;
}

export interface ChatResponse {
  query: string;
  response: string;
  agents_used: string[];
  response_data: Record<string, unknown> | null;
  created_at: string;
}

export interface Instrument {
  id: string;
  symbol: string;
  company_name: string;
  exchange: string;
  isin?: string;
  series: string;
  provider_symbol: string;
  sector: string;
  industry?: string;
  market_cap_category: string;
  is_active: boolean;
  is_supported: boolean;
  aliases: string[];
}

export interface InstrumentSearchResult {
  symbol: string;
  company_name: string;
  sector: string;
  industry?: string;
  market_cap_category: string;
  match_type: 'symbol' | 'name' | 'alias' | 'sector';
  is_tracked?: boolean;
}

export interface UserTrackedStock {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string;
  sector: string;
  instrument_id?: string;
  is_active: boolean;
  priority: number;
  custom_group: string;
  report_enabled: boolean;
  alert_enabled: boolean;
  added_at: string;
  quote?: MarketDataPoint | null;
  signal?: Signal;
  evidence_strength?: EvidenceStrength;
}

export interface UserDailyReport {
  id: string;
  user_id: string;
  report_date: string;
  stocks_snapshot: string[];
  market_summary: string;
  nifty_close: number;
  nifty_change_percent: number;
  biggest_movers: StockMover[];
  technical_developments: string;
  news_intelligence: string;
  unusual_activity: Record<string, unknown>[];
  cross_stock_insights: string;
  lead_synthesis: string;
  evidence_strength: EvidenceStrength;
  sources: { name: string; url: string }[];
  data_freshness?: string;
  analyses?: Record<string, StockAnalysis>;
  created_at?: string;
}

