"""
Analysis API routes for single-stock multi-agent intelligence.
"""

from fastapi import APIRouter, HTTPException, Request

from app.models.analysis import StockAnalysis
from app.agents.orchestrator import orchestrator_service
from app.middleware.rate_limiter import rate_limiter
from app.db.queries import get_latest_stock_analysis

router = APIRouter(prefix="/api/analysis", tags=["Stock Analysis"])

@router.get("/{symbol}")
async def get_analysis(symbol: str):
    """
    Returns the latest stored AI analysis for a stock.
    If none exists in the database, automatically triggers an on-demand analysis.
    """
    sym_clean = symbol.upper().strip()
    try:
        latest = await get_latest_stock_analysis(sym_clean)
        if latest:
            return latest

        # No saved analysis yet; trigger on-demand run
        analysis = await orchestrator_service.analyze_stock(sym_clean, trigger="auto_on_demand")
        return analysis.model_dump(mode="json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analysis for {sym_clean}: {e}")

@router.post("/run/{symbol}")
async def run_fresh_analysis(symbol: str, request: Request):
    """
    Forces an immediate live run of the 4-agent analysis pipeline for a symbol.
    Rate limited to protect quotas.
    """
    sym_clean = symbol.upper().strip()
    rate_limiter.check_ai_limit(request=request)
    try:
        analysis = await orchestrator_service.analyze_stock(sym_clean, trigger="manual_refresh")
        return analysis.model_dump(mode="json")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run analysis for {sym_clean}: {e}")
