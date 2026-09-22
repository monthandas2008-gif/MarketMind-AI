# MarketMind — AI-Powered Indian Stock Market Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=flat&logo=typescript)](https://typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack, institutional-grade financial intelligence and multi-agent reasoning terminal built specifically for the Indian equity markets (**NSE / BSE**).

MarketMind continuously monitors benchmark indices (**NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX**), calculates deterministic mathematical technical indicators in Python, aggregates deduplicated financial news feeds, and coordinates a team of 4 specialized AI reasoning desks to deliver grounded, explainable market intelligence.

---

## 1. Key Platform Features

### 📊 Real-Time Benchmark & Market Breadth Engine
- **Live Indices**: NIFTY 50, SENSEX, BANK NIFTY, and INDIA VIX with asynchronous caching and request deduplication.
- **Market Breadth**: Advances / Declines ratio, top gainers, top losers, and sectoral momentum matrix (IT, Bank, Auto, Energy, FMCG).
- **Synchronized IST Market Clock**: Dynamically displays current Indian Standard Time and market trading phases (Pre-Open, Regular Session, Post-Market Closing).

### 🔍 Dynamic Indian Equities Watchlist (Search → Track → Analyze)
- **Universal Indian Ticker Search**: Search across NSE and BSE instruments using an in-memory cached Instrument Master.
- **Dynamic Watchlists**: Add or remove stocks with instant background cache warm-up.
- **Zero Analytical Degradation**: Newly tracked tickers immediately enter the complete 4-agent reasoning pipeline.

### 🤖 4-Desk Multi-Agent Intelligence System
- **Technical Analysis Desk**: Deterministic math computed in Python (`numpy`, `ta`, `pandas`) — RSI-14, MACD (12, 26, 9), SMA-20/50, Bollinger Bands, and Volume Ratios — eliminating arithmetic hallucination.
- **News Intelligence Desk**: Scrapes, extracts, and summarizes verified financial press (Economic Times, Moneycontrol, Livemint) with complete citation URLs.
- **Statistical Anomaly Desk**: Detects volume surges and price breakouts using rolling standard deviations and volume Z-scores.
- **Lead Synthesis Desk**: Synthesizes cross-desk telemetry into directional consensus signals (Bullish / Neutral / Bearish) with confidence scores.

### 🧭 Collapsible Institutional Navigation (AppShell)
- Uniform, responsive collapsible left navigation panel across all 7 terminal modules (`/dashboard`, `/markets`, `/stocks`, `/intelligence`, `/reports`, `/ask`, `/stock/[symbol]`).
- Quick stock switching, global command palette (`⌘K` / `Ctrl+K`), and browser-persisted state.

### 💬 Grounded AI Research Terminal (`/ask`)
- Conversational market intelligence powered by Google Gemini, injected with live NSE/BSE context.
- Answers queries on stock comparisons, technical structures, earnings commentary, and macroeconomic trends.
- **Sliding-Window Rate Limiter**: Configured for 15 queries/hour per user session to avoid unexpected billing.
- **Bring Your Own Gemini API Key**: Users can supply their own Google Gemini key to unlock unlimited, unmetered AI queries. Keys are encrypted at rest using PBKDF2-HMAC-SHA256.

### 📑 Tailored Portfolio Briefings (`/reports`)
- Generates end-of-day intelligence reports specifically tailored to the user's active watchlist.
- Macro briefings archive with date filtering, markdown export, and one-click clipboard copying.

### 🔒 Enterprise Security & Master Admin Access Gatekeeping
- **Cryptographic Password Security**: User passwords hashed using PBKDF2-HMAC-SHA256 with 100,000 hashing rounds and 16-byte cryptographic random salts.
- **Tamper-Proof Session Tokens**: HMAC-SHA256 signed session tokens with constant-time verification (`hmac.compare_digest`).
- **Master Admin Access**: Configured for `monthandas2008@gmail.com` with full terminal management privileges.
- **Admin Approval Gatekeeping**: Any external user registration is placed in `pending` status (blocked with HTTP 403) until explicitly reviewed and approved by the Master Admin.
- **Interactive User Approvals Portal**: Master Admin modal accessible via sidebar and profile menu for 1-click approvals, rejections, and user roster management.
- **Zero Demo Credentials**: Completely purged of demo accounts, mock buttons, and insecure bypasses for clean production deployment.

---

## 2. Architecture & File Structure

```
MarketMind/
├── backend/                              # Python FastAPI high-performance backend
│   ├── app/
│   │   ├── agents/                       # Specialized Multi-Agent Desks
│   │   │   ├── base.py                   # Abstract agent interface
│   │   │   ├── technical.py              # Technical Analysis Desk (Deterministic Math)
│   │   │   ├── news_intel.py             # News Intelligence Desk (RSS Aggregator)
│   │   │   ├── anomaly.py                # Anomaly Detection Desk (Z-Scores)
│   │   │   ├── synthesis.py              # Lead Synthesis Desk (Consensus Engine)
│   │   │   └── orchestrator.py           # Multi-Agent Workflow Coordinator
│   │   ├── db/                           # Dual Database Client (Supabase / SQLite Fallback)
│   │   │   ├── client.py                 # Resilient database abstraction with local fallback
│   │   │   └── queries.py                # Asynchronous database query helpers
│   │   ├── llm/                          # LLM Integration & Prompt Caching
│   │   │   ├── client.py                 # Gemini client with override key support
│   │   │   ├── cache.py                  # SHA-256 prompt response cache
│   │   │   └── prompts.py                # Institutional system prompts
│   │   ├── middleware/                   # Security & Throttling
│   │   │   └── rate_limiter.py           # Sliding-window rate limiter
│   │   ├── models/                       # Pydantic data schemas
│   │   ├── routes/                       # REST API Endpoints
│   │   │   ├── auth.py                   # Master Admin Login, Register & Approvals
│   │   │   ├── market.py                 # Quotes, history, overview, live sync
│   │   │   ├── analysis.py               # Single-stock multi-agent runs
│   │   │   ├── reports.py                # Daily macro market reports
│   │   │   ├── chat.py                   # Conversational AI terminal
│   │   │   └── user.py                   # Dynamic tracking & user briefings
│   │   ├── services/                     # Data Feeds & Security
│   │   │   ├── auth_service.py           # PBKDF2 hashing & HMAC session tokens
│   │   │   ├── market_data.py            # yfinance feed with tiered in-memory caches
│   │   │   ├── news.py                   # RSS news extraction & deduplication
│   │   │   ├── instrument_master.py      # Indian equities instrument master
│   │   │   ├── key_manager.py            # Authenticated API key encryption at rest
│   │   │   └── scheduler.py              # Automated 3:50 PM IST daily run
│   │   ├── config.py                     # Pydantic environment configuration
│   │   └── main.py                       # FastAPI application entrypoint
│   ├── tests/
│   │   └── test_system.py                # End-to-end integration and security test suite
│   ├── .env.example                      # Backend environment variable template
│   └── requirements.txt                  # Python dependencies
├── frontend/                             # Next.js 16 (Turbopack) Web Terminal
│   ├── src/
│   │   ├── app/                          # Next.js App Router Pages
│   │   │   ├── page.tsx                  # Public Landing Page
│   │   │   ├── login/                    # Institutional Analyst Login & Register
│   │   │   ├── dashboard/                # Live Trading Cockpit
│   │   │   ├── markets/                  # Market Breadth & Sector Matrix
│   │   │   ├── stocks/                   # Equities Screener & Tracker
│   │   │   ├── stock/[symbol]/           # Stock Deep Dive & Candlestick Chart
│   │   │   ├── intelligence/             # Multi-Agent Architecture Trail
│   │   │   ├── ask/                      # AI Research Terminal
│   │   │   └── reports/                  # Daily Intelligence Briefings Archive
│   │   ├── components/                   # UI Components
│   │   │   ├── AppShell.tsx              # Unified collapsible sidebar layout
│   │   │   ├── AppHeader.tsx             # Top header bar with IST clock & search
│   │   │   ├── DashboardSidebar.tsx      # Collapsible navigation & watchlist
│   │   │   ├── AdminApprovalModal.tsx    # Master Admin User Approval Dashboard
│   │   │   ├── CandlestickChart.tsx      # TradingView lightweight-charts engine
│   │   │   └── common/                   # Sparklines, Gauges, Mesh Nodes
│   │   └── lib/                          # Client API & Utilities
│   │       ├── api.ts                    # API client with token header injection
│   │       ├── auth.tsx                  # User authentication context & approval checks
│   │       ├── tracking.ts               # Dynamic tracking state hook
│   │       ├── formatters.ts             # INR currency & percentage formatters
│   │       └── types.ts                  # Shared TypeScript data models
│   ├── .env.example                      # Frontend environment variable template
│   ├── next.config.ts                    # Next.js production config with security headers
│   ├── eslint.config.mjs                 # ESLint configuration
│   └── package.json                      # Node.js dependencies
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql        # Core tables & initial stock universe
│       ├── 002_dynamic_tracking_and_user_keys.sql # Instruments, user tracking & keys
│       └── 003_users_and_approval_workflow.sql    # Users table, PBKDF2 auth & approvals
├── .gitignore                            # Production gitignore (excluding secrets & DBs)
└── README.md                             # Platform documentation
```

---

## 3. Quick Start & Local Development

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher (v20+ recommended)
- **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/MarketMind.git
cd MarketMind
```

### Step 2: Backend Setup
```bash
cd backend

# Create & activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your settings:
```ini
GEMINI_API_KEY=your_gemini_api_key_here     # (Optional: system fallback key)
GEMINI_MODEL=gemini-2.0-flash
SECRET_KEY=your_secure_random_master_secret # Secret for signing tokens & encrypting keys
FRONTEND_URL=http://localhost:3000
```
*(Note: Supabase credentials are optional. If omitted, MarketMind automatically initializes a local SQLite database at `backend/marketmind_local.db`!)*

### Step 3: Run Backend Verification Tests
```bash
python tests/test_system.py
```
Expected output:
```
========================================
MarketMind Comprehensive Test Suite
========================================
-> Testing PBKDF2 password hashing & verification...
   [PASS] Password hashing & constant-time verification OK
-> Testing HMAC-SHA256 session tokens...
   [PASS] Session token signing & tamper-resistance OK
-> Testing Master Admin and user approval workflow...
   [PASS] Master Admin seeded credentials verified
   [PASS] New user registered with 'pending' approval status
   [PASS] Pending users listing verified
   [PASS] Admin 1-click user approval verified
   [PASS] User status rejection / revocation verified
-> Testing Technical Analysis Desk math computation & NaN sanitization...
   [PASS] NaN / Inf JSON sanitizers verified
   [PASS] Deterministic technical indicator calculations (RSI, SMA, MACD) OK
========================================
ALL TESTS PASSED SUCCESSFULLY! (4/4)
========================================
```

### Step 4: Start FastAPI Backend Server
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation is available at `http://127.0.0.1:8000/docs`.

### Step 5: Frontend Setup
In a new terminal window:
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Production Deployment Guide

### Deploying Frontend to Vercel
1. Push your repository to **GitHub**.
2. Go to the [Vercel Dashboard](https://vercel.com) and click **"Add New"** → **"Project"**.
3. Select your `MarketMind` repository.
4. In the **Project Configuration**:
   - Set **Root Directory** to `frontend`.
   - Leave Framework Preset as **Next.js**.
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g. `https://marketmind-backend.onrender.com`).
6. Click **Deploy**. Vercel will build the Next.js application using Turbopack with standalone optimization and security headers.

### Deploying Backend (Render / Railway / Fly.io / AWS EC2)
1. Deploy a new Python web service from the `backend/` directory.
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**:
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g. `https://marketmind.vercel.app`)
   - `GEMINI_API_KEY`: Google Gemini API key
   - `SECRET_KEY`: Long random string for encrypting user keys and signing session tokens
   - `SUPABASE_URL`: (Optional) Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: (Optional) Your Supabase service role key

### Running Supabase Migrations
If using Supabase PostgreSQL:
1. Open your Supabase Dashboard → **SQL Editor**.
2. Execute the migration scripts in sequential order:
   - `supabase/migrations/001_initial_schema.sql` (Core tables & instruments)
   - `supabase/migrations/002_dynamic_tracking_and_user_keys.sql` (User watchlists & API keys)
   - `supabase/migrations/003_users_and_approval_workflow.sql` (Users table, PBKDF2 auth & approvals)

---

## 5. Security & Access Gatekeeping

| Account Type | Default Credentials / Action | Access Level |
|---|---|---|
| **Master Admin** | `monthandas2008@gmail.com` | Full Terminal Access, Admin User Approvals Portal, Roster Management |
| **New Registrations** | Any personal/corporate email | Assigned `pending` status. Access is gated until approved by Master Admin |
| **Tamper Defense** | Constant-time PBKDF2 comparison + HMAC tokens | Blocks unauthorized tampering, brute force, and parameter poisoning |

---

## 6. Educational & Compliance Disclaimer

MarketMind is built strictly for **educational, analytical, and research purposes**. Financial calculations, technical indicators, and multi-agent synthesis summaries represent algorithmic research tools and do not constitute financial advice, investment solicitation, or a recommendation to buy or sell securities. Always consult a SEBI-registered financial advisor before making financial decisions in the Indian equity markets.

---

## 7. License

Distributed under the [MIT License](LICENSE).