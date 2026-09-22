"""
User tracking and personalized intelligence API routes for MarketMind.
Enables dynamic stock tracking, personalized watchlists, and customized multi-agent reports.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Request
from pydantic import BaseModel

from app.models.instrument import TrackStockRequest, UntrackStockRequest, UserTrackedStock
from app.services.instrument_master import instrument_master
from app.services.market_data import market_data_service
from app.agents.orchestrator import orchestrator_service
from app.middleware.rate_limiter import rate_limiter
from app.db.client import db

router = APIRouter(prefix="/api/user", tags=["User Tracking & Intelligence"])

DEFAULT_USER_ID = "monthandas2008@gmail.com"

class GenerateReportRequest(BaseModel):
    user_id: Optional[str] = DEFAULT_USER_ID
    symbols: Optional[List[str]] = None

@router.get("/tracked")
async def get_tracked_stocks(user_id: str = Query(DEFAULT_USER_ID)):
    """
    Returns all stocks tracked by the specified user, enriched with real-time quotes,
    sector metadata, and latest multi-desk analytical signals.
    """
    try:
        tracked_records = await db.get_user_tracked_stocks(user_id)
        if not tracked_records:
            # Fallback for empty state or new users
            return []

        symbols = [r["symbol"] for r in tracked_records]
        quotes_map = await market_data_service.fetch_quotes_batch(symbols)

        enriched = []
        for r in tracked_records:
            sym = r["symbol"]
            inst = instrument_master.get_by_symbol(sym)
            quote = quotes_map.get(sym)

            # Check if there is an existing agent analysis in DB
            latest_analysis = await db.get_latest_analysis(sym)
            signal = "neutral"
            evidence_strength = "moderate"
            if latest_analysis:
                synthesis = latest_analysis.get("synthesis")
                if isinstance(synthesis, dict):
                    signal = synthesis.get("signal", "neutral")
                    evidence_strength = synthesis.get("evidence_strength", "moderate")
                elif latest_analysis.get("technical_signal"):
                    signal = latest_analysis.get("technical_signal", "neutral")

            enriched.append({
                "id": r["id"],
                "user_id": r["user_id"],
                "symbol": sym,
                "company_name": inst.company_name if inst else sym,
                "sector": inst.sector if inst else "Equities",
                "instrument_id": r.get("instrument_id"),
                "is_active": bool(r.get("is_active", 1)),
                "priority": r.get("priority", 1),
                "custom_group": r.get("custom_group", "Default"),
                "report_enabled": bool(r.get("report_enabled", 1)),
                "alert_enabled": bool(r.get("alert_enabled", 1)),
                "added_at": r.get("added_at"),
                "quote": quote.model_dump() if quote else None,
                "signal": signal,
                "evidence_strength": evidence_strength
            })

        return enriched
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tracked stocks: {e}")

@router.post("/track")
async def track_stock(req: TrackStockRequest, background_tasks: BackgroundTasks):
    """
    Adds a stock to the user's tracked universe.
    Validates instrument against Instrument Master and triggers warm-up in background.
    """
    sym_clean = req.symbol.upper().strip()
    user_id = req.user_id or DEFAULT_USER_ID

    inst = instrument_master.get_by_symbol(sym_clean)
    if not inst:
        raise HTTPException(status_code=400, detail=f"Instrument '{sym_clean}' is not recognized in the Indian equities master.")

    try:
        inst_id = getattr(inst, "instrument_id", None) or getattr(inst, "id", f"NSE_{sym_clean}")
        success = await db.track_stock(
            user_id=user_id,
            symbol=sym_clean,
            instrument_id=inst_id,
            priority=req.priority or 1,
            custom_group=req.custom_group or "Default",
            report_enabled=req.report_enabled if req.report_enabled is not None else True,
            alert_enabled=req.alert_enabled if req.alert_enabled is not None else True
        )
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save tracking record.")

        # Background task: warm up quote and historical data cache safely
        async def _warmup_instrument(s: str):
            try:
                await market_data_service.fetch_stock_quote(s)
                await market_data_service.fetch_historical(s, "3mo")
            except Exception as e:
                # Cache warmup failures should never disrupt user tracking
                pass

        background_tasks.add_task(_warmup_instrument, sym_clean)

        return {
            "status": "success",
            "symbol": sym_clean,
            "company_name": inst.company_name,
            "sector": inst.sector,
            "message": f"Successfully started tracking {inst.company_name} ({sym_clean})"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track stock: {e}")

@router.delete("/track/{symbol}")
async def untrack_stock(symbol: str, user_id: str = Query(DEFAULT_USER_ID)):
    """
    Removes a stock from the user's tracked universe.
    Does not delete global instrument, market, or cached data.
    """
    sym_clean = symbol.upper().strip()
    try:
        success = await db.untrack_stock(user_id=user_id, symbol=sym_clean)
        if not success:
            raise HTTPException(status_code=404, detail=f"Stock {sym_clean} was not tracked by user.")
        return {
            "status": "success",
            "symbol": sym_clean,
            "message": f"Successfully untracked {sym_clean}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to untrack stock: {e}")

@router.get("/reports")
async def get_user_reports(user_id: str = Query(DEFAULT_USER_ID), limit: int = Query(20, ge=1, le=100)):
    """Returns past personalized daily intelligence reports for the user."""
    try:
        return await db.get_user_daily_reports(user_id=user_id, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {e}")

@router.get("/reports/{report_date}")
async def get_user_report_by_date(report_date: str, user_id: str = Query(DEFAULT_USER_ID)):
    """Returns a specific personalized daily report by date."""
    try:
        report = await db.get_user_daily_report_by_date(user_id=user_id, report_date=report_date)
        if not report:
            raise HTTPException(status_code=404, detail=f"No report found for date {report_date}")
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch report: {e}")

@router.post("/reports/generate")
async def generate_user_report(req: GenerateReportRequest, request: Request):
    """
    Executes an on-demand personalized daily report for the user's tracked universe.
    Runs the full 4-desk multi-agent analysis on all tracked stocks.
    Rate limited to protect quotas.
    """
    user_id = req.user_id or DEFAULT_USER_ID
    rate_limiter.check_ai_limit(request=request, user_id=user_id)
    try:
        report = await orchestrator_service.generate_user_daily_report(
            user_id=user_id,
            tracked_symbols=req.symbols
        )
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate user report: {e}")
