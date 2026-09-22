# MarketMind Frontend — Web Intelligence Terminal

The official frontend interface for **MarketMind** — an AI-powered financial intelligence workstation built specifically for the Indian equity market (NSE/BSE).

---

## Features & Highlights

- **Obsidian Dark Canvas & Glassmorphic Architecture**: Institutional dark theme (`#05070c`) with fine 1px borders, subtle ambient emerald/cyan radial glows, and backdrop blur.
- **Floating Command Header & Global Spotlight**: Sticky top navigation with real-time Indian Market Status (IST clock, trading hours check), live micro-ticker pills (NIFTY 50, SENSEX), `Ctrl+K` command palette, quick search, and dynamic Gemini API Key configuration.
- **Neon SVG Sparkline Cards**: Real-time wave charts with gradients for NIFTY 50, SENSEX, BANK NIFTY, and INDIA VIX.
- **AI Multi-Agent Live Mesh**: Interactive visual pipeline displaying active reasoning nodes for the Technical Desk, News Desk, and Anomaly Desk feeding directly into the Lead Synthesis Decision Node.
- **Circular Breadth Needle Gauges**: Custom SVG semi-circular gauge displaying live Advance vs. Decline distribution across NSE monitored equities.
- **Persistent Watchlist Subsystem**: Client-side starred equities tracking backed by persistent browser storage, quick star toggles across tables/cards/headers, and dedicated Watchlist view filters.
- **TradingView Candlestick Engine**: Interactive daily OHLCV price action viewer rendered using open-source `lightweight-charts` v5 with multi-period selector (1M, 3M, 6M, 1Y).
- **Deterministic Indicator Grid**: Real-time 6-metric financial card grid displaying 14D RSI, 20D SMA, 50D SMA, MACD spread, Volume Ratio, and 14D ATR.
- **Grounded Evidence Provenance Ledger**: Every qualitative AI synthesis claim is explicitly linked to underlying indicator math and verifiable news sources.
- **AI Research Terminal (`/ask`)**: Multi-stage reasoning terminal with suggested prompt chips, structured answer hierarchy (Direct Answer, Key Findings, Desks Consulted, Related Equities, Citations, Suggested Follow-ups), one-click answer copying, and thread clearing.
- **Daily Intelligence Briefings Archive (`/reports`)**: Executive memos archive with date filtering, top movers breakdown, one-click clipboard copying, and native Print / PDF export.
- **Dedicated Sector Rotation Matrix**: Thematic matrix tracking Nifty Auto, Energy, FMCG, Bank, and IT.
- **Complete Suite of Dedicated Pages**:
  - `/` — Interactive Institutional Landing Page with Embedded Sign In / Register Terminal (Public)
  - `/login` — Dedicated Research Analyst Authentication Desk (Public)
  - `/dashboard` — Live Market Intelligence Workspace Terminal (Protected)
  - `/markets` — Sector Rotation Matrix, Breadth Gauge & Technical Screener with Watchlist Stars (Protected)
  - `/stocks` — Monitored Equities Directory, Watchlist Tab & Multi-Parameter Sort (Protected)
  - `/stock/[symbol]` — Deep-Dive Candlestick Analysis, Deterministic Grid & Provenance Ledger (Protected)
  - `/intelligence` — 4-Stage Multi-Agent Architecture Inspection Trail (Protected)
  - `/ask` — Structured Conversational Intelligence & Citation Terminal (Protected)
  - `/reports` — Daily Intelligence Briefings Archive with Print/PDF Export (Protected)
  *(Protected routes automatically enforce authentication gatekeeping via `useAuth` and redirect unauthenticated requests to `/login`)*

---

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript (Strict typing)
- **Styling**: Tailwind CSS v4 with custom glassmorphism utilities
- **Charting**: TradingView Lightweight Charts v5 (`lightweight-charts`)
- **Icons**: Lucide React (`lucide-react`)

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```