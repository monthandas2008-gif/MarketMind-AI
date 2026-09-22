# MarketMind — UI/UX Master Blueprint
## "An AI Research Analyst's Workspace for the Indian Stock Market"

---

## A. Design Direction

### 1. Product Thesis
MarketMind is not a generic AI SaaS landing page, nor is it a complex broker execution terminal. It is a **serious, institutional-grade financial intelligence workspace** built specifically for the Indian equity markets (NSE/BSE).

The primary UX objective is to make the entire pipeline transparent and trustworthy:
Live Market Data -> Specialized Agents -> Deterministic Verification -> Evidence Provenance -> Synthesis

### 2. Core Emotional & Visual Resonance
- **Calm, Analytical Authority:** Dense with information, but never chaotic or overwhelming.
- **Epistemic Humility & Rigor:** The interface explicitly distinguishes between **Verified Empirical Facts**, **AI Probabilistic Interpretation**, and **Remaining Uncertainty**.
- **Contextual Indian Equity Grounding:** Respects Indian trading rituals, terminology (Lakhs/Crores, ₹ INR formatting, NSE/BSE tickers, Nifty/Sensex/Bank Nifty indices, 9:15 AM – 3:30 PM IST market hours, post-market 3:50 PM intelligence releases).
- **Tool, Not Gimmick:** Zero floating orbs, zero neon purple glow, zero fake matrix text, zero decorative particle canvas. Every pixel serves analytical decision-making.

---

## B. Design System & Surface Hierarchy

MarketMind uses a disciplined **5-tier surface elevation system** built on neutral slate-zinc foundations to create spatial depth without noisy gradients.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Tier 0: Canvas Base (#0b0e14) — App background                        │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │ Tier 1: Primary Structural Surface (#11151f) — Panels & Sidebar   │ │
│   │   ┌────────────────────────────────────────────────────────────┐ │ │
│   │   │ Tier 2: Module/Card Surface (#171c28) — Cards & Tables     │ │ │
│   │   │   ┌──────────────────────────────────────────────────────┐ │ │ │
│   │   │   │ Tier 3: Inset/Sub-surface (#0e121a) — Data chips & inputs│ │ │ │
│   │   │   └──────────────────────────────────────────────────────┘ │ │ │
│   │   └────────────────────────────────────────────────────────────┘ │ │
│   └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
Tier 4: Floating/Overlay (#1c2333) — Modals, popovers, tooltips, flyouts
```

### Design Tokens & Variables
- **Borders:** `1px solid rgba(255, 255, 255, 0.07)` on cards; `1px solid rgba(255, 255, 255, 0.12)` on active/hover.
- **Border Radius:**
  - Outer Containers & Modals: `10px` (`rounded-xl`)
  - Cards & Chart Viewports: `8px` (`rounded-lg`)
  - Badges, Tabs, Buttons & Input Fields: `5px` (`rounded-md`)
  - Status Indicators & Pills: `9999px` (`rounded-full`)
- **Shadows:** Minimal, tight elevation:
  - Surface: `0 1px 3px 0 rgba(0, 0, 0, 0.35)`
  - Overlay/Modal: `0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)`
- **Spacing Grid:** 4px baseline (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px).

---

## C. Color Palette

A restrained, low-saturation financial palette where color carries **semantic weight**, not decorative flash.

### 1. Neutral Base Tones
- **Canvas Base:** `#0b0e14` (Deep navy-slate black)
- **Primary Surface:** `#11151f` (Muted panel background)
- **Secondary Card Surface:** `#171c28` (Interactive card background)
- **Inset Surface:** `#0e121a` (Input backgrounds, metric recesses)
- **Borders (Default):** `#222938`
- **Borders (Muted):** `#1b202c`
- **Borders (Highlight):** `#323d52`

### 2. Typography Colors
- **Primary Text:** `#f1f5f9` (High contrast, crisp white-slate)
- **Secondary Text:** `#94a3b8` (Standard readable descriptions)
- **Muted/Meta Text:** `#64748b` (Timestamps, source credits, labels)
- **Inverse Text:** `#0b0e14`

### 3. Financial Semantic Colors
| Semantics | Base Color | Background Tint | Border Tint | Usage |
|---|---|---|---|---|
| **Positive / Gain / Bullish** | `#10b981` (Emerald) | `rgba(16, 185, 129, 0.08)` | `rgba(16, 185, 129, 0.25)` | Price increase, Bullish momentum, Verified evidence |
| **Negative / Loss / Bearish** | `#f43f5e` (Rose) | `rgba(244, 63, 94, 0.08)` | `rgba(244, 63, 94, 0.25)` | Price drop, Bearish momentum, Breakdown signals |
| **Neutral / Hold** | `#94a3b8` (Slate) | `rgba(148, 163, 184, 0.08)` | `rgba(148, 163, 184, 0.2)` | Sideways trend, Normal distribution, Standard session |
| **Warning / Anomaly** | `#f59e0b` (Amber) | `rgba(245, 158, 11, 0.08)` | `rgba(245, 158, 11, 0.25)` | Volume surge, Statistical outlier (|z| >= 2.0), Gap move |
| **Informational / AI Accent** | `#38bdf8` (Sky) | `rgba(56, 189, 248, 0.08)` | `rgba(56, 189, 248, 0.25)` | Technical indicators, Agent active state, Citations |

---

## D. Typography

A hybrid typographic pairing designed for high-density legibility and numerical clarity.

### 1. Font Families
- **Primary UI & Editorial:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` (Optimal x-height and micro-legibility).
- **Financial & Tabular Data:** `JetBrains Mono`, `IBM Plex Mono`, `monospace` (Mandatory tabular numbers: `font-variant-numeric: tabular-nums`).

### 2. Typographic Scale & Weights
| Token | Size | Weight | Line Height | Tracking | Application |
|---|---|---|---|---|---|
| `display-lg` | 32px | 700 | 38px | -0.02em | Primary Index Price (Nifty 50, Sensex) |
| `display-md` | 24px | 600 | 30px | -0.015em | Selected Stock Price Header |
| `heading-lg` | 18px | 600 | 24px | -0.01em | Page Titles, Key Section Headers |
| `heading-md` | 14px | 600 | 20px | 0 | Module Headers, Agent Names |
| `heading-sm` | 12px | 600 | 16px | +0.02em (Caps) | Card Subheadings, Table Headers |
| `body-md` | 13px | 400/500 | 20px | 0 | Synthesis Text, Narrative Intelligence |
| `body-sm` | 12px | 400 | 18px | 0 | Supporting Evidence, News Excerpts |
| `caption` | 11px | 400/500 | 15px | +0.01em | Metadata, Timestamps, Source Outlets |
| `num-lg` | 18px | 600 Mono | 22px | 0 | Metric Highlights, Z-Scores |
| `num-sm` | 12px | 500 Mono | 16px | 0 | Table Rows, Technical Indicators, OHLCV |

---

## E. Navigation Architecture

A persistent, responsive **Dual Navigation Pattern** consisting of a **compact persistent sidebar** (collapsible on smaller screens) plus an **utility top header**.

### 1. Left Persistent Sidebar (Width: 220px desktop, 64px collapsed icon-rail)
```
┌─────────────────────────┐
│ [M] MarketMind          │
│ NSE/BSE Intelligence    │
├─────────────────────────┤
│ MAIN WORKSPACE          │
│ [◈] Dashboard       (/) │
│ [▦] Markets   (/markets)│
│ [☷] Stocks     (/stocks)│
├─────────────────────────┤
│ AI INTELLIGENCE         │
│ [◎] Agent Trail (/agent)│
│ [💬] Ask Mind      (/ask)│
│ [🗎] Daily Brief (/brief)│
├─────────────────────────┤
│ SYSTEM                  │
│ [⚙] Settings (/settings)│
│                         │
│ [●] NSE: LIVE (14:42 IST│
└─────────────────────────┘
```

---

## F. Dashboard Wireframe (Primary Experience)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: [M] MarketMind   [ Search Symbol or Ask Intelligence (Ctrl+K) ]      ● NSE: OPEN (14:32 IST)  [Run Brief]│
├─────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR │ SECTION 1: BENCHMARK PULSE (4-Col Grid)                                                              │
│ [◈] Dash│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐              │
│ [▦] Mkts│ │ NIFTY 50          │ │ SENSEX            │ │ BANK NIFTY        │ │ INDIA VIX         │              │
│ [☷] Stks│ │ 23,346.40  +0.33% │ │ 76,820.10  +0.28% │ │ 49,850.20  -0.12% │ │ 13.42      -2.40% │              │
│ [◎] Agnt│ │ Adv: 31 | Dec: 19 │ │ Adv: 18 | Dec: 12 │ │ Heavyweight Diverg│ │ Volatility: Low   │              │
│ [💬] Ask │ └───────────────────┘ └───────────────────┘ └───────────────────┘ └───────────────────┘              │
│ [🗎] Rprt├───────────────────────────────────────────────────────┬──────────────────────────────────────────────┤
│         │ SECTION 2: AI EXECUTIVE MARKET BRIEF                  │ SECTION 3: REAL-TIME ANOMALY RADAR           │
│         │ ┌───────────────────────────────────────────────────┐ │ ┌──────────────────────────────────────────┐ │
│         │ │ ⚡ SYNTHESIS AGENT BRIEFING (14:30 IST)            │ │ │ ⚠ STATISTICAL DEVIATIONS (|z| ≥ 2.0)     │ │
│         │ │ "Indian equities traded in a tight 80-point range │ │ │                                          │ │
│         │ │ supported by energy and telecom names, while IT   │ │ │ • TCS (-3.88%): Vol 2.46x 20d mean       │ │
│         │ │ experienced sustained distribution following US   │ │ │   Z-Score: -2.31 | Institutional Outflow │ │
│         │ │ macro comments. Market breadth remains mildly     │ │ │                                          │ │
│         │ │ positive (Adv/Dec 1.63x)."                        │ │ │ • INFY (-0.68%): Vol Surge 2.55x 20d mean│ │
│         │ │                                                   │ │ │   Z-Score: +2.18 | Heavy Block Deals     │ │
│         │ │ Consensus: CAUTIOUS BULLISH | Evidence: STRONG    │ │ │                                          │ │
│         │ │ Key Drivers: 1. Crude Softening  2. FII Buying    │ │ │ [View All 4 Detected Anomalies →]        │ │
│         │ └───────────────────────────────────────────────────┘ │ └──────────────────────────────────────────┘ │
│         ├───────────────────────────────────────────────────────┴──────────────────────────────────────────────┤
│         │ SECTION 4: MARKET OVERVIEW & SIGNIFICANT MOVERS                                                      │
│         │ ┌─────────────────────────────────────────────────┬────────────────────────────────────────────────┐ │
│         │ │ TOP SESSION GAINERS                             │ TOP SESSION LOSERS                             │ │
│         │ │ Symbol     Price(₹)   Chg%    Vol Ratio  Signal │ Symbol     Price(₹)   Chg%    Vol Ratio Signal │ │
│         │ │ RELIANCE   1,245.80  +2.14%    1.42x     BULL   │ TCS        3,890.10  -3.88%    2.46x    BEAR  │ │
│         │ │ ICICIBANK  1,288.40  +1.65%    1.18x     BULL   │ INFY       1,742.00  -1.25%    2.55x    NEUT  │ │
│         │ │ ITC          478.20  +0.92%    0.85x     NEUT   │ LT         3,420.50  -0.85%    1.05x    NEUT  │ │
│         │ └─────────────────────────────────────────────────┴────────────────────────────────────────────────┘ │
│         ├───────────────────────────────────────────────────────┬──────────────────────────────────────────────┤
│         │ SECTION 5: VERIFIED NEWS INTELLIGENCE STREAM          │ SECTION 6: LATEST GENERATED DAILY REPORT     │
│         │ ┌───────────────────────────────────────────────────┐ │ ┌──────────────────────────────────────────┐ │
│         │ │ • RIL Board considers bonus issue proposal        │ │ │ 🗎 DAILY INTELLIGENCE BRIEF — 18 SEP     │ │
│         │ │   Source: The Economic Times · 1h ago · Verify ↗  │ │ │ Nifty Closes +78 pts; Sector Rotation    │ │
│         │ │   AI Context: "Supports upward momentum in Energy"│ │ │                                          │ │
│         │ │                                                   │ │ │ Technicals: Holding 20 EMA at 23,280     │ │
│         │ │ • US Tech spending guidance revised lower         │ │ │ Sources Cited: 14 verified outlets       │ │
│         │ │   Source: Livemint · 2h ago · Verify ↗            │ │ │ Evidence Score: 88/100 (HIGH)            │ │
│         │ │   AI Context: "Direct catalyst for TCS/INFY dip"  │ │ │                                          │ │
│         │ │ [View Full News Intelligence Stream →]            │ │ │ [Read Complete Official Report →]        │ │
│         │ └───────────────────────────────────────────────────┘ │ └──────────────────────────────────────────┘ │
└─────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## G. Market Page Wireframe (`/markets`)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Indian Market Dynamics & Sector Breadth                                       Auto-refreshing (60s)    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. SECTOR ROTATION MATRIX & HEATMAP                                                                            │
│ ┌──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┬────────────────┐ │
│ │ NIFTY AUTO (+1.84%)  │ NIFTY ENERGY (+1.42%)│ NIFTY BANK (+0.45%)  │ NIFTY FMCG (+0.12%)  │ NIFTY IT (-2.8)│ │
│ │ M&M, TATAMOTORS lead │ RELIANCE, ONGC strong│ ICICI, HDFC steady   │ ITC, HUL defensive   │ TCS, INFY weak │ │
│ └──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┴────────────────┘ │
├────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────┤
│ 2. ADVANCE / DECLINE & MARKET BREADTH GAUGE            │ 3. INSTITUTIONAL FLOW INDICATOR                       │
│ Advances: 1,420 (58%)   Declines: 980 (40%)  Unch: 48  │ FII Net (Est): +₹1,240 Cr   DII Net (Est): -₹420 Cr   │
│ Ratio: 1.45 (Mild Bullish Accumulation)                │ Long/Short Ratio: 54% Long (Moderate Bullish Posture) │
├────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────┤
│ 4. DETAILED WATCHLIST DIRECTORY & REAL-TIME STATUS TABLE                                                       │
│ Symbol     Sector     Last (₹)   Chg %    Day Low-High (₹)      Vol/Avg    RSI(14)   Anomaly Flag   AI Signal  │
│ RELIANCE   Energy     1,245.80   +2.14%   1,226.40 - 1,248.00    1.42x      58.4     Normal         BULLISH    │
│ TCS        IT         3,890.10   -3.88%   3,880.00 - 4,020.00    2.46x      28.2     VOL SURGE      BEARISH    │
│ INFY       IT         1,742.00   -1.25%   1,735.00 - 1,760.00    2.55x      39.5     BLOCK DEAL     NEUTRAL    │
│ ICICIBANK  Banking    1,288.40   +1.65%   1,265.00 - 1,292.00    1.18x      62.1     Normal         BULLISH    │
│ ITC        FMCG         478.20   +0.92%     472.00 -   479.50    0.85x      51.0     Normal         NEUTRAL    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## H. Stock Analysis Wireframe (`/stocks/[symbol]`)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Markets   RELIANCE · Reliance Industries Ltd. · NSE · Energy                   [ ⚡ Re-Run Agents ] │
│ Last: ₹1,245.80  ▲ +26.10 (+2.14%)  |  Prev: ₹1,219.70  |  Vol: 18.4M (1.42x 20d)  |  Session: CLOSED         │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ WORKSPACE TAB BAR: [ Candlestick Chart ]  [ Multi-Agent Report ]  [ Provenance & Sources ]  [ Technical Specs ]│
├────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────┤
│ SECTION 1: TRADINGVIEW INTERACTIVE CANDLESTICK CHART   │ SECTION 2: SYNTHESIS AGENT DECISION BRIEF             │
│ [ 1D | 1W | 1M | 3M | 6M | 1Y ]  Interval: 1D          │ ┌───────────────────────────────────────────────────┐ │
│ ┌────────────────────────────────────────────────────┐ │ │ LEAD SYNTHESIS AGENT CONSENSUS                    │ │
│ │  1260 ┤               ┌─┐                          │ │ │ Signal: BULLISH MOMENTUM (Confidence: MODERATE)   │ │
│ │       │       ┌─┐   ┌─┘ └┐                         │ │ │ Evidence Strength: STRONG (3 of 3 Agents Agree)   │ │
│ │  1240 ┤     ┌─┘ └┐  │    │     ┌─┐                 │ │ │                                                   │ │
│ │       │     │    │  │    └───┐ └─┘   ◄ Today       │ │ │ Key Theses:                                       │ │
│ │  1220 ┤ ┌─┐ │    └──┘        └┐                    │ │ │ 1. Clean breakout above 20 & 50-day SMA cluster.  │ │
│ │       │ └─┘                   │                    │ │ │ 2. Board meeting announcement for bonus shares    │ │
│ │  1200 ┴─────────────────────────────────────────── │ │ │    sparked aggressive delivery accumulation.      │ │
│ │  VOL  ██   ███    █     ██    ███   ████           │ │ │                                                   │ │
│ └────────────────────────────────────────────────────┘ │ │ Risk/Uncertainty: Global refining margins remain  │ │
│ Indicators: 20 SMA: 1,228.4 | 50 SMA: 1,215.1 | RSI: 58.4│ │ volatile; resistance at ₹1,265.                 │ │
│                                                        │ └───────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────┤
│ SECTION 3: SPECIALIZED AGENT RESEARCH PANELS (3-Column Tri-Pillar Architecture)                                │
│ ┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────────────────────┐ │
│ │ 1. TECHNICAL ANALYSIS AGENT  │ 2. NEWS INTELLIGENCE AGENT   │ 3. ANOMALY & PATTERN AGENT                   │ │
│ │ Status: ✓ Analyzed (14:35)   │ Status: ✓ Analyzed (14:35)   │ Status: ✓ Analyzed (14:35)                   │ │
│ │ Signal: BULLISH (Conf: High) │ Sentiment: POSITIVE          │ Anomaly Detected: NO (Statistically Normal)  │ │
│ │                              │ Direct Catalyst: YES         │                                              │ │
│ │ • RSI(14) at 58.4 in healthy │ • 3 High-Impact Articles:    │ • Volume Z-Score: +0.63 (Normal)             │ │
│ │   bullish momentum zone.     │   - "RIL board to consider   │ • Return Z-Score: +1.12 (Normal)             │ │
│ │ • Price is +1.4% above 20d   │      bonus issue on Sep 21"  │ • Intraday Range: 1.1x 20d ATR               │ │
│ │   SMA (₹1,228) and 50d SMA.  │      (Economic Times) ↗      │ • No gap deviation or flash spike.           │ │
│ │ • MACD Histogram turned      │   - "Morgan Stanley raises   │                                              │ │
│ │   positive (+3.42).          │      target to ₹1,400" ↗     │ Verdict: Steady institutional accumulation;  │ │
│ │                              │                              │ order book shows zero distressed flow.       │ │
│ │ [View Indicator Audit Trail] │ [View All 5 Cited Articles]  │ [View Full Distribution Math]                │ │
│ └──────────────────────────────┴──────────────────────────────┴──────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SECTION 4: GROUNDED EVIDENCE & PROVENANCE LEDGER                                                               │
│ Verified Claim                                 Data Point                     Source           Timestamp  Link │
│ "RIL trading above 20d SMA (₹1,228.4)"         Close: ₹1,245.8 vs SMA: 1,228  NSE / yfinance   14:30 IST  Data │
│ "Bonus issue board proposal submitted"         Official Exchange Filing       Economic Times   11:15 IST  ↗ Ref│
│ "Volume 1.42x higher than 20d benchmark"       Vol: 18.4M vs Avg: 12.9M       Deterministic    14:30 IST  Math │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## I. AI Intelligence Wireframe (`/intelligence`)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Autonomous Agent Pipeline Status & Execution Flow                         Total Run Time: 1.4s         │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ AGENT WORKFLOW INSPECTION TRAIL (Interactive Pipeline Diagram)                                                 │
│                                                                                                                │
│   [ 1. RAW INGESTION ]         [ 2. SPECIALIZED AGENT DESKS ]             [ 3. SYNTHESIS COMMITTEE ]           │
│   ┌───────────────────┐        ┌──────────────────────────────┐          ┌───────────────────────────┐         │
│   │ yfinance OHLCV    │───┬───►│ Technical Analysis Agent     │───┐      │ Synthesis Agent           │         │
│   │ 6 Stocks + Nifty  │   │    │ (ta math + momentum engine)  │   │      │ • Cross-examines evidence │         │
│   └───────────────────┘   │    └──────────────────────────────┘   ├───┬─►│ • Grades confidence       │         │
│   ┌───────────────────┐   │    ┌──────────────────────────────┐   │   │  │ • Assigns final signal    │         │
│   │ RSS News Stream   │───┼───►│ News Intelligence Agent      │───┤   │  └───────────────────────────┘         │
│   │ ET + Google News  │   │    │ (Fact extraction & sentiment)│   │   │                │                       │
│   └───────────────────┘   │    └──────────────────────────────┘   │   │                ▼                       │
│   ┌───────────────────┐   │    ┌──────────────────────────────┐   │   │  ┌───────────────────────────┐         │
│   │ Historical DB     │───┴───►│ Anomaly Detection Agent      │───┘   │  │ Supabase / SQLite DB      │         │
│   │ 3-Month Cache     │        │ (Z-Score & volume outliers)  │       │  │ • Versioned Intelligence  │         │
│   └───────────────────┘        └──────────────────────────────┘       │  │ • Evidence Audit Log      │         │
│                                                                       │  └───────────────────────────┘         │
│                                                                       ▼                                        │
│                                                          Prompt Caching Layer (SHA-256 Hit)                    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ACTIVE AGENTS HEALTH & REPUTATION METRICS                                                                      │
│ Agent Name            Specialization              Execution Method           Cache Hit Rate  Last Session Call │
│ Technical Agent       Momentum, Indicators, SMA   ta Lib + Gemini Flash      74%             18 Sep, 15:50 IST │
│ News Intelligence     Event & Sentiment Extraction RSS Ingest + Gemini Flash 68%             18 Sep, 15:50 IST │
│ Anomaly Detection     Statistical Z-Scores        100% Python Deterministic  N/A (Local Math)18 Sep, 15:50 IST │
│ Synthesis Agent       Consensus & Provenance      Gemini 2.0 Flash           42%             18 Sep, 15:50 IST │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## J. Ask MarketMind Wireframe (`/ask`)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Ask MarketMind — Conversational Equity Research Terminal                                              │
│ Mode: Evidence-Grounded Multi-Agent Retrieval  |  Zero-Hallucination Protocol Active                           │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SUGGESTED RESEARCH PROMPTS:                                                                                    │
│ [ "Why did TCS drop 3.8% today?" ]  [ "Analyze RELIANCE technical posture" ]  [ "Which stocks had volume surges?" ]
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TERMINAL MESSAGE STREAM:                                                                                       │
│                                                                                                                │
│ [USER] "Why did TCS fall nearly 4% today while Nifty remained green?"                                          │
│                                                                                                                │
│ [MARKETMIND AGENT RESPONSE]                                                                                    │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚡ QUERY ORCHESTRATION PROFILE                                                                             │ │
│ │ Symbols Detected: TCS, NIFTY50   |   Execution Time: 1.1s   |   Prompt Cache: SHA-256 Hit (Zero LLM Waste)  │ │
│ │ Agents Activated: [✓ Technical Agent]  [✓ News Agent]  [✓ Anomaly Agent]  [✓ Synthesis Agent]               │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 1. EMPIRICAL MARKET FACTS (Deterministic Data)                                                             │ │
│ │ • TCS closed at ₹3,890.10 (-3.88%), sliding from session high of ₹4,020.00.                                │ │
│ │ • Volume reached 2.46× its 20-day trailing average (Volume Z-Score: +2.31).                                │ │
│ │ • 14-day RSI declined sharply from 46.2 to 28.2 (Oversold threshold breached).                            │ │
│ │                                                                                                            │ │
│ │ 2. NEWS & CATALYST PROVENANCE                                                                              │ │
│ │ • Top verified headline: "Tier-1 US Banking Clients Signal CapEx Moderation for FY27"                      │ │
│ │   Source: The Economic Times (Published 08:45 IST) · [Verify Original Article ↗]                          │ │
│ │ • Cross-sector impact: Sector peers INFY (-1.25%) and Wipro (-1.40%) experienced co-movement.              │ │
│ │                                                                                                            │ │
│ │ 3. AI SYNTHESIS & REASONING                                                                                │ │
│ │ The drop was an idiosyncratic sector-wide reaction to international client spending commentary rather than │ │
│ │ domestic macroeconomic distress. Aggressive institutional block volume (+2.31 sigma) confirmed delivery    │ │
│ │ selling rather than retail panic.                                                                          │ │
│ │                                                                                                            │ │
│ │ 4. REMAINING UNCERTAINTY & LIMITATIONS                                                                     │ │
│ │ TCS management has not issued an official exchange filing addressing client guidance. Technical support is │ │
│ │ expected near the 200-day EMA at ₹3,840.                                                                   │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ EVIDENCE STRENGTH: STRONG (85/100)   |   ANALYTICAL SIGNAL: BEARISH MOMENTUM (High Confidence)             │ │
│ │ Disclaimer: Analytical signal for research purposes only. Not financial or trading advice.                 │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INPUT TERMINAL:                                                                                                │
│ [ Ask about any Indian stock, indicator, earnings catalyst, or unusual volume pattern...       ] [ Send ↵ ]   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## K. Daily Reports Wireframe (`/reports`)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Daily Indian Market Intelligence Briefings                                    [ ⚡ Generate Now ]      │
├──────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ARCHIVE LIST │ OFFICIAL MARKET INTELLIGENCE BRIEF — 18 SEPTEMBER 2026                                          │
│              │ Session: Final Closing Briefing  |  Generated: 15:50 IST  |  Evidence Quality: HIGH             │
│ [•] 18 Sep   ├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│     Nifty +78│ 1. SESSION EXECUTIVE SUMMARY                                                                    │
│              │ The benchmark NIFTY 50 concluded the session at 23,346.40 (+0.33%), defending the 20-day       │
│ [ ] 17 Sep   │ Exponential Moving Average for the fifth consecutive trading day. Domestic market breadth was   │
│     Nifty -45│ resilient (Adv/Dec ratio 1.63), sustained by broad-based accumulation in private banks and      │
│              │ energy conglomerates, neutralizing heavy profit-booking across the IT sector.                   │
│ [ ] 16 Sep   ├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│     Nifty +12│ 2. TRI-PILLAR AGENT FINDINGS BREAKDOWN                                                          │
│              │ ┌──────────────────────────┬──────────────────────────┬───────────────────────────────────────┐ │
│ [ ] 15 Sep   │ │ Technical Intelligence   │ News & Corporate Catalysts│ Statistical Anomalies Detected        │ │
│     Nifty -92│ │ • Nifty 20 EMA: 23,280   │ • Crude oil softened 1.8%│ • TCS (-3.88%): Vol 2.46x 20d mean   │ │
│              │ │   acting as dynamic floor│   benefiting FMCG/Paint  │ • INFY: Vol surge 2.55x (Block deal)  │ │
│ [ ] 14 Sep   │ │ • RSI(14) neutral (52.1) │ • RIL bonus consideration│ • Zero benchmark index anomalies;     │ │
│     Nifty +11│ │ • Bank Nifty outperformer│ • US IT CapEx headlines  │   volatility index (VIX) down -2.4%.  │ │
│              │ └──────────────────────────┴──────────────────────────┴───────────────────────────────────────┘ │
│              ├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│              │ 3. STRATEGIC POSITIONING & KEY DRIVERS FOR NEXT SESSION                                         │
│              │ • Key Resistance: 23,480 (All-time weekly high consolidation ceiling).                          │
│              │ • Key Support: 23,240 (Confluence of 20 EMA and prior pivot low).                               │
│              │ • Primary Catalyst: Overnight US Federal Reserve policy commentary and crude benchmarks.        │
│              ├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│              │ 4. VERIFIED INFORMATION SOURCES (CITATIONS LEDGER)                                              │
│              │ 1. NSE Daily Settlement Report (NSEIndia.com) ↗                                                 │
│              │ 2. "RIL Board Considers Bonus Issue" — The Economic Times ↗                                     │
│              │ 3. "US IT Budget Revisions" — Livemint Markets ↗                                                │
└──────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## L. Agent Interaction & Progressive Disclosure Design

```
Level 1: The Consensus Pill (Zero cognitive load, instant scan)
  Example: [ BULLISH · High Confidence · 3 of 3 Agents Agree ]
      │
      ▼ (User clicks or hovers)
Level 2: The Agent Evidence Accordion (Detailed explanation)
  Reveals:
  - Technical Agent finding ("Above 20d SMA, RSI 58.4")
  - News Agent finding ("Bonus announcement confirmed")
  - Anomaly Agent finding ("Volume +1.42x, no distribution spike")
      │
      ▼ (User clicks "Inspect Raw Provenance")
Level 3: The Audit Drawer / Modal (Full institutional transparency)
  Reveals:
  - Raw JSON data payload passed to Gemini
  - Exact formula: Z = (x - μ) / σ
  - Direct HTTP URLs to source articles
  - Prompt cache execution timestamp & latency
```

---

## M. Evidence & Provenance Design

Every analytical conclusion presented by MarketMind must adhere to the **Four Pillars of Provenance**:
1. **The Source Badge:** Every factual claim has an attached origin chip (`[NSE Official]`, `[Economic Times / Livemint]`, `[MarketMind Stat Engine]`).
2. **The Direct Verification Link:** Clicking opens original article in a new tab.
3. **The Evidence Strength Meter:** `STRONG`, `MODERATE`, `LIMITED`.
4. **Visual Separation of Truth:** Facts (blue), AI Interpretation (purple/emerald), Uncertainty (amber).

---

## N. Charting Strategy & Lightweight Charts Integration

- TradingView's open-source `lightweight-charts` v5.
- Clean candlestick layout with Emerald (`#10b981`) and Rose (`#f43f5e`).
- Integrated volume bars in bottom 20% viewport.
- Toggleable 20-day and 50-day SMA lines.
- Timeframe controls: `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`.
- Decoupled `useRef` mounting for smooth 60 FPS rendering.

---

## O. Responsive Layout Strategy

- **Desktop (≥ 1280px):** 3-column workstation with persistent 220px left sidebar.
- **Laptop (1024px – 1279px):** 2-column layout with 64px icon-rail sidebar.
- **Tablet (768px – 1023px):** Single-column stacked with horizontal swipe containers.
- **Mobile (< 768px):** Bottom tab navigation with collapsible accordions.

---

## P. Component Architecture & Design Tokens

```
src/components/
├── layout/ (AppShell, Sidebar, Header)
├── market/ (IndexPulseCard, MoverRow, SectorHeatmap, AnomalyCard)
├── stock/ (CandlestickChart, TechnicalMetricBar, StockHeader)
├── agent/ (AgentTrail, AgentCard, SynthesisCard, EvidenceLedger)
├── terminal/ (ChatInterface, QueryPromptPills, ProvenanceBadge)
└── common/ (Surface, SignalBadge, EvidenceMeter)
```

---

## Q. Page Hierarchy & Routing Map

- `/`: Dashboard (Benchmark pulse, AI brief, anomalies, movers, news)
- `/markets`: Markets Explorer (Sector heatmap, market breadth, directory)
- `/stocks`: Stock Directory (Searchable universe with technical filters)
- `/stock/[symbol]`: Stock Analysis (TradingView chart, 3-pillar agent cards, citations)
- `/intelligence`: Agent Trail (Visual agent execution pipeline & cache metrics)
- `/ask`: Ask MarketMind (Conversational research terminal)
- `/reports`: Daily Reports Archive (Automated 3:50 PM IST end-of-day briefings)
- `/settings`: Configuration & dynamic Gemini key management

---

## R. User Flow Journeys

- **Flow 1:** Morning scan on Dashboard -> Spot anomaly in TCS -> Inspect TCS Stock Analysis page -> Verify catalyst via external source link.
- **Flow 2:** Conversational investigation on Ask MarketMind -> Prompt "Why did Reliance outperform?" -> Agent pipeline runs -> Review Facts vs. Reasoning vs. Uncertainty.

---

## S. Professor Demo Flow (15-Minute Structured Presentation)

1. **0:00 - 2:00:** Problem & Multi-Agent Thesis (Dashboard).
2. **2:00 - 4:00:** Macro Pulse & Automated 3:50 PM IST brief.
3. **4:00 - 6:30:** Deterministic Anomaly Detection (TCS volume Z-score +2.31).
4. **6:30 - 9:30:** Single-Stock Research Desk (Reliance candlestick chart & 3 agent cards).
5. **9:30 - 12:00:** Conversational Terminal (Ask MarketMind live execution).
6. **12:00 - 13:30:** Provenance Verification & Anti-Hallucination rules.
7. **13:30 - 15:00:** Architecture, zero-cost stack, and viva defense.

---

## T. Core Architecture Pillars

- **Deterministic Indicator Engine:** Pure Python (`ta`, `numpy`) pre-calculations for RSI, MACD, SMAs, Bollinger Bands, and Z-scores before any LLM ingestion.
- **Indian Market Grounding:** Deep contextual alignment with NSE/BSE conventions, ₹ INR currency values, IST trading sessions (9:15 AM - 3:30 PM), and thematic sectoral indices.
- **Multi-Agent Specialization:** Segregated desks (Technical, News, Anomaly) executing independently before reaching the Lead Synthesis decision node.
- **Glassmorphic Surface Hierarchy:** Custom 5-tier elevation system engineered specifically for data density and visual comfort.
- **Grounded Provenance Ledger:** Every thesis and catalyst claim backed by verifiable source citations and mathematical parameters.
- **Interactive Technical Viewports:** Candlestick charts, neon sparkline waves, and circular breadth gauges providing multi-timeframe perspective.

---

## U. Architectural Principles & Best Practices

- **Zero Hallucination Policy:** Numerical calculations are never delegated to LLMs; indicator values are calculated deterministically.
- **Anti-Gimmick Design:** Clean, purposeful layout without distracting purple glows, neon cyber aesthetics, or decorative clutter.
- **Objective Analytical Classification:** Avoid misleading simplistic "99% AI confidence" meters; utilize qualitative evidentiary standards (`STRONG`, `MODERATE`, `LIMITED`).
- **Scannable Information Hierarchy:** Structure market intelligence into scannable empirical blocks (Technical Signals, News Catalysts, Anomaly Flags, Lead Synthesis).
