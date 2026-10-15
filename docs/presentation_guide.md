# MarketMind — Professor Presentation & Live Demo Guide

## Presentation Overview (15–20 Minutes)

Use this guide to walk your faculty evaluator, project guide, or examination committee through the real-world problem statement, design decisions, dual multi-agent AI architecture, and live institutional features of **MarketMind**.

---

## 🌐 Live Deployment & Demo Credentials

- **Live Deployed Application**: [https://market-mind-ai-tau.vercel.app/](https://market-mind-ai-tau.vercel.app/)
- **GitHub Repository**: [https://github.com/monthandas2008-gif/MarketMind-AI](https://github.com/monthandas2008-gif/MarketMind-AI)
- **Master Admin Demo Account**:
  - **Email**: `monthandas2008@gmail.com`
  - **Password**: `Manthan@69`
  - **Role**: `admin` (Full access to all modules, pre-seeded portfolio, and terminal tools)

*(Alternative Local Run: Double-click `run_marketmind.bat` or run `./run_marketmind.ps1` to launch FastAPI on port 8000 and Next.js on port 3000).*

---

## 1. Introduction & Problem Statement (2 Minutes)

- **The Problem:** 
  Indian retail traders face severe challenges:
  1. Over 90% of retail traders lose money due to lack of strict risk management, emotional revenge trading, and trading without a defined stop-loss.
  2. Mainstream AI tools either generate generic, ambiguous text or use black-box "LLM wrappers" that hallucinate stock prices and arithmetic.
- **The Solution:** 
  **MarketMind** is a comprehensive, institutional-grade AI market terminal and risk intelligence platform tailored specifically for Indian equities (NSE/BSE).
- **Core Architecture Highlights:**
  - **Zero LLM Math Hallucination**: Every financial indicator, position size, P&L, SEBI charge, and exposure percentage is computed by deterministic Python functions.
  - **Dual Multi-Agent Systems**:
    1. **4-Desk Market Research Mesh**: Technical, News Intel, Anomaly Detection, and Lead Synthesis.
    2. **5-Agent Trade Safety Committee**: Market Risk, Portfolio Risk, Trade Plan Analyst, News Evidence, and Behavioural Coach.
  - **Audited Evidence Provenance**: Every news claim is grounded with source citations and external URLs.
  - **100% Free & Open-Source Stack**: Next.js 16, FastAPI, Supabase PostgreSQL with SQLite local fallback, yfinance, and Google Gemini API free tier.

---

## 2. Live Demo Step-by-Step (12–15 Minutes)

### Step A: Terminal Workspace & Upgraded Multi-Agent Live Mesh (`/dashboard`)
1. **Real-time Market Telemetry**:
   - Point out the synchronized IST market clock with session state (*Regular Trading Session / Post-Market Close*).
   - Show the **NIFTY 50**, **SENSEX**, **BANK NIFTY**, and **INDIA VIX** sparkline cards.
   - Point out the Advance/Decline Market Breadth gauge and NSE Sector Rotation matrix.
2. **Interactive Candlestick Chart**:
   - Click on the ticker switch pills (`RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, `TATAMOTORS`, `ICICIBANK`, `ITC`).
   - Notice how the chart and the Multi-Agent desk update instantly.
3. **Upgraded AI Multi-Agent Live Mesh (Core Highlight)**:
   - **Left Columns (Specialized Desks)**:
     - **Technical Analysis Desk**: Shows moving averages, RSI, and support levels in plain, human-friendly language.
     - **News Intelligence Desk**: Summarizes verified press developments with verified citation count.
     - **Anomaly & Volume Desk**: Z-score volume checks to detect abnormal liquidity or spikes.
   - **Right Column (Lead Synthesis Node)**:
     - **Tactical Setup Badge**: Explains the exact strategy (e.g. `ACCUMULATE ON DIP`, `BREAKOUT WATCH`, `RANGE-BOUND ACCUMULATE`).
     - **4-Box Key Trading Levels**:
       - 🛡️ **Key Support**: Precise support price derived from 20/50-DMA and Bollinger bands.
       - 🎯 **Target / Resistance**: Key resistance ceiling.
       - ⛔ **Safety Stop-Loss**: Exact invalidation boundary.
       - ⚖️ **Risk-Reward Ratio**: Mathematical edge ratio (e.g. `1:2.8`).
     - **Disciplined Trader Action**: Direct, simple advice on how to trade the setup safely without emotional panic.
     - **1-Click Button**: *"Test in Safety Committee"* to immediately validate the trade.

---

### Step B: Institutional Portfolio Management (`/portfolio`)
1. **Overview & Performance**:
   - Shows ₹5,00,000 baseline paper capital, Net Realised P&L, and Win Rate (60.0% — 6 Wins / 4 Losses).
2. **Four Specialized Tabs**:
   - **Overview Tab**: Live sector exposure progress bars (Energy, IT, Banking, Cash Reserve) and Best/Worst trade highlights (ITC: +₹2,896 vs TATAMOTORS: -₹1,059).
   - **Positions Tab**: Active holdings (RELIANCE, TCS, HDFCBANK) with live CMP, Stop-Loss, and unrealised P&L.
   - **Trades Tab**: 10 audited historical trades showing holding period, SEBI statutory charges, and net takeaway.
   - **Analytics Tab**: Profit Factor (1.92x), Expectancy per trade (+₹357), and average holding duration.

---

### Step C: Trader Safety Intelligence — 5-Agent Committee (`/safety`)
1. **The Core User Value**:
   - Explain: *"Before taking any trade, retail traders should subject their plan to a multidisciplinary committee review."*
2. **Run a Live Review**:
   - Pre-filled or enter a trade plan (e.g. `RELIANCE`, `BUY`, Entry: ₹2,940, Stop-Loss: ₹2,880, Target: ₹3,080, Qty: 15).
   - Click **"Run Safety Review"**.
   - Show the 5 sequential agents evaluating:
     1. **Market Risk Analyst**: Evaluates broader market regime and VIX.
     2. **Portfolio Risk Analyst**: Verifies sector exposure and single-stock concentration limits.
     3. **Trade Plan Analyst**: Checks completeness of entry, stop-loss, and invalidating conditions.
     4. **News Evidence Analyst**: Checks for negative corporate or regulatory catalysts.
     5. **Behavioural Coach**: Checks for revenge trading and loss streaks.
   - Show the final **Explainable Safety Review Card** with clear verdict (`SAFE_TO_REVIEW`, `PROCEED_WITH_CAUTION`, etc.).

---

### Step D: Risk Management & Capital Safeguards (`/risk`)
1. **Live Capital Allocation**:
   - Shows total capital deployment bar and sector concentration caps.
2. **Downside At Risk**:
   - Sum of potential capital loss across all open stop-losses.
3. **Editable Risk Parameters**:
   - Click **"Adjust Risk Parameters"** to modify Trading Capital, Risk % Per Trade, and Daily Loss Cap.
4. **Deterministic Position Size Calculator**:
   - Enter Entry, Stop-Loss, and Capital.
   - Demonstrates the maximum safe quantity formula with statutory deductions (STT, GST, Exchange fees).

---

### Step E: Trade Journal & Execution Log (`/journal`)
1. **Trade Plans Tab**:
   - Demonstrates pre-trade setups with explicit **Invalidating Conditions** (e.g. *"Daily close below ₹2,880 50-DMA"*).
   - Click **"Review"** to trigger a safety check on that plan.
2. **Execution History Tab**:
   - Audited trade ledger with exact statutory charges and net P&L.
3. **Performance Analytics Tab**:
   - Peak-to-trough Drawdown, Win Rate, and Gross vs Net P&L financial reconciliation.

---

### Step F: Conversational AI Terminal (`/ask`)
1. Click **Ask AI** in the navbar or sidebar.
2. Type queries like:
   - *"What is the support and resistance for RELIANCE?"*
   - *"Compare TCS and INFY performance"*
3. Show that the answer is grounded in live market quotes and news with explicit evidence confidence.

---

## 3. Defense Questions & Viva FAQ

### Q1: "How do you guarantee that the AI will never hallucinate mathematical calculations?"
> **Answer:** 
> *"We enforce a strict architectural boundary: LLMs are never permitted to perform arithmetic. All technical indicators (RSI, SMA, MACD, Bollinger Bands), position sizing, P&L calculations, SEBI charges, and portfolio exposure percentages are computed deterministically in pure Python using NumPy and Pandas before any prompt is assembled. Gemini is only used to synthesize natural language explanations."*

### Q2: "Why do you have two separate multi-agent workflows?"
> **Answer:** 
> *"They address two distinct user problems:
> 1. **The 4-Desk Market Mesh (`orchestrator.py`)** is an exploratory intelligence system answering 'What is happening with this stock right now?' (Technical + News + Anomaly + Lead Synthesis).
> 2. **The 5-Agent Safety Committee (`safety/orchestrator.py`)** is a defensive risk guardrail answering 'Is it safe for this specific user to take this proposed trade plan right now?' (Market Risk + Portfolio Risk + Plan Quality + News + Behavioural Coach)."*

### Q3: "What is your regulatory compliance stance regarding SEBI?"
> **Answer:** 
> *"MarketMind strictly adheres to SEBI educational guidelines. It is explicitly an educational research terminal: it does NOT provide personalized investment recommendations, place real-money orders, connect to broker APIs, or promise guaranteed returns. Every output includes timestamps, uncertainty limitations, and an educational disclaimer."*

### Q4: "How does the dual-database fallback architecture work?"
> **Answer:** 
> *"MarketMind uses Supabase PostgreSQL for cloud persistence. When deployed locally or during cloud network outages, the backend automatically falls back to an embedded SQLite database (`marketmind_local.db`) with identical schema and tables, ensuring zero downtime."*

---

## 4. Pre-Presentation Checklist

- [ ] Open the live deployment: [https://market-mind-ai-tau.vercel.app/](https://market-mind-ai-tau.vercel.app/)
- [ ] Sign in with the master admin account (`monthandas2008@gmail.com` / `Manthan@69`)
- [ ] Verify **Terminal Workspace (`/dashboard`)** shows the upgraded Lead Synthesis levels
- [ ] Verify **Portfolio (`/portfolio`)** displays open positions and analytics
- [ ] Verify **Trade Journal (`/journal`)** displays active trade plans
- [ ] Verify **Trade Safety (`/safety`)** runs the 5-agent committee successfully
