"""
Risk Manager Agent — qualitative risk framing for the current setup.

Per the user's architecture: this agent's library covers position
sizing principles, risk/reward, Kelly Criterion, drawdown management,
and portfolio risk concepts. It only ever retrieves from the 'risk'
knowledge domain.

Important distinction from decision_engine/risk_engine.py: that module
is the mandatory, deterministic, code-computed Risk Management Gate
(Rule 10 - no recommendation may bypass it, and it can force a "wait"
regardless of what any agent or the LLM narrative wants to say). THIS
agent is one specialist voice among several feeding the Executive
Decision Engine - it reasons qualitatively about risk conditions for
this specific setup (volatility, how far price sits from a sensible
invalidation point, whether conditions look unusually risky), it does
not compute the final risk-adjusted confidence and it has no veto power
on its own. Both existing side by side is intentional, matching the
user's pipeline: Risk Manager (specialist) -> ... -> Executive Decision
Engine, which itself defers to the separate deterministic gate.

Per specialist_base.py's shared STRICT RULES (rule 6): this agent must
never produce actual position sizing or trade execution instructions -
it discusses risk conditions, not "risk $200 on this trade."
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent
from knowledge.rag_engine import retrieve_for_prompt


class RiskManagerAgent(SpecialistAgent):

    @property
    def name(self) -> str:
        return "risk_manager"

    @property
    def display_name(self) -> str:
        return "Risk Manager"

    @property
    def domain_description(self) -> str:
        return (
            "Risk conditions for this setup: realized volatility relative to "
            "recent history, distance from current price to a sensible "
            "invalidation level, and whether conditions look unusually risky "
            "(e.g. a compressed range about to expand, or already-elevated "
            "volatility). You assess risk conditions, you do not size "
            "positions or issue trade instructions."
        )

    @property
    def level_type_example(self) -> str:
        return "invalidation_reference_level"

    @property
    def confidence_formula(self) -> str:
        return (
            "scale confidence with how clearly measurable the risk "
            "condition is from the candle data itself (e.g. a clean, "
            "measurable recent range for volatility comparison) rather than "
            "a subjective feel for 'riskiness'."
        )

    @property
    def extra_instructions(self) -> str:
        return (
            "8. NEVER state a specific position size, dollar risk amount, "
            "or lot size - that is explicitly out of scope for this "
            "platform. Discuss risk/reward framing and volatility "
            "conditions only.\n"
            "9. Identify the nearest sensible invalidation reference point "
            "(a structural level where the current read would be wrong) and "
            "note the distance from current price to it in the same units "
            "as the candle data, so risk/reward can be reasoned about "
            "qualitatively.\n"
            "10. If recent volatility is compressed relative to the visible "
            "history, flag that expansion risk explicitly - a quiet range "
            "is not automatically low risk."
        )

    @property
    def min_candles(self) -> int:
        return 20

    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        context = context or {}
        candle_text = self.format_candles(candles)
        knowledge = retrieve_for_prompt(
            "risk",
            "position sizing risk reward drawdown volatility invalidation",
        )
        parts = [
            f"Symbol: {symbol}",
            f"Timeframe: {timeframe}",
            f"Candles ({len(candles)} total, most recent last):",
            candle_text,
        ]
        if knowledge:
            parts.append(knowledge)
        parts.append(
            "Assess risk conditions for this setup: volatility relative to "
            "recent history, and the nearest sensible invalidation "
            "reference level. Do not size a position or state a dollar "
            "risk amount. Return your JSON output."
        )
        return "\n\n".join(parts)
