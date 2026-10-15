"""
Trader Safety Intelligence API Routes.
Exposes endpoints for the Trade Safety Committee workflow, risk calculator,
trading journal, exposure analytics, and explainable safety cards.
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.agents.safety.schemas import (
    TradeSafetyReviewRequest,
    TradeSafetyReviewResponse,
    PositionCalculationRequest,
    PositionCalculationResponse,
    TradeJournalEntryRequest,
    RiskProfileRequest,
    RiskProfileResponse,
    TradeJournalAnalyticsResponse
)
from app.agents.safety.orchestrator import trade_safety_orchestrator
from app.services.safety_calculations import (
    calculate_position_size,
    calculate_portfolio_exposure,
    calculate_journal_analytics
)
from app.db.client import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Trader Safety Intelligence"])


class OverrideReviewRequest(BaseModel):
    user_id: str
    workflow_id: str
    override_reason: str = Field(..., min_length=5, description="Mandatory rationale when bypassing committee advice")


class SafetyExplainResponse(BaseModel):
    ticker: str
    safety_recommendation: str
    overall_confidence: int
    key_risks: List[str]
    supporting_evidence: List[str]
    counter_evidence: List[str]
    deterministic_calculations: Dict[str, Any]
    what_would_change_review: List[str]
    disclaimer: str


@router.post("/safety/review", response_model=TradeSafetyReviewResponse)
async def conduct_safety_review(req: TradeSafetyReviewRequest):
    """
    Execute the 5-Agent Trade Safety Committee workflow.
    Validates trade plan, evaluates market & portfolio risks, synthesizes news evidence,
    applies behavioural guardrails, and renders a final explainable safety card.
    """
    try:
        response = await trade_safety_orchestrator.review_trade_plan(req)
        # Log to audit log
        if req.user_id:
            await db.log_audit_action(
                user_id=req.user_id,
                action="TRADE_SAFETY_REVIEW_EXECUTED",
                entity_type="SAFETY_REVIEW",
                entity_id=response.workflow_id,
                details={
                    "ticker": req.ticker,
                    "verdict": response.safety_recommendation,
                    "confidence": response.overall_confidence
                }
            )
        return response
    except Exception as e:
        logger.error(f"Error executing safety review for {req.ticker}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to execute safety review: {str(e)}")


@router.post("/safety/override")
async def override_safety_review(req: OverrideReviewRequest):
    """
    Record user override of a CAUTION, PAUSE, or DO_NOT_PROCEED recommendation with written rationale.
    """
    try:
        reviews = await db.get_safety_reviews(user_id=req.user_id, limit=20)
        target = next((r for r in reviews if r.get("id") == req.workflow_id or r.get("workflow_id") == req.workflow_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="Safety review not found.")

        # Update override fields
        target["user_override"] = True
        target["override_reason"] = req.override_reason
        from datetime import datetime
        target["override_acknowledged_at"] = datetime.now().isoformat()

        await db.save_safety_review(target)
        await db.log_audit_action(
            user_id=req.user_id,
            action="SAFETY_REVIEW_OVERRIDDEN",
            entity_type="SAFETY_REVIEW",
            entity_id=req.workflow_id,
            details={"override_reason": req.override_reason}
        )
        return {"status": "success", "message": "Override logged successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording safety override: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/safety/{ticker}/history")
async def get_safety_history(ticker: str, user_id: Optional[str] = Query(None), limit: int = Query(20, ge=1, le=100)):
    """Fetch past safety reviews for a specific ticker."""
    try:
        reviews = await db.get_safety_reviews(ticker=ticker, user_id=user_id, limit=limit)
        return {"ticker": ticker.upper(), "count": len(reviews), "reviews": reviews}
    except Exception as e:
        logger.error(f"Error fetching safety history for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/safety/{ticker}/explain", response_model=SafetyExplainResponse)
async def get_safety_explain(ticker: str, user_id: Optional[str] = Query(None)):
    """Get the latest explainable breakdown for a ticker's trade plan."""
    try:
        reviews = await db.get_safety_reviews(ticker=ticker, user_id=user_id, limit=1)
        if not reviews:
            raise HTTPException(status_code=404, detail=f"No safety reviews found for ticker {ticker}")
        
        latest = reviews[0]
        reviewer_data = latest.get("agent_outputs", {}).get("reviewer", {}) if isinstance(latest.get("agent_outputs"), dict) else {}
        d_math = latest.get("deterministic_calcs") or {}

        return SafetyExplainResponse(
            ticker=ticker.upper(),
            safety_recommendation=latest.get("safety_recommendation", "PROCEED_WITH_CAUTION"),
            overall_confidence=latest.get("overall_confidence", 70),
            key_risks=reviewer_data.get("key_risks", []),
            supporting_evidence=reviewer_data.get("supporting_evidence", []),
            counter_evidence=reviewer_data.get("counter_evidence", []),
            deterministic_calculations=d_math,
            what_would_change_review=reviewer_data.get("what_would_change_review", []),
            disclaimer="MarketMind Trader Safety Intelligence provides strictly educational risk analytics."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating explanation for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Risk Calculator & Portfolio Exposure Endpoints
# =============================================================================

@router.post("/risk/position-calculator", response_model=PositionCalculationResponse)
async def calculate_position(req: PositionCalculationRequest):
    """
    Deterministic position sizing calculator honoring user risk capital,
    SEBI statutory charges, execution slippage, and maximum safe quantity.
    """
    try:
        sizing = calculate_position_size(
            capital=req.capital,
            risk_percent=req.risk_percent,
            entry_price=req.entry_price,
            stop_loss=req.stop_loss,
            target=req.target,
            instrument_type=req.instrument_type,
            direction=req.direction
        )
        return PositionCalculationResponse(**sizing)
    except Exception as e:
        logger.error(f"Error in position size calculation: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/risk/exposure")
async def get_portfolio_exposure(user_id: str = Query(...)):
    """
    Deterministic portfolio exposure breakdown based on open positions and active risk profile.
    """
    try:
        profile_data = await db.get_user_risk_profile(user_id)
        capital = float(profile_data["trading_capital"]) if profile_data else 500000.0

        open_positions = await db.get_user_open_positions(user_id)
        exposure = calculate_portfolio_exposure(open_positions, 0.0, capital)

        # Compute sector mapping and individual risks
        total_risk_exposure = sum(
            pos.get("quantity", 0) * abs(pos.get("entry_price", 0) - pos.get("stop_loss", pos.get("entry_price", 0)))
            for pos in open_positions if pos.get("stop_loss")
        )

        return {
            "user_id": user_id,
            "capital": capital,
            "open_positions_count": len(open_positions),
            "open_position_count": len(open_positions),
            "open_positions": open_positions,
            "total_risk_exposure": round(total_risk_exposure, 2),
            "current_exposure_pct": exposure.get("current_exposure_pct", 0.0),
            "total_exposure_value": exposure.get("total_exposure_value", 0.0),
            "exposure": exposure
        }
    except Exception as e:
        logger.error(f"Error calculating portfolio exposure for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk/profile", response_model=RiskProfileResponse)
async def get_risk_profile(user_id: str = Query(...)):
    """Get the active risk profile for the user."""
    try:
        profile = await db.get_user_risk_profile(user_id)
        if not profile:
            # Return sensible default profile
            return RiskProfileResponse(
                user_id=user_id,
                trading_capital=100000.0,
                risk_per_trade_percent=1.0,
                max_daily_loss_percent=3.0,
                max_open_positions=5,
                max_sector_exposure_percent=25.0,
                max_single_stock_exposure_percent=15.0,
                max_trades_per_day=6,
                cooling_off_minutes=30,
                account_mode="paper"
            )
        return RiskProfileResponse(**profile)
    except Exception as e:
        logger.error(f"Error fetching risk profile for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/risk/profile")
async def save_risk_profile(req: RiskProfileRequest):
    """Save or update the user risk profile."""
    try:
        success = await db.save_user_risk_profile(req.user_id, req.dict())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save risk profile.")
        return {"status": "success", "message": "Risk profile updated."}
    except Exception as e:
        logger.error(f"Error saving risk profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Trade Journal & Analytics Endpoints
# =============================================================================

@router.get("/journal/trades")
async def get_trades(user_id: str = Query(...), limit: int = Query(50, ge=1, le=200)):
    """Retrieve recorded trade journal history."""
    try:
        trades = await db.get_user_trades(user_id, limit=limit)
        return {"user_id": user_id, "trades": trades}
    except Exception as e:
        logger.error(f"Error retrieving trades for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/journal/trade")
async def record_trade(req: TradeJournalEntryRequest):
    """Record a trade entry in the trading journal."""
    try:
        trade_id = await db.save_user_trade(req.dict())
        if not trade_id:
            raise HTTPException(status_code=500, detail="Failed to record trade entry.")
        
        await db.log_audit_action(
            user_id=req.user_id,
            action="TRADE_JOURNAL_RECORDED",
            entity_type="TRADE",
            entity_id=trade_id,
            details={"ticker": req.ticker, "status": req.status}
        )
        return {"status": "success", "trade_id": trade_id}
    except Exception as e:
        logger.error(f"Error recording trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/journal/plans")
async def get_trade_plans(user_id: str = Query(...), limit: int = Query(50, ge=1, le=200)):
    """Retrieve saved trade plans."""
    try:
        plans = await db.get_user_trade_plans(user_id, limit=limit)
        return {"user_id": user_id, "plans": plans}
    except Exception as e:
        logger.error(f"Error retrieving trade plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/journal/plan")
async def create_trade_plan(plan: Dict[str, Any]):
    """Create or update a trade plan."""
    try:
        user_id = plan.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        plan_id = await db.save_user_trade_plan(plan)
        return {"status": "success", "trade_plan_id": plan_id}
    except Exception as e:
        logger.error(f"Error saving trade plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/journal/analytics", response_model=TradeJournalAnalyticsResponse)
async def get_journal_analytics(user_id: str = Query(...)):
    """
    Calculate deterministic journal performance and behavioral metrics
    (win rate, profit factor, expectancy, max drawdown, loss streak).
    """
    try:
        trades = await db.get_user_trades(user_id, limit=100)
        raw = calculate_journal_analytics(trades)
        # Map internal keys to response schema
        mapped = TradeJournalAnalyticsResponse(
            total_trades=raw.get("total_trades", 0),
            win_rate_percent=raw.get("win_rate_pct", 0.0),
            profit_factor=raw.get("profit_factor", 0.0),
            expectancy_per_trade=raw.get("expectancy", 0.0),
            max_drawdown=raw.get("max_drawdown", 0.0),
            longest_losing_streak=raw.get("longest_losing_streak", 0),
            gross_pnl=raw.get("total_net_pnl", 0.0) + sum(abs(t.get("charges", 0.0)) for t in trades),
            total_charges=sum(abs(t.get("charges", 0.0)) for t in trades),
            net_pnl=raw.get("total_net_pnl", 0.0),
            loss_streak_active=raw.get("longest_losing_streak", 0) >= 3,
            status_summary="Healthy" if raw.get("longest_losing_streak", 0) < 3 else "Attention Needed"
        )
        return mapped
    except Exception as e:
        logger.error(f"Error calculating journal analytics for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

