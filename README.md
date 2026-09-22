# MarketMind — AI-Powered Indian Stock Market Intelligence Agent

A full-stack, institutional-grade financial intelligence system built specifically for the Indian equity markets (NSE / BSE).

MarketMind continuously monitors benchmark indices (NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX), supports dynamic user-driven Indian equity tracking, executes deterministic mathematical calculations in Python, ingests deduplicated live financial news, and coordinates a team of 4 specialized AI reasoning desks to deliver explainable market intelligence.

---

## 1. Key Capabilities & System Features

### 📊 Real-Time Benchmark & Market Breadth Engine
- Live tracking of Nifty 50, Sensex, Bank Nifty, and India VIX with high-speed caching and request deduplication.
- Advance / Decline market breadth telemetry and sectoral momentum matrix (IT, Bank, Auto, Energy, FMCG).

### 🔍 Dynamic Indian Equity Tracking (Search → Track → Analyze)
- Search any Indian equity across NSE & BSE using the in-memory Instrument Master.
- 1-Click dynamic watchlist tracking with background cache warm-up.
- Newly tracked stocks immediately enter the **full 4-agent multi-desk analysis pipeline** with zero analytical degradation.

### 🤖 4-Desk Multi-Agent Intelligence System
- **Technical Analysis Desk**: Deterministic math (RSI-14, MACD, 20/50/200 SMA, Bollinger Bands, Volume Ratios) computed in Python (`numpy`, `ta`, `pandas`) — zero LLM arithmetic hallucination.
- **News Intelligence Desk**: Scrapes, extracts, and summarizes verified financial press (Economic Times, Moneycontrol, Livemint) with citation URLs.
- **Statistical Anomaly Desk**: Detects volume spikes and price breakouts using rolling standard deviations and volume Z-scores.
- **Lead Synthesis Desk**: Consolidates multi-desk telemetry into unified directional signals (Bullish / Neutral / Bearish) with evidence confidence ratings.

### 🧭 Collapsible Left Navigation Sidebar (AppShell)
- Uniform, institutional left navigation panel across all 7 terminal modules (`/dashboard`, `/markets`, `/stocks`, `/intelligence`, `/reports`, `/ask`, `/stock/[symbol]`).
- Instant 1-click chart switching from sidebar watchlist, Agent Mesh telemetry pulse, and quick modal triggers (`⌘K`).
- Preference persisted in browser storage (`localStorage`).

### 💬 Grounded AI Research Terminal (`/ask`)
- Conversational market intelligence powered by Google Gemini with live NSE/BSE context injection.
- Answers general market queries, stock comparisons, technical questions, and macroeconomic trends grounded in real-time data.
- Built-in **Sliding-Window Rate Limiter** (15 requests/hour) to eliminate unexpected billing.
- **Bring Your Own Gemini Key**: Users can insert their personal Google Gemini API key to unlock **unlimited, unrestricted AI queries**. Keys are securely encrypted at rest.

### 📑 Personalized Daily Portfolio Briefings (`/reports`)
- Generates bespoke end-of-day market briefings tailored to the user's specific tracked portfolio.
- Macro market briefings archive with date filtering, clipboard copying, and printable formats.

### 🔒 Enterprise-Grade Security
- Security headers on both FastAPI and Next.js (`X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`).
- Dynamic CORS whitelist supporting local development and production Vercel domains (`r"https://.*\.vercel\.app"`).
- Authenticated cryptographic encryption at rest for user API keys using PBKDF2 HMAC-SHA256 and AES-compatible keystreams.
- Input length sanitization and strict NaN/Infinity float sanitization (`NaNCompliantJSONResponse`).

---

## 2. Architecture & File Structure

```
MarketMind/
├── backend/                              # Python FastAPI high-performance backend
│   ├── app/
│   │   ├── agents/                       # Specialized AI Reasoning Desks
│   │   │   ├── technical.py              # Technical Analysis Desk (Math)
│   │   │   ├── news_intel.py             # News Intelligence Desk (RSS)
│   │   │   ├── anomaly.py                # Anomaly Detection Desk (Z-Score)
│   │   │   ├── synthesis.py              # Lead Synthesis Desk
│   │   │   └── orchestrator.py           # Multi-Agent Workflow Coordinator
│   │   ├── db/                           # Dual Database Client (Supabase / SQLite)
│   │   │   ├── client.py                 # Unified DB client with auto-fallback
│   │   │   └── queries.py                # Async data query helpers
│   │   ├── llm/                          # LLM Integration & Prompt Caching
│   │   │   ├── client.py                 # Gemini client with override key support
│   │   │   ├── cache.py                  # SHA-256 prompt response cache
│   │   │   └── prompts.py                # Institutional system prompts
│   │   ├── middleware/                   # Security & Throttling
│   │   │   └── rate_limiter.py           # Sliding-window rate limiter
│   │   ├── models/                       # Pydantic data schemas
│   │   ├── routes/                       # REST API Endpoints
│   │   │   ├── market.py                 # Quotes, history, overview, live sync
│   │   │   ├── analysis.py               # Single-stock multi-agent runs
│   │   │   ├── reports.py                # Daily macro market reports
│   │   │   ├── chat.py                   # Conversational AI terminal
│   │   │   └── user.py                   # Dynamic tracking & user briefings
│   │   ├── services/                     # Data Feeds & Security
│   │   │   ├── market_data.py            # yfinance feed with tiered in-memory caches
│   │   │   ├── news.py                   # RSS news extraction & deduplication
│   │   │   ├── instrument_master.py      # Indian equities instrument master
│   │   │   ├── key_manager.py            # Authenticated API key encryption
│   │   │   └── scheduler.py              # Automated 3:50 PM IST daily run
│   │   ├── config.py                     # Pydantic environment configuration
│   │   └── main.py                       # FastAPI application entrypoint
│   ├── .env.example                      # Backend environment variable template
│   └── requirements.txt                  # Python dependencies
├── frontend/                             # Next.js 16 (Turbopack) Web Terminal
│   ├── src/
│   │   ├── app/                          # Next.js App Router Pages
│   │   │   ├── page.tsx                  # Public Landing Page
│   │   │   ├── login/                    # Institutional Analyst Login
│   │   │   ├── dashboard/                # Live Trading Cockpit
│   │   │   ├── markets/                  # Market Breadth & Sector Matrix
│   │   │   ├── stocks/                   # Equities Screener & Tracker
│   │   │   ├── stock/[symbol]/           # Stock Deep Dive & Candlestick Chart
│   │   │   ├── intelligence/             # Multi-Agent Architecture Trail
│   │   │   ├── ask/                      # AI Research Terminal
│   │   │   └── reports/                  # Daily Intelligence Briefings Archive
│   │   ├── components/                   # Reusable UI Components
│   │   │   ├── AppShell.tsx              # Unified collapsible sidebar layout
│   │   │   ├── AppHeader.tsx             # Top header bar with IST clock & search
│   │   │   ├── DashboardSidebar.tsx      # Collapsible navigation & watchlist
│   │   │   ├── CandlestickChart.tsx      # TradingView lightweight-charts engine
│   │   │   └── common/                   # Sparklines, Gauges, Mesh Nodes
│   │   └── lib/                          # Client API & Utilities
│   │       ├── api.ts                    # API client with client cache & dedup
│   │       ├── auth.tsx                  # Client session management
│   │       ├── tracking.ts               # Dynamic tracking state hook
│   │       ├── formatters.ts             # INR currency & percentage formatters
│   │       └── types.ts                  # Shared TypeScript data models
│   ├── .env.example                      # Frontend environment variable template
│   ├── next.config.ts                    # Next.js production config with security headers
│   └── package.json                      # Node.js dependencies
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql        # Core tables & initial stock universe
│       └── 002_dynamic_tracking_and_user_keys.sql # Instruments, user tracking & keys
├── .gitignore                            # Production gitignore (ignoring secrets & DBs)
├── run_marketmind.bat                    # Windows one-click local launcher
└── README.md                             # Comprehensive documentation
```

---

## 3. Local Setup & Quick Start

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher (v20+ recommended)
- **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/MarketMind.git
cd MarketMind
```

### Step 2: Configure Backend Environment
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` with your preferred settings:
```ini
GEMINI_API_KEY=your_gemini_api_key_here     # (Optional: system fallback key)
GEMINI_MODEL=gemini-2.0-flash
SECRET_KEY=your_secure_master_secret_key    # Master key for encrypting user API keys
FRONTEND_URL=http://localhost:3000
```
*(Note: Supabase credentials are optional. If omitted, MarketMind automatically initializes a local SQLite database at `backend/marketmind_local.db` with identical schema!)*

### Step 3: Install Backend Dependencies & Start FastAPI Server
```bash
# In the backend directory
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start at `http://127.0.0.1:8000`. You can inspect the Swagger documentation at `http://127.0.0.1:8000/docs`.

### Step 4: Configure Frontend Environment & Start Next.js
Open a new terminal window:
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 4. Production Deployment Guide

### Deploying Frontend to Vercel
1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New"** → **"Project"**.
3. Import the `MarketMind` repository.
4. Set the **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend API URL (e.g. `https://marketmind-backend.onrender.com`).
6. Click **Deploy**. Vercel will compile the Next.js application using Turbopack with standalone output and full security headers.

### Deploying Backend (Render / Railway / Fly.io / AWS EC2)
1. In your cloud provider dashboard, deploy a new Python web service from the `backend` folder.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `FRONTEND_URL`: Your Vercel frontend domain (e.g. `https://marketmind.vercel.app`)
   - `GEMINI_API_KEY`: Google Gemini API key
   - `SECRET_KEY`: Long random string for encrypting user keys
   - `SUPABASE_URL`: (Optional) Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: (Optional) Your Supabase service role key

### Running Supabase Migrations
If using Supabase PostgreSQL:
1. Open your Supabase Dashboard → **SQL Editor**.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. Run `supabase/migrations/002_dynamic_tracking_and_user_keys.sql`.

---

## 5. Educational & Compliance Disclaimer
MarketMind is built strictly for **educational and research purposes**. Financial calculations, technical indicators, and multi-agent synthesis summaries represent analytical research frameworks and do not constitute financial advice, solicitation, or a recommendation to buy or sell securities. Always consult a SEBI-registered financial advisor before making investment decisions in the Indian equity markets.