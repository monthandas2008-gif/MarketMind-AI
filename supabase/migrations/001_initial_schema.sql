-- MarketMind Initial Schema
-- Supabase PostgreSQL Migration
-- Created: 2026-09-18

-- ============================================================
-- 1. Stock Universe
-- ============================================================
CREATE TABLE IF NOT EXISTS stocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    exchange TEXT DEFAULT 'NSE',
    sector TEXT,
    yfinance_symbol TEXT NOT NULL,
    is_index BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Market Data (OHLCV)
-- ============================================================
CREATE TABLE IF NOT EXISTS market_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL REFERENCES stocks(symbol),
    trade_date DATE NOT NULL,
    open DECIMAL(12,2),
    high DECIMAL(12,2),
    low DECIMAL(12,2),
    close DECIMAL(12,2),
    volume BIGINT,
    change_percent DECIMAL(8,4),
    prev_close DECIMAL(12,2),
    source TEXT DEFAULT 'yfinance',
    fetched_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(symbol, trade_date)
);

-- ============================================================
-- 3. News Articles (with deduplication via url_hash)
-- ============================================================
CREATE TABLE IF NOT EXISTS news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url_hash TEXT UNIQUE NOT NULL,
    symbol TEXT,
    headline TEXT NOT NULL,
    summary TEXT,
    source_name TEXT,
    source_url TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    is_processed BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 4. Agent Analysis Results
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    analysis_date DATE NOT NULL,
    analysis_type TEXT NOT NULL,

    -- Technical Agent output
    technical_summary TEXT,
    technical_signal TEXT CHECK (technical_signal IN ('bullish', 'neutral', 'bearish')),
    technical_indicators JSONB,

    -- News Agent output
    news_summary TEXT,
    news_sentiment TEXT CHECK (news_sentiment IN ('positive', 'neutral', 'negative')),
    news_sources JSONB,

    -- Anomaly Agent output
    anomaly_detected BOOLEAN DEFAULT FALSE,
    anomaly_summary TEXT,
    anomaly_metrics JSONB,

    -- Synthesis Agent output
    synthesis TEXT,
    evidence_strength TEXT CHECK (evidence_strength IN ('strong', 'moderate', 'limited')),
    uncertainty_note TEXT,
    key_factors JSONB,

    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(symbol, analysis_date, analysis_type)
);

-- ============================================================
-- 5. Daily Market Reports
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_date DATE UNIQUE NOT NULL,
    market_summary TEXT NOT NULL,
    nifty_close DECIMAL(12,2),
    nifty_change_percent DECIMAL(8,4),
    top_gainers JSONB,
    top_losers JSONB,
    unusual_activity JSONB,
    technical_intelligence TEXT,
    news_intelligence TEXT,
    anomalies TEXT,
    ai_synthesis TEXT,
    evidence_strength TEXT CHECK (evidence_strength IN ('strong', 'moderate', 'limited')),
    sources JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. Chat / Query History
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_query TEXT NOT NULL,
    parsed_intent JSONB,
    response TEXT NOT NULL,
    response_data JSONB,
    agents_used TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_date
    ON market_data(symbol, trade_date DESC);

CREATE INDEX IF NOT EXISTS idx_news_symbol
    ON news(symbol);

CREATE INDEX IF NOT EXISTS idx_news_published
    ON news(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_url_hash
    ON news(url_hash);

CREATE INDEX IF NOT EXISTS idx_agent_analysis_symbol_date
    ON agent_analysis(symbol, analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date
    ON daily_reports(report_date DESC);

CREATE INDEX IF NOT EXISTS idx_chat_queries_created
    ON chat_queries(created_at DESC);

-- ============================================================
-- Seed: Initial Stock Universe
-- ============================================================
INSERT INTO stocks (symbol, company_name, exchange, sector, yfinance_symbol, is_index) VALUES
    ('NIFTY50', 'Nifty 50 Index', 'NSE', 'Index', '^NSEI', TRUE),
    ('RELIANCE', 'Reliance Industries Ltd', 'NSE', 'Energy', 'RELIANCE.NS', FALSE),
    ('TCS', 'Tata Consultancy Services Ltd', 'NSE', 'IT', 'TCS.NS', FALSE),
    ('INFY', 'Infosys Ltd', 'NSE', 'IT', 'INFY.NS', FALSE),
    ('ICICIBANK', 'ICICI Bank Ltd', 'NSE', 'Banking', 'ICICIBANK.NS', FALSE),
    ('ITC', 'ITC Ltd', 'NSE', 'FMCG', 'ITC.NS', FALSE)
ON CONFLICT (symbol) DO NOTHING;
