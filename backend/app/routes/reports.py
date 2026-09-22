"""
Reports API routes for daily Indian market intelligence summaries.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Request

from app.models.report import DailyReport, ReportSummary
from app.agents.orchestrator import orchestrator_service
from app.middleware.rate_limiter import rate_limiter
from app.db.queries import get_latest_daily_report, get_daily_report_by_date, get_daily_reports_list
from app.db.client import db

router = APIRouter(prefix="/api/reports", tags=["Daily Reports"])

@router.get("/latest")
async def get_latest_report():
    """Returns the most recent daily intelligence report."""
    try:
        report = await get_latest_daily_report()
        if not report:
            # Generate one if none exists
            new_report = await orchestrator_service.generate_daily_report()
            return new_report.model_dump()
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch latest report: {e}")

@router.get("/list")
async def list_reports():
    """Returns a list of all historical daily market intelligence reports."""
    try:
        return await get_daily_reports_list(limit=30)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports list: {e}")

@router.get("/{report_date}")
async def get_report_by_date(report_date: str):
    """Fetches the report for a specific date (YYYY-MM-DD)."""
    try:
        report = await get_daily_report_by_date(report_date)
        if report:
            return report
        raise HTTPException(status_code=404, detail=f"No report found for date {report_date}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch report for {report_date}: {e}")

@router.post("/generate")
async def trigger_generate_report(request: Request):
    """Manually triggers generation of today's market intelligence report."""
    rate_limiter.check_ai_limit(request=request)
    try:
        report = await orchestrator_service.generate_daily_report()
        return report.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {e}")
