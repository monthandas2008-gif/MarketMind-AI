"""
Behavioural Coach Agent for the Trade Safety Committee.
Identifies detrimental retail trading patterns (revenge trading, loss streaks,
position over-sizing, averaging down) using pure deterministic detection rules.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime

from app.agents.safety.base import BaseSafetyAgent
from app.agents.safety.schemas import BehaviourOutput, DetectedBehaviourPattern
from app.agents.safety.prompts import BEHAVIOURAL_COACH_SYSTEM_PROMPT
from app.services.safety_calculations import (
    detect_consecutive_losses,
    detect_revenge_trading,
    detect_position_size_anomaly,
    detect_averaging_down,
    detect_missing_stop_loss,
    detect_daily_loss_limit_breach,
    detect_daily_trade_count_limit_breach
)


class BehaviouralCoach(BaseSafetyAgent):
    def __init__(self):
        super().__init__(
            agent_name="Behavioural Coach",
            agent_type="behaviour",
            schema_class=BehaviourOutput,
            system_prompt=BEHAVIOURAL_COACH_SYSTEM_PROMPT
        )

    async def analyze(
        self,
        ticker: str,
        direction: str,
        requested_quantity: int,
        entry_price: float,
        stop_loss: Optional[float],
        recent_trades: Optional[List[Dict[str, Any]]] = None,
        open_positions: Optional[List[Dict[str, Any]]] = None,
        daily_loss_limit: float = 5000.0,
        realized_loss_today: float = 0.0,
        trades_today_count: int = 0,
        user_api_key: Optional[str] = None
    ) -> BehaviourOutput:
        trades = recent_trades or []
        positions = open_positions or []

        detected_patterns: List[DetectedBehaviourPattern] = []
        risk_flags: List[str] = []

        # 1. Consecutive losses check
        streak = detect_consecutive_losses(trades, threshold=3)
        if streak["triggered"]:
            detected_patterns.append(
                DetectedBehaviourPattern(
                    pattern=f"{streak['streak_count']} Consecutive Losses",
                    severity="HIGH",
                    evidence=[f"Lost ₹{streak['total_lost_in_streak']:,.2f} over the last {streak['streak_count']} trades."],
                    recommendation="Take a mandatory 1-hour screen break to reset emotional equilibrium before placing new capital at risk."
                )
            )
            risk_flags.append(f"Consecutive loss streak ({streak['streak_count']} trades)")

        # 2. Revenge trading check
        revenge = detect_revenge_trading(trades, cooldown_minutes=30)
        if revenge["triggered"]:
            detected_patterns.append(
                DetectedBehaviourPattern(
                    pattern="Revenge Trading Window",
                    severity="HIGH",
                    evidence=[f"Entered {revenge.get('minutes_since_loss')} minutes after taking a loss of ₹{revenge.get('last_loss_amount', 0):,.2f}."],
                    recommendation="Entering new positions immediately following a loss drastically increases emotional tilt. Step back to trade your plan, not your P&L."
                )
            )
            risk_flags.append("Trade within 30m of loss (Revenge trading hazard)")

        # 3. Position size anomaly check
        size_anomaly = detect_position_size_anomaly(requested_quantity, entry_price, trades, multiplier_threshold=2.0)
        if size_anomaly["triggered"]:
            detected_patterns.append(
                DetectedBehaviourPattern(
                    pattern="Position Size Outlier (>2x Average)",
                    severity="MEDIUM",
                    evidence=[f"Trade size is {size_anomaly.get('ratio')}x larger than your recent 20-trade average size."],
                    recommendation="Sudden jumps in trade sizing often reflect impatience or a desire to recover past losses. Standardize sizing."
                )
            )
            risk_flags.append("Position size spike (>2x average)")

        # 4. Averaging down check
        avg_down = detect_averaging_down(ticker, direction, positions)
        if avg_down["triggered"]:
            detected_patterns.append(
                DetectedBehaviourPattern(
                    pattern="Averaging Down on Losing Position",
                    severity="HIGH",
                    evidence=[f"Already holding an underwater {ticker} position."],
                    recommendation="Adding to a losing position magnifies tail-risk. Respect initial invalidation levels instead of adding exposure."
                )
            )
            risk_flags.append(f"Averaging down on underwater {ticker} position")

        # 5. Missing stop loss check
        missing_sl = detect_missing_stop_loss(stop_loss)
        if missing_sl["triggered"]:
            detected_patterns.append(
                DetectedBehaviourPattern(
                    pattern="Missing Stop-Loss Discipline",
                    severity="HIGH",
                    evidence=["Plan has no defined stop-loss price."],
                    recommendation="Never enter a trade without an explicit mathematical invalidation level."
                )
            )
            risk_flags.append("Undefined Stop-Loss")

        # 6. Daily loss limit check
        daily_loss = detect_daily_loss_limit_breach(realized_loss_today, daily_loss_limit)
        if daily_loss["triggered"]:
            detected_patterns.append(
                DetectedBehaviourPattern(
                    pattern="Daily Circuit Breaker Triggered",
                    severity="HIGH",
                    evidence=[f"Realized loss of ₹{realized_loss_today:,.2f} reached daily limit of ₹{daily_loss_limit:,.2f}."],
                    recommendation="Cease all trading for the remainder of today's session. Protect trading capital."
                )
            )
            risk_flags.append("Daily loss limit reached")

        # 7. Overtrading check
        overtrade = detect_daily_trade_count_limit_breach(trades_today_count, max_daily_trades=5)
        if overtrade["triggered"]:
            detected_patterns.append(
                DetectedBehaviourPattern(
                    pattern="Elevated Trade Frequency (Overtrading)",
                    severity="MEDIUM",
                    evidence=[f"Already taken {trades_today_count} trades today."],
                    recommendation="High execution frequency degrades focus and accumulates transaction friction."
                )
            )
            risk_flags.append(f"Overtrading ({trades_today_count} trades today)")

        # Status classification
        has_high_severity = any(p.severity == "HIGH" for p in detected_patterns)
        if has_high_severity:
            behaviour_status = "PAUSE_RECOMMENDED"
        elif detected_patterns:
            behaviour_status = "ATTENTION_NEEDED"
        else:
            behaviour_status = "HEALTHY"

        fallback_dict = {
            "behaviour_status": behaviour_status,
            "confidence": 85,
            "reasoning": [
                "Evaluated recent journal trades against 7 core behavioral discipline rules.",
                f"Identified {len(detected_patterns)} potential behavioral flag(s)." if detected_patterns else "Discipline metrics healthy with steady sizing and adherence to plan.",
                "Emotional stability and adherence to invalidation rules remain key to long-term profitability."
            ],
            "detected_patterns": [p.model_dump() for p in detected_patterns],
            "risk_flags": risk_flags
        }

        user_prompt = f"""EVALUATE BEHAVIOURAL DISCIPLINE FOR TRADER:
- Proposed Trade: {direction.upper()} {requested_quantity} shares of {ticker} @ ₹{entry_price:.2f}
- Stop Loss: {stop_loss if stop_loss else 'NONE'}
- Detected Rule Violations ({len(detected_patterns)} items):
{chr(10).join([f"- [{p.severity}] {p.pattern}: {p.evidence[0] if p.evidence else ''}" for p in detected_patterns]) if detected_patterns else 'None. All behavioural rules clean.'}

Provide supportive, constructive coaching explaining these behavioral flags and whether pausing is indicated."""

        return await self.run(
            context_prompt=user_prompt,
            user_api_key=user_api_key,
            deterministic_fallback=fallback_dict
        )


behavioural_coach = BehaviouralCoach()
