"""
Unit tests for deterministic safety calculations in MarketMind.
Zero LLM dependencies. Tests pure Python math, Indian statutory charges, and behavioral rules.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import datetime, timezone, timedelta
from app.services.safety_calculations import (
    calculate_gross_pnl,
    calculate_estimated_charges,
    calculate_estimated_slippage,
    calculate_net_pnl,
    calculate_max_safe_quantity,
    calculate_requested_risk_amount,
    calculate_worst_case_loss,
    calculate_remaining_daily_risk_budget,
    calculate_portfolio_exposure,
    calculate_sector_exposure,
    calculate_single_stock_concentration,
    detect_consecutive_losses,
    detect_revenge_trading,
    detect_position_size_anomaly,
    detect_averaging_down,
    detect_missing_stop_loss,
    detect_daily_loss_limit_breach,
    detect_daily_trade_count_limit_breach,
    calculate_journal_analytics
)


def test_gross_and_net_pnl():
    # Long trade: Buy at 2900, sell at 3000, 10 shares -> Gross ₹1000
    gross = calculate_gross_pnl(2900, 3000, 10, "LONG")
    assert gross == 1000.0

    # Short trade: Sell at 3000, buy back at 2950, 10 shares -> Gross ₹500
    gross_short = calculate_gross_pnl(3000, 2950, 10, "SHORT")
    assert gross_short == 500.0

    # Charges check
    charges = calculate_estimated_charges(2900, 3000, 10, "LONG", is_intraday=True)
    assert charges["total_charges"] > 0.0
    assert charges["stt"] > 0.0
    assert charges["gst"] > 0.0

    # Net PnL must be strictly less than Gross PnL
    net = calculate_net_pnl(2900, 3000, 10, "LONG", is_intraday=True)
    assert net < gross
    assert net == round(gross - charges["total_charges"], 2)


def test_max_safe_quantity():
    # Capital ₹100,000, Risk 1% (₹1,000 budget), Entry ₹2,500, Stop Loss ₹2,450 (₹50 per share risk)
    # Expected max qty = floor((1000 * 0.98) / 50) = 19 shares
    qty = calculate_max_safe_quantity(
        capital=100000,
        risk_percent=1.0,
        entry_price=2500,
        stop_loss=2450,
        include_charges=True
    )
    assert qty == 19

    # Edge cases
    assert calculate_max_safe_quantity(0, 1.0, 2500, 2450) == 0
    assert calculate_max_safe_quantity(100000, 0, 2500, 2450) == 0
    assert calculate_max_safe_quantity(100000, 1.0, 2500, 2500) == 0  # 0 risk per share


def test_requested_risk_and_worst_case_loss():
    entry = 2950.0
    sl = 2900.0
    qty = 20

    risk_amt = calculate_requested_risk_amount(entry, sl, qty)
    assert risk_amt == 1000.0  # 50 * 20

    worst_case = calculate_worst_case_loss(entry, sl, qty)
    # Worst case includes nominal risk + charges + 1.5x slippage
    assert worst_case > risk_amt


def test_daily_risk_budget():
    limit = 5000.0
    realized_loss = 2000.0
    open_risk = 1000.0

    remaining = calculate_remaining_daily_risk_budget(limit, realized_loss, open_risk)
    assert remaining == 2000.0

    # If losses exceed limit, remaining is 0.0
    assert calculate_remaining_daily_risk_budget(limit, 6000.0, 0.0) == 0.0


def test_portfolio_and_sector_exposure():
    capital = 200000.0
    open_pos = [
        {"symbol": "INFY", "quantity": 20, "entry_price": 1800.0, "current_price": 1850.0},
        {"symbol": "TCS", "quantity": 10, "entry_price": 4000.0, "current_price": 4000.0}
    ]
    # Current value = 20*1850 + 10*4000 = 37,000 + 40,000 = 77,000
    # Proposed trade = ₹23,000 -> Total = ₹100,000 (50% of capital)
    exp = calculate_portfolio_exposure(open_pos, 23000.0, capital)
    assert exp["proposed_exposure_pct"] == 50.0

    # Sector exposure
    sector_map = {"INFY": "IT", "TCS": "IT", "WIPRO": "IT", "RELIANCE": "Energy"}
    sec_exp = calculate_sector_exposure(open_pos, "WIPRO", 20000.0, sector_map, capital)
    # Total IT = 37,000 + 40,000 + 20,000 = 97,000 / 200,000 = 48.5%
    assert sec_exp["sector"] == "IT"
    assert sec_exp["sector_exposure_pct"] == 48.5
    assert sec_exp["is_breach"] is True  # > 30%

    # Single stock concentration
    single_exp = calculate_single_stock_concentration(open_pos, "INFY", 10000.0, capital)
    # Total INFY = 37,000 + 10,000 = 47,000 / 200,000 = 23.5%
    assert single_exp["concentration_pct"] == 23.5
    assert single_exp["is_breach"] is True  # > 20%


def test_behavioral_anomalies():
    # 1. Consecutive losses
    trades = [
        {"net_pnl": -500.0},
        {"net_pnl": -300.0},
        {"net_pnl": -1200.0},
        {"net_pnl": 1500.0}
    ]
    streak_res = detect_consecutive_losses(trades, threshold=3)
    assert streak_res["triggered"] is True
    assert streak_res["streak_count"] == 3

    # 2. Revenge trading
    now = datetime.now(timezone.utc)
    recent_losing_trade = [
        {"net_pnl": -2500.0, "exit_time": (now - timedelta(minutes=10)).isoformat()}
    ]
    revenge_res = detect_revenge_trading(recent_losing_trade, new_plan_timestamp=now, cooldown_minutes=30)
    assert revenge_res["triggered"] is True
    assert revenge_res["minutes_since_loss"] <= 10.5

    # 3. Position size anomaly (> 2x average)
    past_trades = [{"quantity": 10, "entry_price": 1000.0} for _ in range(5)]  # Avg ₹10,000
    # Proposed ₹25,000 (> 2x)
    size_anomaly = detect_position_size_anomaly(requested_quantity=25, entry_price=1000.0, past_trades=past_trades)
    assert size_anomaly["triggered"] is True

    # 4. Averaging down
    open_positions = [{"symbol": "RELIANCE", "direction": "LONG", "entry_price": 2900.0, "current_price": 2800.0, "quantity": 10}]
    avg_down = detect_averaging_down("RELIANCE", "LONG", open_positions)
    assert avg_down["triggered"] is True

    # 5. Missing stop loss
    assert detect_missing_stop_loss(None)["triggered"] is True
    assert detect_missing_stop_loss(0.0)["triggered"] is True
    assert detect_missing_stop_loss(2900.0)["triggered"] is False

    # 6. Daily loss limit breach
    assert detect_daily_loss_limit_breach(5500.0, 5000.0)["triggered"] is True
    assert detect_daily_loss_limit_breach(2000.0, 5000.0)["triggered"] is False


def test_journal_analytics():
    sample_trades = [
        {"net_pnl": 1000.0, "created_at": "2026-10-01T10:00:00Z"},
        {"net_pnl": 2000.0, "created_at": "2026-10-02T10:00:00Z"},
        {"net_pnl": -500.0, "created_at": "2026-10-03T10:00:00Z"},
        {"net_pnl": -1000.0, "created_at": "2026-10-04T10:00:00Z"},
        {"net_pnl": 1500.0, "created_at": "2026-10-05T10:00:00Z"},
    ]
    # Total: 5, Wins: 3, Losses: 2 -> Win Rate = 60.0%
    # Total Win: ₹4500, Total Loss: ₹1500 -> Profit Factor = 3.0
    analytics = calculate_journal_analytics(sample_trades)
    assert analytics["total_trades"] == 5
    assert analytics["winning_trades"] == 3
    assert analytics["losing_trades"] == 2
    assert analytics["win_rate_pct"] == 60.0
    assert analytics["profit_factor"] == 3.0
    assert analytics["total_net_pnl"] == 3000.0
    assert analytics["longest_losing_streak"] == 2
