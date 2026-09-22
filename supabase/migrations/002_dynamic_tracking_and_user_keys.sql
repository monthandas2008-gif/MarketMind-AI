-- MarketMind Migration 002: Dynamic Instrument Master, User Tracking, Personalized Reports & Encrypted Keys
-- Supabase PostgreSQL Migration
-- Created: 2026-09-23

-- ============================================================
-- 1. Instruments Master Table (All Indian Equities)
-- ============================================================
CREATE TABLE IF NOT EXISTS instruments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    exchange TEXT DEFAULT 'NSE',
    isin TEXT,
    series TEXT DEFAULT 'EQ',
    provider_symbol TEXT NOT NULL,
    sector TEXT NOT NULL,
    industry TEXT,
    market_cap_category TEXT DEFAULT 'Large Cap',
    is_active BOOLEAN DEFAULT TRUE,
    is_supported BOOLEAN DEFAULT TRUE,
    aliases TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments(symbol);
CREATE INDEX IF NOT EXISTS idx_instruments_sector ON instruments(sector);
CREATE INDEX IF NOT EXISTS idx_instruments_active ON instruments(is_active);

-- ============================================================
-- 2. User Tracked Stocks (Dynamic Watchlists)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_tracked_stocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    instrument_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    custom_group TEXT DEFAULT 'Default',
    report_enabled BOOLEAN DEFAULT TRUE,
    alert_enabled BOOLEAN DEFAULT TRUE,
    added_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_user_tracked_user_id ON user_tracked_stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tracked_symbol ON user_tracked_stocks(symbol);

-- ============================================================
-- 3. User Daily Reports (Personalized Portfolio Briefings)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    report_date DATE NOT NULL,
    stocks_snapshot JSONB NOT NULL,
    market_summary TEXT NOT NULL,
    nifty_close DECIMAL(12,2),
    nifty_change_percent DECIMAL(8,4),
    biggest_movers JSONB,
    technical_developments JSONB,
    news_intelligence JSONB,
    unusual_activity JSONB,
    cross_stock_insights JSONB,
    lead_synthesis TEXT,
    evidence_strength TEXT DEFAULT 'moderate',
    sources JSONB,
    data_freshness TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_reports_user_date ON user_daily_reports(user_id, report_date DESC);

-- ============================================================
-- 4. User API Keys (Encrypted Gemini Keys at Rest)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    encrypted_key TEXT NOT NULL,
    provider TEXT DEFAULT 'gemini',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);
