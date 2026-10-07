"""
Trade Plan Analyst Agent for the Trade Safety Committee.
Evaluates completeness, logical order of stop-loss and targets, invalidation conditions,
and setup discipline without giving directional predictions.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime

from app.agents.safety.base import BaseSafetyAgent
from app.agents.safety.schemas import TradePlanOutput
from app.agents.safety.prompts import TRADE_PLAN_SYSTEM_PROMPT


class TradePlanAnalyst(BaseSafetyAgent):
    def __init__(self):
        super().__init__(
            agent_name="Trade Plan Analyst",
            agent_type="trade_plan",
            schema_class=TradePlanOutput,
            system_prompt=TRADE_PLAN_SYSTEM_PROMPT
        )

    async def analyze(
        self,
        ticker: str,
        direction: str,
        entry_price: float,
        stop_loss: Optional[float],
        target: Optional[float],
        quantity: int,
        strategy: str,
        setup: str,
        notes: Optional[str] = "",
        user_api_key: Optional[str] = None
    ) -> TradePlanOutput:
        missing_fields: List[str] = []
        logical_issues: List[str] = []
        risk_flags: List[str] = []

        if not stop_loss or stop_loss <= 0:
            missing_fields.append("stop_loss")
            logical_issues.append("Trade lacks a defined stop-loss price. Unhedged downside risk.")
            risk_flags.append("Missing Stop-Loss")

        if not target or target <= 0:
            missing_fields.append("target")
            risk_flags.append("Missing defined profit target")

        if quantity <= 0:
            missing_fields.append("quantity")

        # Directional and logical consistency checks
        dir_clean = direction.upper().strip()
        if stop_loss and stop_loss > 0:
            if dir_clean == "LONG" and stop_loss >= entry_price:
                logical_issues.append(f"Invalid stop-loss for LONG trade: Stop-loss (₹{stop_loss}) must be below Entry price (₹{entry_price}).")
                risk_flags.append("Stop-loss inverted for LONG position")
            elif dir_clean == "SHORT" and stop_loss <= entry_price:
                logical_issues.append(f"Invalid stop-loss for SHORT trade: Stop-loss (₹{stop_loss}) must be above Entry price (₹{entry_price}).")
                risk_flags.append("Stop-loss inverted for SHORT position")

        if target and target > 0:
            if dir_clean == "LONG" and target <= entry_price:
                logical_issues.append(f"Invalid profit target for LONG trade: Target (₹{target}) must be above Entry price (₹{entry_price}).")
                risk_flags.append("Profit target inverted for LONG position")
            elif dir_clean == "SHORT" and target >= entry_price:
                logical_issues.append(f"Invalid profit target for SHORT trade: Target (₹{target}) must be below Entry price (₹{entry_price}).")
                risk_flags.append("Profit target inverted for SHORT position")

        # Risk-reward ratio check
        rr_ratio = 0.0
        if stop_loss and target and abs(entry_price - stop_loss) > 0:
            reward = abs(target - entry_price)
            risk = abs(entry_price - stop_loss)
            rr_ratio = round(reward / risk, 2)
            if rr_ratio < 1.0:
                logical_issues.append(f"Unfavorable Risk-Reward Ratio ({rr_ratio}:1). Risk exceeds prospective reward.")
                risk_flags.append("Sub-optimal Risk-Reward Ratio (<1:1)")

        # Quality scoring
        if "stop_loss" in missing_fields or any("inverted" in rf for rf in risk_flags):
            plan_quality = "INCOMPLETE"
        elif logical_issues or rr_ratio < 1.0:
            plan_quality = "WEAK"
        elif rr_ratio >= 1.5:
            plan_quality = "STRONG"
        else:
            plan_quality = "ADEQUATE"

        invalidating_conditions = [
            f"Price breaks and closes beyond stop-loss level ₹{stop_loss:.2f}" if stop_loss else "Price breaches entry invalidation point",
            "High-volume counter-trend momentum violates setup assumptions",
            "Broad benchmark reversal causes divergence from strategy thesis"
        ]

        fallback_dict = {
            "plan_quality": plan_quality,
            "confidence": 80,
            "reasoning": [
                f"Trade Direction: {dir_clean} on {ticker} at Entry ₹{entry_price:.2f}.",
                f"Stop-Loss: ₹{stop_loss or 0.0:.2f} | Profit Target: ₹{target or 0.0:.2f} (R:R {rr_ratio}:1)." if stop_loss and target else "Trade plan missing essential risk parameters.",
                f"Setup thesis: '{setup}' under '{strategy}' strategy."
            ],
            "missing_fields": missing_fields,
            "logical_issues": logical_issues,
            "invalidating_conditions": invalidating_conditions,
            "risk_flags": risk_flags
        }

        user_prompt = f"""EVALUATE TRADE PLAN COMPLETENESS & LOGICAL INTEGRITY:
- Ticker: {ticker}
- Direction: {dir_clean}
- Entry Price: ₹{entry_price:.2f}
- Stop-Loss: ₹{stop_loss if stop_loss else 'NOT DEFINED'}
- Profit Target: ₹{target if target else 'NOT DEFINED'}
- Quantity: {quantity}
- Risk:Reward Ratio: {rr_ratio}:1
- Strategy: {strategy}
- Setup: {setup}
- Notes: {notes or 'None'}
- Logical Flaws Detected: {logical_issues if logical_issues else 'None'}
- Missing Fields: {missing_fields if missing_fields else 'None'}

Evaluate whether this plan is structurally sound and based on disciplined invalidating rules."""

        return await self.run(
            context_prompt=user_prompt,
            user_api_key=user_api_key,
            deterministic_fallback=fallback_dict
        )


trade_plan_analyst = TradePlanAnalyst()
