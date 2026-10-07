# MarketMind — AI-Powered Indian Stock Market Intelligence

[![Live Platform](https://img.shields.io/badge/Live%20Terminal-market--mind--ai--tau.vercel.app-00df8f?style=for-the-badge&logo=vercel&logoColor=black)](https://market-mind-ai-tau.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=flat&logo=typescript)](https://typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An institutional-grade financial intelligence and multi-agent reasoning terminal built specifically for Indian equity markets (**NSE / BSE**).

🔗 **Live Web Application:** [https://market-mind-ai-tau.vercel.app/](https://market-mind-ai-tau.vercel.app/)

MarketMind continuously tracks major benchmark indices (**NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX**), calculates deterministic mathematical technical indicators in Python, ingests live financial news feeds, and coordinates a team of 4 specialized AI reasoning desks to deliver grounded, explainable market insights.

---

## Platform Preview

![MarketMind Terminal Overview](docs/assets/landing-page.png)

---

## Core Features

### 📊 Real-Time Market Engine & Breadth Telemetry
- **Live Benchmark Indices**: Real-time quotes and historical charts for NIFTY 50, SENSEX, BANK NIFTY, and INDIA VIX with asynchronous caching and request deduplication.
- **Market Breadth & Sector Matrix**: Live Advances/Declines ratio, top gainers, top losers, and sectoral momentum matrix (IT, Banking, Auto, Energy, FMCG).
- **Synchronized IST Market Clock**: Real-time Indian Standard Time (IST) clock with automatic market phase detection (Pre-Open, Regular Trading Session, Post-Market Close).

### 🤖 4-Desk Multi-Agent AI Reasoning Architecture
- **Technical Analysis Desk**: Deterministic math computed in Python (`numpy`, `pandas`, `ta`) — RSI-14, MACD (12, 26, 9), SMA-20/50, Bollinger Bands, and Volume Ratios — eliminating LLM arithmetic hallucination.
- **News Intelligence Desk**: Scrapes, deduplicates, and summarizes financial press (Economic Times, Moneycontrol, Livemint) with verifiable source URLs.
- **Statistical Anomaly Desk**: Detects volume surges and price breakouts using rolling standard deviations and volume Z-scores.
- **Lead Synthesis Desk**: Consolidates multi-desk telemetry into directional consensus signals (Bullish / Neutral / Bearish) with evidence confidence ratings.

### 🛡️ Trader Safety Intelligence — 5-Agent Trade Safety Committee *(NEW)*
- **Purpose**: Improve trade decision quality and help users avoid avoidable mistakes through transparent AI-agent review, risk awareness, and behavioural guardrails.
- **5-Agent Sequential Committee**:
  1. **Market Risk Analyst** — Assesses market environment (VIX, breadth, regime) and whether it supports the proposed trade.
  2. **Portfolio Risk Analyst** — Evaluates position sizing, sector/single-stock exposure, and daily risk budget using deterministic Python math.
  3. **Trade Plan Analyst** — Checks plan completeness (entry, stop-loss, target, invalidating condition) and logical consistency.
  4. **News Evidence Analyst** — Synthesizes recent financial news evidence for or against the trade.
  5. **Behavioural Coach** — Detects loss streaks, revenge trading, position size anomalies, and missing stop-losses.
- **Trade Safety Reviewer** — Aggregates all 5 agents into a final explainable safety card with one of: `SAFE_TO_REVIEW`, `PROCEED_WITH_CAUTION`, `PAUSE_AND_REVIEW`, or `DO_NOT_PROCEED`.
- **Deterministic Position Sizing Calculator** — Maximum safe quantity formula with SEBI statutory charges (STT, exchange, SEBI, stamp duty, GST) and execution slippage.
- **Trade Journal & Analytics** — Record trades, calculate win rate, profit factor, expectancy, max drawdown, and longest losing streak. All math is pure Python.
- **Risk Management Dashboard** — Configure risk profiles, view live portfolio exposure, and calculate position sizes.

> **Safety Constraints**: Zero LLM math — all financial calculations are deterministic Python functions. Gemini only summarizes evidence and explains uncertainty. No broker API integration, no order placement, no personalized financial advice, no guaranteed returns.

### 🔍 Dynamic Indian Equities Screener & Deep Dive Analysis
- **Universal Indian Ticker Search**: Search across NSE and BSE instruments using an in-memory cached Instrument Master.
- **Interactive Technical Charts**: High-performance TradingView lightweight candlestick charts with volume histograms and technical overlays.
- **Watchlist Synchronization**: Add or remove equities dynamically with instant background cache warm-up and multi-agent analysis.

### 💬 Grounded AI Research Terminal (`/ask`)
- **Context-Injected Market Chat**: Conversational AI research powered by Google Gemini, grounded in live NSE/BSE tick data and market news.
- **Sliding-Window Rate Limiter**: 15 requests/hour per user session to prevent API overuse and ensure predictable usage.
- **Bring Your Own Gemini API Key**: Users can insert their personal Google Gemini key to unlock unlimited, unmetered AI queries. Keys are encrypted at rest using PBKDF2-HMAC-SHA256.

### 📑 Tailored Daily Portfolio Briefings (`/reports`)
- Generates end-of-day market briefings customized to the user's actively tracked watchlist.
- Macro briefings archive with date filtering, markdown export, and one-click clipboard copying.

### 🔒 Enterprise Security & Master Admin Access Gatekeeping
- **Cryptographic Password Security**: PBKDF2-HMAC-SHA256 with 100,000 hashing rounds and 16-byte random cryptographic salts.
- **Tamper-Proof Session Tokens**: HMAC-SHA256 signed session tokens with constant-time verification (`hmac.compare_digest`).
- **Master Admin Access**: Restricted administrator access for `monthandas2008@gmail.com`.
- **User Approval Workflow**: All third-party registrations default to `pending` status and are gated (HTTP 403) until explicitly reviewed and approved by the Master Admin.
- **Admin Approvals Dashboard**: 1-click approve/reject actions and user roster management accessible exclusively to the Master Admin.
- **Zero Demo Credentials**: Completely purged of demo logins and auto-fill buttons for secure production deployment.

---

## System Architecture

```
MarketMind/
├── backend/                              # Python FastAPI Backend
│   ├── app/
│   │   ├── agents/                       # Specialized Multi-Agent AI Desks
│   │   │   ├── technical.py              # Technical Analysis (Deterministic Math)
│   │   │   ├── news_intel.py             # News Intelligence (RSS Extraction)
│   │   │   ├── anomaly.py                # Statistical Anomaly Detection (Z-Score)
│   │   │   ├── synthesis.py              # Lead Synthesis Consensus Engine
│   │   │   ├── orchestrator.py           # Multi-Agent Workflow Coordinator
│   │   │   └── safety/                   # Trader Safety Intelligence Module
│   │   │       ├── orchestrator.py       # Trade Safety Committee Coordinator
│   │   │       ├── market_risk.py        # Market Risk Analyst Agent
│   │   │       ├── portfolio_risk.py     # Portfolio Risk Analyst Agent
│   │   │       ├── trade_plan.py         # Trade Plan Analyst Agent
│   │   │       ├── news_evidence.py      # News Evidence Analyst Agent
│   │   │       ├── behaviour.py          # Behavioural Coach Agent
│   │   │       ├── reviewer.py           # Trade Safety Reviewer Agent
│   │   │       ├── schemas.py            # Pydantic Models & Typed Contracts
│   │   │       ├── prompts.py            # Role-Specific System Prompts
│   │   │       └── base.py              # Base Agent with Retry & Fallback
│   │   ├── db/                           # Database Client (Supabase / Local SQLite)
│   │   ├── llm/                          # Gemini LLM Integration & Prompt Caching
│   │   ├── middleware/                   # Security & Rate Limiting
│   │   ├── routes/                       # REST API Endpoints (Auth, Market, Chat, Reports, Safety)
│   │   └── services/                     # Data Feeds, Auth, Security & Safety Calculations
│   ├── tests/
│   │   ├── test_system.py                # End-to-end integration and security test suite
│   │   ├── test_safety_calculations.py   # Deterministic safety math unit tests
│   │   └── test_safety_committee.py      # 5-Agent committee workflow tests
│   ├── requirements.txt                  # Python dependencies
│   └── .env.example                      # Backend environment variable template
├── frontend/                             # Next.js 16 (Turbopack) Web Terminal
│   ├── src/
│   │   ├── app/                          # Next.js App Router Pages
│   │   │   ├── safety/                   # Trade Safety Review Page
│   │   │   ├── risk/                     # Risk Management Dashboard
│   │   │   └── journal/                  # Trade Journal & Analytics
│   │   ├── components/                   # UI Components, Modals & Visualizations
│   │   │   └── safety/                   # SafetyReviewCard, PositionSizeCalculator
│   │   └── lib/                          # API Client, Auth Context, Formatters, Safety Types
│   ├── package.json                      # Node.js dependencies
│   └── .env.example                      # Frontend environment variable template
├── supabase/
│   └── migrations/                       # PostgreSQL Schemas (001–004)
├── docs/
│   └── assets/                           # Visual Documentation Assets
│       └── landing-page.png              # High-Resolution Landing Page Screenshot
├── LICENSE                               # MIT License
└── README.md                             # Project Documentation
```

---

## Local Development & Setup

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher (v20+ recommended)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/monthandas2008-gif/MarketMind-AI.git
cd MarketMind-AI
```

### 2. Backend Setup
```bash
cd backend

# Create & activate virtual environment
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

Edit `backend/.env`:
```ini
GEMINI_API_KEY=your_gemini_api_key_here     # (Optional: system fallback key)
GEMINI_MODEL=gemini-2.0-flash
SECRET_KEY=your_secure_random_master_secret # Secret for signing tokens & encrypting keys
FRONTEND_URL=http://localhost:3000
```
*(Supabase credentials are optional. If omitted, MarketMind automatically falls back to a local SQLite database at `backend/marketmind_local.db`.)*

### 3. Run Automated System Tests
```bash
python tests/test_system.py
```
Validates password hashing, session tokens, master admin gatekeeping, user approval workflow, and deterministic technical indicator math.

### 4. Start Backend Server
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### 5. Frontend Setup
In a new terminal window:
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Educational & Compliance Disclaimer

MarketMind is designed and developed strictly for **educational, analytical, and research purposes**. Financial calculations, technical indicators, and multi-agent synthesis summaries represent analytical research frameworks and do not constitute financial advice, investment solicitation, or a recommendation to buy or sell any security. Always consult a SEBI-registered financial advisor before making investment decisions in the Indian equity markets.

---

## License

Distributed under the [MIT License](LICENSE).