"""
Test Suite for Trade Safety Committee Workflow.
Tests:
1. End-to-end committee workflow with deterministic calculations and fallback isolation.
2. Missing stop-loss triggers safe 0 position size and critical warning.
3. Worst-case loss calculation including friction (slippage + statutory taxes).
4. Journal analytics deterministic calculations (win rate, profit factor, drawdown).
"""

import sys
import os
import asyncio

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.safety.schemas import (
    TradeSafetyReviewRequest,
    TradeSafetyReviewResponse,
    SafetyRecommendation
)
from app.agents.safety.orchestrator import trade_safety_orchestrator
from app.services.safety_calculations import (
    calculate_position_size,
    calculate_worst_case_loss,
    calculate_journal_analytics
)


def test_missing_stop_loss_deterministic():
    print("Testing missing stop-loss deterministic handling...")
    res = calculate_position_size(
        capital=100000.0,
        risk_percent=1.0,
        entry_price=2500.0,
        stop_loss=0.0,
        target=2600.0,
        instrument_type="EQUITY",
        direction="BUY"
    )
    assert res["maximum_quantity"] == 0
    assert "Invalid stop loss" in res["formula_notes"]
    print("  -> PASSED: Zero stop loss returned safe 0 quantity.")


def test_worst_case_loss_calculation():
    print("Testing worst-case loss with slippage and charges...")
    loss = calculate_worst_case_loss(
        entry_price=2500.0,
        stop_loss=2450.0,
        quantity=20,
        slippage_multiplier=1.5,
        is_intraday=True
    )
    # Price difference: 50 * 20 = 1000
    # Slippage + charges will push total loss above 1000
    assert loss > 1000.0
    print(f"  -> PASSED: Worst case loss properly computed: Rs {loss}")


def test_journal_analytics_calculation():
    print("Testing journal performance calculations...")
    trades = [
        {"net_pnl": 1200.0, "status": "CLOSED"},
        {"net_pnl": -500.0, "status": "CLOSED"},
        {"net_pnl": 800.0, "status": "CLOSED"},
        {"net_pnl": -400.0, "status": "CLOSED"},
        {"net_pnl": -600.0, "status": "CLOSED"},
    ]
    analytics = calculate_journal_analytics(trades)
    assert analytics["total_trades"] == 5
    assert analytics["win_rate_pct"] == 40.0
    assert analytics["profit_factor"] == round(2000.0 / 1500.0, 2)
    assert analytics["longest_losing_streak"] == 2
    print(f"  -> PASSED: Journal analytics calculated correctly: Win Rate {analytics['win_rate_pct']}%, PF {analytics['profit_factor']}")


async def test_committee_workflow_mocked():
    print("Testing 5-Agent Trade Safety Committee workflow with orchestrator...")

    req = TradeSafetyReviewRequest(
        ticker="RELIANCE",
        direction="LONG",
        entry_price=2500.0,
        stop_loss=2450.0,
        target=2650.0,
        quantity=20,
        strategy="Breakout",
        setup="20 EMA bounce on 15m chart",
        notes="High volume morning open",
        capital=200000.0,
        risk_percent=1.0,
        user_id="test_trader_1"
    )

    result = await trade_safety_orchestrator.review_trade_plan(req)

    assert result.ticker == "RELIANCE"
    assert result.workflow_id is not None
    assert result.safety_recommendation in [
        "SAFE_TO_REVIEW",
        "PROCEED_WITH_CAUTION",
        "PAUSE_AND_REVIEW",
        "DO_NOT_PROCEED"
    ]
    assert 0 <= result.overall_confidence <= 100
    assert result.agents.market_risk is not None
    assert result.agents.portfolio_risk is not None
    assert result.agents.trade_plan is not None
    assert result.agents.news_evidence is not None
    assert result.agents.behaviour is not None
    assert result.agents.reviewer is not None
    assert result.deterministic_calculations is not None
    print(f"  -> PASSED: Committee returned verdict: {result.safety_recommendation} (Confidence: {result.overall_confidence}%)")


async def test_missing_stop_loss_committee_handling():
    print("Testing missing stop-loss in committee workflow...")

    req = TradeSafetyReviewRequest(
        ticker="TCS",
        direction="LONG",
        entry_price=3500.0,
        stop_loss=None,  # Missing stop-loss
        target=3700.0,
        quantity=10,
        strategy="Discretionary",
        capital=100000.0,
        risk_percent=1.0,
        user_id="test_trader_2"
    )

    result = await trade_safety_orchestrator.review_trade_plan(req)
    # Missing stop loss should result in CAUTION, PAUSE_AND_REVIEW or DO_NOT_PROCEED
    assert result.safety_recommendation in ["PROCEED_WITH_CAUTION", "PAUSE_AND_REVIEW", "DO_NOT_PROCEED"]
    assert "stop_loss" in result.agents.trade_plan.missing_fields or any("stop-loss" in f.lower() for f in result.agents.trade_plan.risk_flags)
    print(f"  -> PASSED: Missing stop-loss detected by trade_plan agent. Flags: {result.agents.trade_plan.risk_flags}")


async def main():
    test_missing_stop_loss_deterministic()
    test_worst_case_loss_calculation()
    test_journal_analytics_calculation()
    await test_committee_workflow_mocked()
    await test_missing_stop_loss_committee_handling()
    print("\nALL SAFETY COMMITTEE TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(main())
