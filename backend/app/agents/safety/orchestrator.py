"""
Trade Safety Orchestrator for MarketMind Trader Safety Intelligence.
Coordinates sequential execution of the 5-agent Trade Safety Committee:
1. Validates ticker and trade plan request.
2. Reuses existing market data caches and Technical/News/Anomaly/Synthesis Desks.
3. Runs Market Risk Analyst, Portfolio Risk Analyst, Trade Plan Analyst,
   News Evidence Analyst, Behavioural Coach, and Trade Safety Reviewer sequentially.
4. Error-isolates non-critical agents so one failure does not crash the workflow.
5. Persists review to SQLite / Supabase database.
"""

import uuid
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from app.services.market_data import market_data_service
from app.services.news import news_service
from app.agents.technical import technical_agent
from app.agents.news_intel import news_agent
from app.agents.anomaly import anomaly_agent
from app.agents.synthesis import synthesis_agent
from app.services.instrument_master import instrument_master
from app.db.client import db

from app.agents.safety.schemas import (
    TradeSafetyReviewRequest,
    TradeSafetyReviewResponse,
    CommitteeAgentsPayload,
    MarketRiskOutput,
    PortfolioRiskOutput,
    TradePlanOutput,
    NewsEvidenceOutput,
    BehaviourOutput,
    ReviewerOutput
)
from app.agents.safety.market_risk import market_risk_analyst
from app.agents.safety.portfolio_risk import portfolio_risk_analyst
from app.agents.safety.trade_plan import trade_plan_analyst
from app.agents.safety.news_evidence import news_evidence_analyst
from app.agents.safety.behaviour import behavioural_coach
from app.agents.safety.reviewer import trade_safety_reviewer

logger = logging.getLogger(__name__)


class TradeSafetyOrchestrator:
    async def review_trade_plan(
        self,
        request: TradeSafetyReviewRequest,
        user_api_key: Optional[str] = None
    ) -> TradeSafetyReviewResponse:
        workflow_id = f"wf_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now().isoformat()
        clean_ticker = request.ticker.upper().strip()

        logger.info(f"[{workflow_id}] Starting Trade Safety Committee review for {clean_ticker}...")

        # 1. Market Session Detection (IST)
        market_session = self._detect_market_session()

        # 2. Reusing existing Market Data & Desk Providers
        overview = await market_data_service.fetch_nifty50_overview(use_cache=not request.force_refresh)
        recent_news = await news_service.fetch_stock_news(clean_ticker, limit=6)

        # Context for existing 4 Desks
        context: Dict[str, Any] = {
            "trigger": "safety_review",
            "nifty": {
                "close": getattr(overview, "nifty_close", 23400.0),
                "change_percent": getattr(overview, "nifty_change_percent", 0.0)
            }
        }

        # Safe execution of data desk providers
        tech_res = None
        anom_res = None
        try:
            tech_res = await technical_agent.analyze(clean_ticker, context)
        except Exception as e:
            logger.warning(f"Technical Desk call in safety review encountered: {e}")

        try:
            anom_res = await anomaly_agent.analyze(clean_ticker, context)
        except Exception as e:
            logger.warning(f"Anomaly Desk call in safety review encountered: {e}")

        # Fetch user risk profile & recent journal history
        user_id = request.user_id or "default_user"
        recent_trades: List[Dict[str, Any]] = []
        open_positions: List[Dict[str, Any]] = []
        try:
            recent_trades = await db.get_user_trades(user_id, limit=20)
            open_positions = await db.get_user_open_positions(user_id)
        except Exception as e:
            logger.warning(f"Could not load user journal history from DB ({e}). Using empty baseline.")

        # Build sector mapping from Instrument Master
        sector_mapping = {}
        for inst in instrument_master.get_all_instruments():
            sector_mapping[inst.symbol] = inst.sector

        # 3. Agent 1: Market Risk Analyst
        logger.info(f"[{workflow_id}] Running Market Risk Analyst...")
        market_risk = await market_risk_analyst.analyze(
            ticker=clean_ticker,
            direction=request.direction,
            market_overview=overview,
            technical_data={"signal": tech_res.signal, "findings": tech_res.findings} if tech_res else None,
            anomaly_data={"findings": anom_res.findings} if anom_res else None,
            user_api_key=user_api_key
        )

        # 4. Agent 2: Portfolio Risk Analyst
        logger.info(f"[{workflow_id}] Running Portfolio Risk Analyst...")
        portfolio_risk = await portfolio_risk_analyst.analyze(
            ticker=clean_ticker,
            entry_price=request.entry_price,
            stop_loss=request.stop_loss,
            target=request.target,
            quantity=request.quantity,
            capital=request.capital or 100000.0,
            risk_percent=request.risk_percent or 1.0,
            open_positions=open_positions,
            sector_mapping=sector_mapping,
            user_api_key=user_api_key
        )

        # 5. Agent 3: Trade Plan Analyst
        logger.info(f"[{workflow_id}] Running Trade Plan Analyst...")
        trade_plan = await trade_plan_analyst.analyze(
            ticker=clean_ticker,
            direction=request.direction,
            entry_price=request.entry_price,
            stop_loss=request.stop_loss,
            target=request.target,
            quantity=request.quantity,
            strategy=request.strategy,
            setup=request.setup,
            notes=request.notes,
            user_api_key=user_api_key
        )

        # 6. Agent 4: News Evidence Analyst
        logger.info(f"[{workflow_id}] Running News Evidence Analyst...")
        news_evidence = await news_evidence_analyst.analyze(
            ticker=clean_ticker,
            direction=request.direction,
            news_articles=recent_news,
            user_api_key=user_api_key
        )

        # 7. Agent 5: Behavioural Coach
        logger.info(f"[{workflow_id}] Running Behavioural Coach...")
        behaviour = await behavioural_coach.analyze(
            ticker=clean_ticker,
            direction=request.direction,
            requested_quantity=request.quantity,
            entry_price=request.entry_price,
            stop_loss=request.stop_loss,
            recent_trades=recent_trades,
            open_positions=open_positions,
            user_api_key=user_api_key
        )

        # 8. Agent 6: Trade Safety Reviewer (Final Coordinator)
        logger.info(f"[{workflow_id}] Running Trade Safety Reviewer coordinator...")
        reviewer = await trade_safety_reviewer.review(
            ticker=clean_ticker,
            direction=request.direction,
            market_risk=market_risk,
            portfolio_risk=portfolio_risk,
            trade_plan=trade_plan,
            news_evidence=news_evidence,
            behaviour=behaviour,
            user_api_key=user_api_key
        )

        agents_payload = CommitteeAgentsPayload(
            market_risk=market_risk,
            portfolio_risk=portfolio_risk,
            trade_plan=trade_plan,
            news_evidence=news_evidence,
            behaviour=behaviour,
            reviewer=reviewer
        )

        response = TradeSafetyReviewResponse(
            workflow_id=workflow_id,
            generated_at=now_iso,
            market_session=market_session,
            ticker=clean_ticker,
            safety_recommendation=reviewer.safety_recommendation,
            overall_confidence=reviewer.confidence,
            agents=agents_payload,
            deterministic_calculations=portfolio_risk.calculations.model_dump()
        )

        # 9. Persist Trade Plan and Safety Review to Database safely
        try:
            plan_status = "APPROVED" if reviewer.safety_recommendation == "SAFE_TO_REVIEW" else "ACTIVE"
            await db.save_user_trade_plan({
                "id": f"tp_{clean_ticker}_{workflow_id}",
                "user_id": user_id,
                "ticker": clean_ticker,
                "direction": request.direction,
                "entry_price": request.entry_price,
                "stop_loss": request.stop_loss or round(request.entry_price * 0.97, 2),
                "target": request.target or round(request.entry_price * 1.05, 2),
                "quantity": request.quantity,
                "instrument_type": "EQUITY",
                "strategy": request.strategy or "Committee Plan",
                "setup": request.setup or "5-Agent Committee Review",
                "invalidating_condition": f"Review recommendation: {reviewer.safety_recommendation}",
                "user_notes": request.notes or "",
                "status": plan_status
            })

            await db.save_safety_review({
                "workflow_id": workflow_id,
                "user_id": user_id,
                "ticker": clean_ticker,
                "trade_plan_id": f"tp_{clean_ticker}_{workflow_id}",
                "market_session": market_session,
                "safety_recommendation": reviewer.safety_recommendation,
                "overall_confidence": reviewer.confidence,
                "agent_outputs": agents_payload.model_dump(),
                "deterministic_calcs": portfolio_risk.calculations.model_dump(),
                "created_at": now_iso
            })
        except Exception as e:
            logger.warning(f"Could not persist trade plan / safety review to database: {e}")

        logger.info(f"[{workflow_id}] Completed Trade Safety Committee review: {reviewer.safety_recommendation}")
        return response

    def _detect_market_session(self) -> str:
        """Determines active Indian market session based on IST clock."""
        now_utc = datetime.utcnow()
        # IST is UTC + 5:30
        ist_now = now_utc + timedelta(hours=5, minutes=30)
        hour = ist_now.hour
        minute = ist_now.minute

        # Weekends
        if ist_now.weekday() >= 5:
            return "Weekend / Closed"

        # Trading phases
        current_minute = hour * 60 + minute
        if current_minute < 9 * 60:
            return "Pre-Market / Overnight"
        elif 9 * 60 <= current_minute < 9 * 60 + 15:
            return "Pre-Open Session"
        elif 9 * 60 + 15 <= current_minute < 15 * 60 + 30:
            return "Regular Trading Session"
        elif 15 * 60 + 30 <= current_minute < 16 * 60:
            return "Post-Market Closing Session"
        else:
            return "Market Closed"


trade_safety_orchestrator = TradeSafetyOrchestrator()
