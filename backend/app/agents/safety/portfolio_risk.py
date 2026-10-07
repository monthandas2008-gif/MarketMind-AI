"""
Portfolio Risk Analyst Agent for the Trade Safety Committee.
Evaluates trade sizing, capital-at-risk, sector concentration, single-stock concentration,
and remaining daily risk budget based strictly on pure Python deterministic calculations.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime

from app.agents.safety.base import BaseSafetyAgent
from app.agents.safety.schemas import PortfolioRiskOutput, DeterministicSafetyCalculations
from app.agents.safety.prompts import PORTFOLIO_RISK_SYSTEM_PROMPT
from app.services.safety_calculations import (
    calculate_max_safe_quantity,
    calculate_requested_risk_amount,
    calculate_worst_case_loss,
    calculate_estimated_charges,
    calculate_estimated_slippage,
    calculate_remaining_daily_risk_budget,
    calculate_sector_exposure,
    calculate_single_stock_concentration
)


class PortfolioRiskAnalyst(BaseSafetyAgent):
    def __init__(self):
        super().__init__(
            agent_name="Portfolio Risk Analyst",
            agent_type="portfolio_risk",
            schema_class=PortfolioRiskOutput,
            system_prompt=PORTFOLIO_RISK_SYSTEM_PROMPT
        )

    async def analyze(
        self,
        ticker: str,
        entry_price: float,
        stop_loss: Optional[float],
        target: Optional[float],
        quantity: int,
        capital: float = 100000.0,
        risk_percent: float = 1.0,
        daily_loss_limit: float = 5000.0,
        realized_loss_today: float = 0.0,
        open_positions: Optional[List[Dict[str, Any]]] = None,
        sector_mapping: Optional[Dict[str, str]] = None,
        user_api_key: Optional[str] = None
    ) -> PortfolioRiskOutput:
        effective_sl = stop_loss if (stop_loss and stop_loss > 0) else (entry_price * 0.98)
        open_pos = open_positions or []
        sec_map = sector_mapping or {}

        # 1. Deterministic pure Python financial math
        rec_qty = calculate_max_safe_quantity(
            capital=capital,
            risk_percent=risk_percent,
            entry_price=entry_price,
            stop_loss=effective_sl
        )
        req_risk = calculate_requested_risk_amount(entry_price, effective_sl, quantity)
        rec_risk = calculate_requested_risk_amount(entry_price, effective_sl, rec_qty)
        charges_dict = calculate_estimated_charges(entry_price, effective_sl, quantity)
        est_charges = charges_dict["total_charges"]
        est_slippage = calculate_estimated_slippage(entry_price, quantity)
        worst_loss = calculate_worst_case_loss(entry_price, effective_sl, quantity)
        remaining_budget = calculate_remaining_daily_risk_budget(daily_loss_limit, realized_loss_today, req_risk)

        proposed_val = entry_price * quantity
        sector_res = calculate_sector_exposure(open_pos, ticker, proposed_val, sec_map, capital)
        stock_res = calculate_single_stock_concentration(open_pos, ticker, proposed_val, capital)

        # Risk-reward calculation
        rr_ratio = 0.0
        if stop_loss and target and abs(entry_price - stop_loss) > 0:
            rr_ratio = round(abs(target - entry_price) / abs(entry_price - stop_loss), 2)

        calcs = DeterministicSafetyCalculations(
            capital=capital,
            requested_quantity=quantity,
            recommended_quantity=rec_qty,
            entry_price=entry_price,
            stop_loss=stop_loss or 0.0,
            target=target or 0.0,
            requested_risk_amount=req_risk,
            recommended_risk_amount=rec_risk,
            estimated_charges=est_charges,
            estimated_slippage=est_slippage,
            estimated_worst_case_loss=worst_loss,
            remaining_daily_risk_budget=remaining_budget,
            proposed_sector_exposure_percent=sector_res.get("sector_exposure_pct", 0.0),
            proposed_single_stock_concentration_percent=stock_res.get("concentration_pct", 0.0),
            risk_reward_ratio=rr_ratio
        )

        breaches = []
        risk_flags = []

        if quantity > rec_qty and rec_qty > 0:
            breaches.append(f"Requested quantity ({quantity}) exceeds recommended safe quantity ({rec_qty}).")
            risk_flags.append(f"Position over-sized: Risking ₹{req_risk:,.2f} vs ₹{rec_risk:,.2f} budget.")

        if sector_res.get("is_breach"):
            breaches.append(f"Sector concentration in {sector_res.get('sector')} exceeds 30% limit ({sector_res.get('sector_exposure_pct')}%)")
            risk_flags.append("Sector concentration threshold breached")

        if stock_res.get("is_breach"):
            breaches.append(f"Single stock concentration in {ticker} exceeds 20% limit ({stock_res.get('concentration_pct')}%)")
            risk_flags.append("Single-stock concentration threshold breached")

        if req_risk > remaining_budget:
            breaches.append(f"Trade risk (₹{req_risk:,.2f}) exceeds remaining daily risk budget (₹{remaining_budget:,.2f})")
            risk_flags.append("Daily risk budget depleted")

        # Deterministic status classification
        if req_risk > remaining_budget or (rec_qty > 0 and quantity > rec_qty * 1.5):
            risk_status = "LIMIT_REACHED"
        elif breaches or risk_flags:
            risk_status = "CAUTION"
        else:
            risk_status = "SAFE"

        fallback_dict = {
            "risk_status": risk_status,
            "confidence": 85,
            "reasoning": [
                f"Capital: ₹{capital:,.2f} with risk allocation: {risk_percent}%.",
                f"Requested position value: ₹{proposed_val:,.2f} ({quantity} shares @ ₹{entry_price:,.2f}).",
                f"Maximum safe quantity for defined risk budget is {rec_qty} shares (Requested: {quantity}).",
                f"Estimated worst-case loss including execution slippage & STT/GST charges: ₹{worst_loss:,.2f}."
            ],
            "calculations": calcs.model_dump(),
            "breaches": breaches,
            "risk_flags": risk_flags
        }

        user_prompt = f"""EVALUATE PORTFOLIO RISK FOR PROPOSED TRADE:
- Ticker: {ticker}
- Account Capital: ₹{capital:,.2f}
- Max Risk Per Trade: {risk_percent}% (₹{capital * (risk_percent/100):,.2f})
- Requested Quantity: {quantity} (Recommended Safe Max: {rec_qty})
- Requested Risk Amount: ₹{req_risk:,.2f} (Recommended Risk: ₹{rec_risk:,.2f})
- Estimated Statutory Charges & Slippage: ₹{est_charges + est_slippage:,.2f}
- Estimated Worst-Case Loss: ₹{worst_loss:,.2f}
- Remaining Daily Risk Budget: ₹{remaining_budget:,.2f}
- Proposed Sector Exposure: {sector_res.get('sector_exposure_pct')}% in {sector_res.get('sector')}
- Proposed Single-Stock Concentration: {stock_res.get('concentration_pct')}%
- Breaches Detected: {breaches if breaches else 'None'}

Provide an objective assessment explaining whether this sizing respects sound portfolio risk parameters."""

        return await self.run(
            context_prompt=user_prompt,
            user_api_key=user_api_key,
            deterministic_fallback=fallback_dict
        )


portfolio_risk_analyst = PortfolioRiskAnalyst()
