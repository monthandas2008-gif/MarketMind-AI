# MarketMind — Professor Presentation & Live Demo Guide

## Presentation Overview (15–20 Minutes)

Use this guide to walk your professor through the motivation, design decisions, multi-agent AI architecture, and live features of MarketMind.

---

## 1. Introduction & Problem Statement (2 Minutes)

- **The Problem:** 
  Most retail investors and market tools either rely on basic price charts or simple "LLM wrappers" that hallucinate stock predictions and make unsupported claims.
- **The Solution:** 
  **MarketMind** is an AI-powered market intelligence system for the Indian stock market. It uses a **multi-agent quantitative architecture** built from the ground up to deliver transparent, institutional-grade analytics.
- **Key Differentiator:** 
  - Real multi-agent division of labor (Technical, News, Anomaly, Synthesis).
  - Deterministic calculations first — numerical metrics (RSI, Moving Averages, Z-scores) are computed mathematically in Python, not by the LLM.
  - Zero hallucinations — all news claims cite verifiable source URLs.
  - 100% Free architecture — runs entirely on zero-cost APIs and free tiers.

---

## 2. Launching the System (1 Minute)

Show how easy it is to start:
1. Double click `run_marketmind.bat` (or run `./run_marketmind.ps1`).
2. Point out that the script starts the **Python FastAPI Backend** on port 8000 and the **Next.js Web Application** on port 3000, then automatically opens `http://localhost:3000`.

---

## 3. Live Demo Step-by-Step (10–12 Minutes)

### Step A: The Real-Time Dashboard (`/`)
- Point out the **NIFTY 50 Benchmark card**: live price, session change, and advance/decline status.
- Show the **Watchlist selector**: Reliance, TCS, Infosys, ICICI Bank, ITC.
- Highlight the **Statistical Anomalies & Volume Surges card**:
  - *"Notice that our statistical engine flagged TCS for unusual volume (2.46x 20-day average) and price change (-3.88%). This was detected mathematically using Z-Scores."*
- Highlight the **Verified Indian Market News feed**:
  - Show that each article is pulled live from Google News RSS or Economic Times with outlet attribution and links.
- Highlight the **Latest AI Market Intelligence brief**:
  - Shows the executive summary synthesized from the end-of-day market brief.

### Step B: Single-Stock Deep Dive (`/stock/RELIANCE` or `/stock/TCS`)
- Click on **RELIANCE** or **TCS**.
- Show the **TradingView Candlestick Chart**:
  - Switch between `1mo`, `3mo`, `6mo`, `1y` timeframes.
  - Point out that this is rendered locally using open-source TradingView `lightweight-charts` with real daily OHLCV data.
- Show the **Deterministic Financial Stats Bar**:
  - 14-day RSI, 20-day SMA, 50-day SMA, MACD, Volume Ratio, and ATR.
  - *"These are computed mathematically by our Python backend using the 'ta' library — zero LLM hallucination."*
- Show the **Multi-Agent Breakdown Panels**:
  - **Lead Synthesis Agent:** Overall analytical signal (e.g. `NEUTRAL` or `BEARISH`), confidence score, evidence strength, and remaining market uncertainty.
  - **Technical Agent:** Interprets momentum and key moving averages.
  - **News Agent:** Synthesizes verified recent media coverage with external links.
  - **Anomaly Agent:** Summarizes whether trading is within normal statistical distribution or unusual.
- Click the **"Run Live Analysis"** button:
  - Watch the 4 agents trigger live, re-evaluate the latest data, and update the UI in real time!

### Step C: Ask MarketMind Conversational Terminal (`/ask`)
- Click **"Ask MarketMind"** in the top navigation.
- Show the **Conversational Terminal**:
  - Click the suggested prompt: *"Why did TCS move today?"*
  - Point out the agent badge: *"Notice the system activated Technical, News, Anomaly, and Synthesis agents."*
  - Show the response: grounded in verified numbers and news with explicit evidence strength.
- Try a comparative query:
  - Type: *"Compare TCS and INFY"*
  - Show the comparative breakdown of both IT giants.
- Try a volume query:
  - Type: *"Which stocks had unusual volume?"*
  - Show the anomaly engine surfacing the stocks with high volume ratios.

### Step D: Daily Reports Archive (`/reports`)
- Navigate to **Daily Reports**.
- Explain the **Automated Pipeline**:
  - Configured with `APScheduler` to run every trading day at **3:50 PM IST** (after market close).
  - Automatically skips weekends and official NSE trading holidays (Holi, Diwali, Republic Day, etc.).
- Click **"Generate Today's Report"**:
  - Demonstrates generating a complete end-of-day institutional brief on demand.
  - Review the executive synthesis, 3-pillar breakdown, and verified citations list.

### Step E: Gemini API Key Configuration Modal
- Click the **"Gemini"** button in the top right navbar.
- Show the popup modal:
  - Demonstrates that the user can paste their Gemini API key directly from Google AI Studio.
  - Explain the fallback mode: even without an API key, the system demonstrates full end-to-end functionality.

---

## 4. Technical Architecture Questions & Answers

### Q1: "Why did you build a multi-agent system instead of a single prompt?"
**Answer:** 
> *"A single large prompt mixes data collection, indicator calculation, and text generation, which leads to high hallucination rates and uncontrollable costs. By separating concerns into specialized agents (Technical, News, Anomaly, Synthesis), each agent has a focused job and structured schema. We can also choose to trigger only necessary agents, saving up to 80% of API tokens."*

### Q2: "How do you prevent the AI from hallucinating stock prices or news?"
**Answer:** 
> *"First, all numerical indicator calculations and statistical anomalies are computed deterministically in Python before any LLM is called. Second, our News Agent strictly enforces provenance — every claim must cite a verified headline, publisher, and URL. If no news is found, the agent is instructed to state that no news exists rather than making something up."*

### Q3: "What is the cost of running this system?"
**Answer:** 
> *"Zero dollars ($0.00). We use yfinance for market data, Google News RSS for news, Google Gemini Flash on its generous free tier (15 requests/minute), and Supabase PostgreSQL with SQLite local fallback."*

---

## 5. Summary Checklist Before Presenting

- [ ] Run `run_marketmind.bat`
- [ ] Verify `http://localhost:3000` loads in browser
- [ ] Check server status indicator in top navbar is green (`LIVE`)
- [ ] Test one stock analysis page (`/stock/RELIANCE`)
- [ ] Test one question in `/ask`
