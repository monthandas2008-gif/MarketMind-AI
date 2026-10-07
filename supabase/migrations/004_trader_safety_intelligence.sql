-- Migration: 004_trader_safety_intelligence.sql
-- Description: Adds tables for Trader Safety Intelligence module (Trade Safety Committee)

-- 1. Risk Profiles table
CREATE TABLE IF NOT EXISTS risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    trading_capital NUMERIC NOT NULL DEFAULT 100000.0,
    risk_per_trade_percent NUMERIC NOT NULL DEFAULT 1.0,
    max_daily_loss_percent NUMERIC NOT NULL DEFAULT 3.0,
    max_open_positions INTEGER NOT NULL DEFAULT 5,
    max_sector_exposure_percent NUMERIC NOT NULL DEFAULT 25.0,
    max_single_stock_exposure_percent NUMERIC NOT NULL DEFAULT 15.0,
    max_trades_per_day INTEGER NOT NULL DEFAULT 6,
    cooling_off_minutes INTEGER NOT NULL DEFAULT 30,
    account_mode TEXT NOT NULL DEFAULT 'paper',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trade Plans table
CREATE TABLE IF NOT EXISTS trade_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    direction TEXT NOT NULL,
    entry_price NUMERIC NOT NULL,
    stop_loss NUMERIC NOT NULL,
    target NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    instrument_type TEXT NOT NULL DEFAULT 'EQUITY',
    strategy TEXT,
    setup TEXT,
    planned_holding_period TEXT,
    invalidating_condition TEXT,
    user_notes TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trades Journal table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    trade_plan_id UUID REFERENCES trade_plans(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    direction TEXT NOT NULL,
    entry_price NUMERIC NOT NULL,
    exit_price NUMERIC,
    stop_loss NUMERIC,
    target NUMERIC,
    quantity INTEGER NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    charges NUMERIC DEFAULT 0.0,
    net_pnl NUMERIC DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'OPEN',
    exit_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Safety Reviews table
CREATE TABLE IF NOT EXISTS safety_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    trade_plan_id UUID REFERENCES trade_plans(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    overall_verdict TEXT NOT NULL,
    safety_score INTEGER NOT NULL,
    summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    market_risk_agent JSONB,
    portfolio_risk_agent JSONB,
    trade_plan_agent JSONB,
    news_evidence_agent JSONB,
    behavioural_coach_agent JSONB,
    deterministic_math JSONB,
    critical_flags JSONB,
    warnings JSONB,
    educational_takeaway TEXT,
    market_session TEXT DEFAULT 'REGULAR',
    user_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    override_acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Safety Agent Runs (audit/traceability)
CREATE TABLE IF NOT EXISTS safety_agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    safety_review_id UUID REFERENCES safety_reviews(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    status TEXT NOT NULL,
    input_payload JSONB,
    output_payload JSONB,
    execution_time_ms NUMERIC,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_safety_reviews_user_ticker ON safety_reviews(user_id, ticker);
CREATE INDEX IF NOT EXISTS idx_safety_reviews_created ON safety_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_plans_user ON trade_plans(user_id);
