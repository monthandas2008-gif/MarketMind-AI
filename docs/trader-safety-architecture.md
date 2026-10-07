# Trader Safety Intelligence — Architecture & Design Document

## Overview

Trader Safety Intelligence is an **additive educational module** within MarketMind that introduces a **5-Agent Trade Safety Committee** workflow. Its purpose is to improve trade decision quality and help Indian retail traders avoid avoidable mistakes through transparent AI-agent review, risk awareness, and behavioural guardrails.

> **This module does NOT predict prices, place orders, provide personalized financial advice, or guarantee returns.**

---

## Agent Workflow Architecture

```
User Trade Plan (Ticker, Direction, Entry, Stop-Loss, Target, Quantity)
                          │
                          ▼
           ┌──────────────────────────────┐
           │  Trade Safety Orchestrator   │
           │  (Sequential Coordinator)    │
           └────────────┬─────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
  ┌───────────┐  ┌──────────────┐  ┌──────────────┐
  │  Market   │  │  Portfolio   │  │  Trade Plan  │
  │   Risk    │  │    Risk      │  │   Analyst    │
  │  Analyst  │  │   Analyst    │  │              │
  └─────┬─────┘  └──────┬───────┘  └──────┬───────┘
        │               │                 │
        ▼               ▼                 ▼
  ┌───────────┐  ┌──────────────┐
  │   News    │  │ Behavioural  │
  │ Evidence  │  │    Coach     │
  │  Analyst  │  │              │
  └─────┬─────┘  └──────┬───────┘
        │               │
        └───────┬───────┘
                │
                ▼
     ┌──────────────────────┐
     │  Trade Safety        │
     │  Reviewer            │
     │  (Final Aggregation) │
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │  Explainable Safety  │
     │  Card + Verdict      │
     └──────────────────────┘
```

**Execution**: Sequential (for debuggability and faculty demonstration). Each agent runs independently and is error-isolated — one agent failure does not crash the workflow.

---

## Agent Descriptions

### 1. Market Risk Analyst
- **Input**: Ticker, NIFTY/SENSEX/BANK NIFTY data, India VIX, advance/decline breadth, sector breadth, existing technical indicators, anomaly flags, synthesis output
- **Output**: Market risk classification (`LOW | MODERATE | HIGH | EXTREME | UNKNOWN`), supporting/conflicting evidence
- **Rule**: Never predicts price direction with certainty. Never calculates indicators inside the LLM.

### 2. Portfolio Risk Analyst
- **Input**: User risk profile, trading capital, existing open positions, proposed trade plan, sector mapping
- **Output**: Risk status (`SAFE | CAUTION | LIMIT_REACHED | INSUFFICIENT_DATA`), deterministic calculations (position value, exposure, worst-case loss, remaining risk budget)
- **Rule**: All calculations are deterministic Python functions. Zero LLM math.

### 3. Trade Plan Analyst
- **Input**: Complete trade plan fields, existing technical indicators, anomaly flags, synthesis
- **Output**: Plan quality (`STRONG | ADEQUATE | WEAK | INCOMPLETE`), missing fields, logical issues, invalidating conditions
- **Rule**: Does not calculate P&L inside the LLM. Checks logical consistency only.

### 4. News Evidence Analyst
- **Input**: Ticker, recent news from MarketMind's existing News Intelligence Desk
- **Output**: Evidence signal (`POSITIVE | NEGATIVE | MIXED | NEUTRAL`), news items with source URLs, reliability scores, and sentiment
- **Rule**: Separates fact from speculation. Includes publication timestamps and source reliability.

### 5. Behavioural Coach
- **Input**: Recent trade history, trade journal, current trade plan, user risk profile
- **Output**: Behaviour status (`HEALTHY | ATTENTION_NEEDED | PAUSE_RECOMMENDED`), detected patterns (loss streaks, revenge trading, position size anomaly, averaging down, missing stop-loss, daily limits)
- **Rule**: All behavioural detection is deterministic Python pattern matching. LLM only narrates the findings.

### 6. Trade Safety Reviewer
- **Input**: All 5 agent outputs + deterministic calculations
- **Output**: Final safety recommendation (`SAFE_TO_REVIEW | PROCEED_WITH_CAUTION | PAUSE_AND_REVIEW | DO_NOT_PROCEED`), supporting/counter evidence, key risks, what would change the review, educational disclaimer
- **Rule**: Weighs all agent signals. Flags agent disagreement. Never overrides deterministic math failures.

---

## Deterministic Safety Calculations (Zero LLM Math)

All financial math lives in `backend/app/services/safety_calculations.py`:

| Calculation | Formula |
|---|---|
| **Max Safe Quantity** | `floor((capital × risk_percent / 100) / abs(entry - stop_loss))` |
| **Worst-Case Loss** | `nominal_risk + statutory_charges + (slippage × 1.5)` |
| **Position Value** | `quantity × entry_price` |
| **Risk:Reward Ratio** | `abs(target - entry) / abs(entry - stop_loss)` |
| **Sector Exposure %** | `(sector_position_value / total_capital) × 100` |
| **Single Stock Concentration %** | `(stock_position_value / total_capital) × 100` |
| **Win Rate** | `(winning_trades / total_trades) × 100` |
| **Profit Factor** | `total_wins / total_losses` |
| **Expectancy** | `(win_rate × avg_win) - (loss_rate × avg_loss)` |
| **Max Drawdown** | Peak-to-trough on cumulative equity curve |

**Indian Statutory Charges** (modeled for NSE equity):
- STT: 0.025% sell-side (intraday), 0.1% both sides (delivery)
- Exchange Charges: 0.00297% on turnover
- SEBI Charges: ₹10 per crore
- Stamp Duty: 0.003% buy-side (intraday), 0.015% (delivery)
- GST: 18% on (brokerage + exchange + SEBI)

---

## Database Schema

New tables (SQLite + Supabase migration `004_trader_safety_intelligence.sql`):

- `risk_profiles` — Per-user risk configuration (capital, risk%, max positions, cooling-off)
- `trade_plans` — Saved trade plan entries (ticker, direction, entry, SL, target, status)
- `trades` — Trade journal records (entry, exit, P&L, charges, status)
- `safety_reviews` — Complete committee review records with all agent outputs (JSON columns)
- `safety_agent_runs` — Individual agent execution audit trail (timing, status, errors)
- `audit_logs` — Full compliance audit log for every safety action

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/safety/review` | Run the full 5-agent Trade Safety Committee |
| `POST` | `/api/safety/override` | Log user override with mandatory rationale |
| `GET` | `/api/safety/{ticker}/history` | Past safety reviews for a ticker |
| `GET` | `/api/safety/{ticker}/explain` | Latest explainable breakdown |
| `POST` | `/api/risk/position-calculator` | Deterministic position sizing |
| `GET` | `/api/risk/exposure` | Portfolio exposure breakdown |
| `GET/POST` | `/api/risk/profile` | Get or update user risk profile |
| `GET` | `/api/journal/trades` | Trade journal history |
| `POST` | `/api/journal/trade` | Record a trade |
| `GET` | `/api/journal/plans` | Saved trade plans |
| `POST` | `/api/journal/plan` | Create/update a trade plan |
| `GET` | `/api/journal/analytics` | Deterministic journal performance metrics |

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/safety` | Trade Safety Review | Run the 5-agent committee, view explainable safety card |
| `/risk` | Risk Management | Risk profile configuration, portfolio exposure, position calculator |
| `/journal` | Trade Journal | Trade plans, trade history, performance analytics |

---

## Educational Disclaimer

MarketMind Trader Safety Intelligence provides strictly educational risk analytics and trade decision quality review. It does not execute trades, place orders, or provide personalized financial advice. All calculations are transparent, deterministic, and auditable. Always consult a SEBI-registered financial advisor before making investment decisions.
