"""
Deterministic Safety Calculations Service for MarketMind Trader Safety Intelligence.
100% Pure Python mathematical functions with ZERO LLM dependencies.
Never hallucinates numbers, risk metrics, or regulatory statutory charges.
"""

import math
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone, timedelta


def safe_round(val: Optional[float], decimals: int = 2) -> float:
    """Safely rounds float values, guarding against None, NaN, and Inf."""
    if val is None or math.isnan(val) or math.isinf(val):
        return 0.0
    return round(float(val), decimals)


# =====================================================================
# 1. TRADE P&L AND REGULATORY CHARGES (INDIAN EQUITIES - NSE/BSE)
# =====================================================================

def calculate_gross_pnl(entry_price: float, exit_price: float, quantity: int, direction: str = "LONG") -> float:
    """Calculates gross trading profit or loss before any fees."""
    if quantity <= 0 or entry_price <= 0 or exit_price <= 0:
        return 0.0
    direction_upper = direction.upper().strip()
    if direction_upper == "LONG":
        return safe_round((exit_price - entry_price) * quantity)
    elif direction_upper == "SHORT":
        return safe_round((entry_price - exit_price) * quantity)
    return 0.0


def calculate_estimated_charges(
    entry_price: float,
    exit_price: float,
    quantity: int,
    direction: str = "LONG",
    is_intraday: bool = True
) -> Dict[str, float]:
    """
    Estimates standard Indian equity exchange and statutory charges:
    - Brokerage: Zero (Discount broker model, e.g., Zerodha/Groww) or flat nominal ₹20/order
    - STT (Securities Transaction Tax):
        - Intraday Equity: 0.025% on sell turnover
        - Delivery Equity: 0.1% on buy and sell turnover
    - Exchange Turnover Charges (NSE): 0.00297% on turnover
    - SEBI Turnover Charges: ₹10 per crore (0.0001% of turnover)
    - Stamp Duty: 0.003% on buy turnover for intraday (0.015% for delivery)
    - GST (18% on Brokerage + Exchange charges + SEBI charges)
    """
    if quantity <= 0 or entry_price <= 0 or exit_price <= 0:
        return {
            "brokerage": 0.0,
            "stt": 0.0,
            "exchange_charges": 0.0,
            "sebi_charges": 0.0,
            "stamp_duty": 0.0,
            "gst": 0.0,
            "total_charges": 0.0
        }

    buy_price = entry_price if direction.upper() == "LONG" else exit_price
    sell_price = exit_price if direction.upper() == "LONG" else entry_price

    buy_turnover = buy_price * quantity
    sell_turnover = sell_price * quantity
    total_turnover = buy_turnover + sell_turnover

    # Nominal discount brokerage: ₹20 per executed order (buy + sell = ₹40 max)
    brokerage = 40.0

    if is_intraday:
        stt = sell_turnover * 0.00025  # 0.025% on sell side
        stamp_duty = buy_turnover * 0.00003  # 0.003% on buy side
    else:
        stt = total_turnover * 0.001  # 0.1% both sides
        stamp_duty = buy_turnover * 0.00015  # 0.015% on buy side

    exchange_charges = total_turnover * 0.0000297  # ~0.00297%
    sebi_charges = total_turnover * 0.000001  # ₹10 per crore
    gst = (brokerage + exchange_charges + sebi_charges) * 0.18

    total = brokerage + stt + exchange_charges + sebi_charges + stamp_duty + gst

    return {
        "brokerage": safe_round(brokerage),
        "stt": safe_round(stt),
        "exchange_charges": safe_round(exchange_charges),
        "sebi_charges": safe_round(sebi_charges),
        "stamp_duty": safe_round(stamp_duty),
        "gst": safe_round(gst),
        "total_charges": safe_round(total)
    }


def calculate_estimated_slippage(price: float, quantity: int, slippage_pct: float = 0.05) -> float:
    """Estimates market impact and execution slippage in INR (default 0.05% of turnover)."""
    if price <= 0 or quantity <= 0:
        return 0.0
    turnover = price * quantity * 2  # round-trip slippage
    return safe_round(turnover * (slippage_pct / 100.0))


def calculate_net_pnl(
    entry_price: float,
    exit_price: float,
    quantity: int,
    direction: str = "LONG",
    is_intraday: bool = True
) -> float:
    """Calculates net profit/loss after factoring in standard Indian statutory charges."""
    gross = calculate_gross_pnl(entry_price, exit_price, quantity, direction)
    charges = calculate_estimated_charges(entry_price, exit_price, quantity, direction, is_intraday)
    return safe_round(gross - charges["total_charges"])


# =====================================================================
# 2. POSITION SIZING & RISK AMOUNTS
# =====================================================================

def calculate_max_safe_quantity(
    capital: float,
    risk_percent: float,
    entry_price: float,
    stop_loss: float,
    include_charges: bool = True
) -> int:
    """
    Deterministic Maximum Safe Quantity formula:
        maximum_quantity = floor((capital * (risk_percent / 100)) / abs(entry_price - stop_loss))
    Enforces that trade risk never exceeds user's defined risk budget.
    """
    if capital <= 0 or risk_percent <= 0 or entry_price <= 0 or stop_loss <= 0:
        return 0

    per_share_risk = abs(entry_price - stop_loss)
    if per_share_risk <= 0:
        return 0

    risk_budget = capital * (risk_percent / 100.0)

    # Optional buffer for charges and slippage (~2% of risk budget)
    if include_charges:
        risk_budget = max(0.0, risk_budget * 0.98)

    max_qty_by_risk = int(math.floor(risk_budget / per_share_risk))
    # Capital limit guard: cannot purchase more shares than total cash affords
    max_qty_by_capital = int(math.floor(capital / entry_price))

    return max(0, min(max_qty_by_risk, max_qty_by_capital))


def calculate_requested_risk_amount(entry_price: float, stop_loss: float, quantity: int) -> float:
    """Calculates the total monetary amount at risk if stop-loss is triggered."""
    if quantity <= 0 or entry_price <= 0 or stop_loss <= 0:
        return 0.0
    per_share_risk = abs(entry_price - stop_loss)
    return safe_round(per_share_risk * quantity)


def calculate_position_size(
    capital: float,
    risk_percent: float,
    entry_price: float,
    stop_loss: float,
    target: Optional[float] = None,
    instrument_type: str = "EQUITY",
    direction: str = "BUY"
) -> Dict[str, Any]:
    """
    Comprehensive deterministic position sizing calculator.
    Returns maximum safe quantity, risk per share, statutory charges, slippage, and friction.
    """
    if capital <= 0 or risk_percent <= 0 or entry_price <= 0:
        return {
            "capital": capital,
            "risk_percent": risk_percent,
            "max_risk_amount": 0.0,
            "risk_per_share": 0.0,
            "maximum_quantity": 0,
            "recommended_quantity": 0,
            "position_value": 0.0,
            "estimated_charges": 0.0,
            "estimated_slippage": 0.0,
            "net_risk_with_friction": 0.0,
            "worst_case_loss": 0.0,
            "capital_commitment_percent": 0.0,
            "reward_risk_ratio": 0.0,
            "formula_notes": "Invalid capital or entry price supplied."
        }

    if stop_loss <= 0:
        return {
            "capital": capital,
            "risk_percent": risk_percent,
            "max_risk_amount": safe_round(capital * (risk_percent / 100.0)),
            "risk_per_share": 0.0,
            "maximum_quantity": 0,
            "recommended_quantity": 0,
            "position_value": 0.0,
            "estimated_charges": 0.0,
            "estimated_slippage": 0.0,
            "net_risk_with_friction": 0.0,
            "worst_case_loss": 0.0,
            "capital_commitment_percent": 0.0,
            "reward_risk_ratio": 0.0,
            "formula_notes": "Invalid stop loss. Stop loss must be strictly positive."
        }

    max_qty = calculate_max_safe_quantity(capital, risk_percent, entry_price, stop_loss)
    max_risk = safe_round(capital * (risk_percent / 100.0))
    risk_per_share = safe_round(abs(entry_price - stop_loss))
    position_val = safe_round(max_qty * entry_price)

    charges = calculate_estimated_charges(entry_price, stop_loss, max_qty)["total_charges"] if max_qty > 0 else 0.0
    slippage = calculate_estimated_slippage(stop_loss, max_qty) if max_qty > 0 else 0.0
    worst_loss = calculate_worst_case_loss(entry_price, stop_loss, max_qty) if max_qty > 0 else 0.0

    rrr = 0.0
    if target and target > 0 and risk_per_share > 0:
        rrr = safe_round(abs(target - entry_price) / risk_per_share, 2)

    capital_commitment = safe_round((position_val / capital) * 100.0, 1) if capital > 0 else 0.0

    return {
        "capital": capital,
        "risk_percent": risk_percent,
        "max_risk_amount": max_risk,
        "risk_per_share": risk_per_share,
        "maximum_quantity": max_qty,
        "recommended_quantity": max_qty,
        "position_value": position_val,
        "estimated_charges": charges,
        "estimated_slippage": slippage,
        "net_risk_with_friction": safe_round((risk_per_share * max_qty) + charges + slippage),
        "worst_case_loss": worst_loss,
        "capital_commitment_percent": capital_commitment,
        "reward_risk_ratio": rrr,
        "formula_notes": f"Enforced risk budget: Rs {max_risk} ({risk_percent}% of capital). Max safe quantity: {max_qty}."
    }



def calculate_worst_case_loss(
    entry_price: float,
    stop_loss: float,
    quantity: int,
    slippage_multiplier: float = 1.5,
    is_intraday: bool = True
) -> float:
    """
    Calculates worst-case loss scenario including stop-loss gap slippage (1.5x nominal slippage)
    and all mandatory statutory execution charges.
    """
    if quantity <= 0 or entry_price <= 0 or stop_loss <= 0:
        return 0.0
    nominal_risk = calculate_requested_risk_amount(entry_price, stop_loss, quantity)
    charges = calculate_estimated_charges(entry_price, stop_loss, quantity, is_intraday=is_intraday)
    slippage = calculate_estimated_slippage(stop_loss, quantity) * slippage_multiplier
    return safe_round(nominal_risk + charges["total_charges"] + slippage)


def calculate_remaining_daily_risk_budget(
    daily_loss_limit: float,
    realized_loss_today: float,
    open_risk_today: float = 0.0
) -> float:
    """Calculates remaining risk budget for today before daily stop limit is reached."""
    # realized_loss_today is positive if it represents a loss
    used_risk = max(0.0, realized_loss_today) + max(0.0, open_risk_today)
    remaining = daily_loss_limit - used_risk
    return safe_round(max(0.0, remaining))


# =====================================================================
# 3. PORTFOLIO EXPOSURE & CONCENTRATION METRICS
# =====================================================================

def calculate_portfolio_exposure(
    open_positions: List[Dict[str, Any]],
    proposed_position_value: float,
    total_capital: float
) -> Dict[str, float]:
    """
    Calculates total portfolio exposure percentage before and after proposed trade.
    """
    if total_capital <= 0:
        return {"current_exposure_pct": 0.0, "proposed_exposure_pct": 0.0, "total_exposure_value": 0.0}

    current_val = sum(pos.get("quantity", 0) * pos.get("current_price", pos.get("entry_price", 0)) for pos in open_positions)
    proposed_total = current_val + max(0.0, proposed_position_value)

    return {
        "current_exposure_pct": safe_round((current_val / total_capital) * 100.0),
        "proposed_exposure_pct": safe_round((proposed_total / total_capital) * 100.0),
        "total_exposure_value": safe_round(proposed_total)
    }


def calculate_sector_exposure(
    open_positions: List[Dict[str, Any]],
    proposed_symbol: str,
    proposed_value: float,
    sector_mapping: Dict[str, str],
    total_capital: float
) -> Dict[str, Any]:
    """
    Calculates concentration in the proposed trade's sector.
    """
    if total_capital <= 0:
        return {"sector": "Unknown", "sector_exposure_pct": 0.0, "is_breach": False}

    target_sector = sector_mapping.get(proposed_symbol.upper().strip(), "Other")
    sector_val = proposed_value

    for pos in open_positions:
        sym = pos.get("symbol", "").upper().strip()
        sec = sector_mapping.get(sym, "Other")
        if sec.lower() == target_sector.lower():
            val = pos.get("quantity", 0) * pos.get("current_price", pos.get("entry_price", 0))
            sector_val += val

    exposure_pct = safe_round((sector_val / total_capital) * 100.0)
    return {
        "sector": target_sector,
        "sector_value": safe_round(sector_val),
        "sector_exposure_pct": exposure_pct,
        "is_breach": exposure_pct > 30.0  # Conservative institutional threshold
    }


def calculate_single_stock_concentration(
    open_positions: List[Dict[str, Any]],
    proposed_symbol: str,
    proposed_value: float,
    total_capital: float
) -> Dict[str, Any]:
    """
    Calculates concentration in a single security.
    """
    if total_capital <= 0:
        return {"symbol": proposed_symbol, "concentration_pct": 0.0, "is_breach": False}

    clean_sym = proposed_symbol.upper().strip()
    stock_val = proposed_value

    for pos in open_positions:
        if pos.get("symbol", "").upper().strip() == clean_sym:
            val = pos.get("quantity", 0) * pos.get("current_price", pos.get("entry_price", 0))
            stock_val += val

    concentration_pct = safe_round((stock_val / total_capital) * 100.0)
    return {
        "symbol": clean_sym,
        "stock_value": safe_round(stock_val),
        "concentration_pct": concentration_pct,
        "is_breach": concentration_pct > 20.0  # Single stock risk ceiling
    }


# =====================================================================
# 4. BEHAVIOURAL ANOMALIES & GUARDRAILS
# =====================================================================

def detect_consecutive_losses(trades: List[Dict[str, Any]], threshold: int = 3) -> Dict[str, Any]:
    """Detects whether user has experienced N or more consecutive losses in recent trades."""
    streak = 0
    recent_losses = []
    # Assumes trades are sorted chronologically or latest first; ensure evaluation order
    for t in trades:
        pnl = t.get("net_pnl", t.get("pnl", 0.0))
        if pnl < 0:
            streak += 1
            recent_losses.append(pnl)
        else:
            break

    triggered = streak >= threshold
    return {
        "triggered": triggered,
        "streak_count": streak,
        "total_lost_in_streak": safe_round(abs(sum(recent_losses))),
        "message": f"Detected {streak} consecutive losses. Pausing recommended to avoid emotional tilt." if triggered else "Normal loss sequence."
    }


def detect_revenge_trading(
    recent_trades: List[Dict[str, Any]],
    new_plan_timestamp: Optional[datetime] = None,
    cooldown_minutes: int = 30
) -> Dict[str, Any]:
    """
    Detects revenge trading: entering a new position rapidly (<30 min) after a significant loss.
    """
    if not recent_trades:
        return {"triggered": False, "message": "No recent closed trades."}

    last_trade = recent_trades[0]
    last_pnl = last_trade.get("net_pnl", last_trade.get("pnl", 0.0))
    if last_pnl >= 0:
        return {"triggered": False, "message": "Last trade was profitable or break-even."}

    exit_time_raw = last_trade.get("exit_time", last_trade.get("closed_at"))
    if not exit_time_raw:
        return {"triggered": False, "message": "No exit timestamp available."}

    try:
        if isinstance(exit_time_raw, str):
            exit_dt = datetime.fromisoformat(exit_time_raw.replace("Z", "+00:00"))
        else:
            exit_dt = exit_time_raw

        now_dt = new_plan_timestamp or datetime.now(timezone.utc)
        if exit_dt.tzinfo is None:
            exit_dt = exit_dt.replace(tzinfo=timezone.utc)
        if now_dt.tzinfo is None:
            now_dt = now_dt.replace(tzinfo=timezone.utc)

        time_diff = (now_dt - exit_dt).total_seconds() / 60.0
        if 0 <= time_diff <= cooldown_minutes:
            return {
                "triggered": True,
                "minutes_since_loss": safe_round(time_diff, 1),
                "last_loss_amount": safe_round(abs(last_pnl)),
                "message": f"Entering new trade only {safe_round(time_diff, 1)} minutes after a loss of ₹{abs(last_pnl):,.2f}. High revenge-trading risk."
            }
    except Exception:
        pass

    return {"triggered": False, "message": "Trade entry timing outside emotional revenge window."}


def detect_position_size_anomaly(
    requested_quantity: int,
    entry_price: float,
    past_trades: List[Dict[str, Any]],
    multiplier_threshold: float = 2.0
) -> Dict[str, Any]:
    """Detects if requested trade value is more than 2x the user's historical average trade size."""
    if not past_trades or requested_quantity <= 0 or entry_price <= 0:
        return {"triggered": False, "average_trade_value": 0.0, "current_trade_value": safe_round(requested_quantity * entry_price)}

    past_values = []
    for t in past_trades[:20]:
        qty = t.get("quantity", 0)
        p = t.get("entry_price", 0.0)
        if qty > 0 and p > 0:
            past_values.append(qty * p)

    if not past_values:
        return {"triggered": False, "average_trade_value": 0.0, "current_trade_value": safe_round(requested_quantity * entry_price)}

    avg_val = sum(past_values) / len(past_values)
    current_val = requested_quantity * entry_price
    triggered = current_val > (avg_val * multiplier_threshold)

    return {
        "triggered": triggered,
        "average_trade_value": safe_round(avg_val),
        "current_trade_value": safe_round(current_val),
        "ratio": safe_round(current_val / avg_val if avg_val > 0 else 1.0, 2),
        "message": f"Position value (₹{current_val:,.2f}) is {safe_round(current_val / avg_val, 1)}x your 20-trade average. Excessive risk detected." if triggered else "Position size within historical baseline."
    }


def detect_averaging_down(
    proposed_symbol: str,
    proposed_direction: str,
    open_positions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Detects whether user is adding to an existing losing open position (averaging down)."""
    clean_sym = proposed_symbol.upper().strip()
    clean_dir = proposed_direction.upper().strip()

    for pos in open_positions:
        if pos.get("symbol", "").upper().strip() == clean_sym and pos.get("direction", "LONG").upper() == clean_dir:
            cur_price = pos.get("current_price", pos.get("entry_price", 0.0))
            ent_price = pos.get("entry_price", 0.0)
            is_losing = (cur_price < ent_price) if clean_dir == "LONG" else (cur_price > ent_price)
            if is_losing:
                return {
                    "triggered": True,
                    "symbol": clean_sym,
                    "existing_entry": ent_price,
                    "current_price": cur_price,
                    "unrealized_loss": safe_round((cur_price - ent_price) * pos.get("quantity", 1) if clean_dir == "LONG" else (ent_price - cur_price) * pos.get("quantity", 1)),
                    "message": f"Adding to an existing underwater {clean_sym} position. Averaging down increases blowup probability."
                }

    return {"triggered": False, "message": "Not averaging down on an existing losing position."}


def detect_missing_stop_loss(stop_loss: Optional[float]) -> Dict[str, Any]:
    """Validates stop-loss presence. Trading without a stop loss is an immediate critical breach."""
    missing = stop_loss is None or stop_loss <= 0
    return {
        "triggered": missing,
        "message": "CRITICAL RISK: Missing stop-loss. Uncapped downside potential violates core risk discipline." if missing else "Stop-loss defined."
    }


def detect_daily_loss_limit_breach(realized_loss_today: float, daily_loss_limit: float) -> Dict[str, Any]:
    """Checks whether realized loss today has reached or breached the user's daily circuit breaker."""
    if daily_loss_limit <= 0:
        return {"triggered": False, "message": "No daily loss limit configured."}

    breached = realized_loss_today >= daily_loss_limit
    return {
        "triggered": breached,
        "realized_loss_today": safe_round(realized_loss_today),
        "daily_loss_limit": safe_round(daily_loss_limit),
        "message": f"Daily loss limit of ₹{daily_loss_limit:,.2f} reached (Loss today: ₹{realized_loss_today:,.2f}). Trading should halt immediately." if breached else "Daily loss limit intact."
    }


def detect_daily_trade_count_limit_breach(trades_today_count: int, max_daily_trades: int = 5) -> Dict[str, Any]:
    """Detects overtrading: executing more than max daily permitted trades."""
    breached = trades_today_count >= max_daily_trades
    return {
        "triggered": breached,
        "trades_today_count": trades_today_count,
        "max_daily_trades": max_daily_trades,
        "message": f"Overtrading alert: {trades_today_count} trades executed today (limit: {max_daily_trades})." if breached else "Trade frequency normal."
    }


# =====================================================================
# 5. JOURNAL PERFORMANCE ANALYTICS
# =====================================================================

def calculate_journal_analytics(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes deterministic statistical performance metrics from trading journal.
    Zero hallucination of win rate, profit factor, or drawdown.
    """
    if not trades:
        return {
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "win_rate_pct": 0.0,
            "profit_factor": 0.0,
            "average_win": 0.0,
            "average_loss": 0.0,
            "expectancy": 0.0,
            "max_drawdown": 0.0,
            "longest_losing_streak": 0,
            "total_net_pnl": 0.0
        }

    total_trades = len(trades)
    wins = []
    losses = []

    for t in trades:
        pnl = t.get("net_pnl", t.get("pnl", 0.0))
        if pnl > 0:
            wins.append(pnl)
        elif pnl < 0:
            losses.append(abs(pnl))

    win_count = len(wins)
    loss_count = len(losses)
    win_rate = (win_count / total_trades) * 100.0 if total_trades > 0 else 0.0

    total_win_amt = sum(wins)
    total_loss_amt = sum(losses)
    profit_factor = (total_win_amt / total_loss_amt) if total_loss_amt > 0 else (99.0 if total_win_amt > 0 else 0.0)

    avg_win = total_win_amt / win_count if win_count > 0 else 0.0
    avg_loss = total_loss_amt / loss_count if loss_count > 0 else 0.0

    # Mathematical Expectancy: (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
    win_prob = win_count / total_trades if total_trades > 0 else 0.0
    loss_prob = loss_count / total_trades if total_trades > 0 else 0.0
    expectancy = (win_prob * avg_win) - (loss_prob * avg_loss)

    # Maximum Drawdown calculation over cumulative equity curve
    cumulative = 0.0
    peak = 0.0
    max_dd = 0.0
    # Reversing trades if passed latest first
    ordered_trades = list(reversed(trades)) if trades[0].get("created_at", "") > trades[-1].get("created_at", "") else trades
    for t in ordered_trades:
        pnl = t.get("net_pnl", t.get("pnl", 0.0))
        cumulative += pnl
        if cumulative > peak:
            peak = cumulative
        dd = peak - cumulative
        if dd > max_dd:
            max_dd = dd

    # Longest losing streak across all history
    cur_streak = 0
    max_streak = 0
    for t in ordered_trades:
        pnl = t.get("net_pnl", t.get("pnl", 0.0))
        if pnl < 0:
            cur_streak += 1
            if cur_streak > max_streak:
                max_streak = cur_streak
        else:
            cur_streak = 0

    return {
        "total_trades": total_trades,
        "winning_trades": win_count,
        "losing_trades": loss_count,
        "win_rate_pct": safe_round(win_rate, 1),
        "profit_factor": safe_round(profit_factor, 2),
        "average_win": safe_round(avg_win),
        "average_loss": safe_round(avg_loss),
        "expectancy": safe_round(expectancy),
        "max_drawdown": safe_round(max_dd),
        "longest_losing_streak": max_streak,
        "total_net_pnl": safe_round(total_win_amt - total_loss_amt)
    }
