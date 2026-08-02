"""
Quant Agent — statistical and probabilistic read of the price data.

Per the user's architecture: this agent's library covers statistics,
probability, correlation, regression, and backtesting concepts. It only
ever retrieves from the 'quant' knowledge domain.

Where the Technical agent reads chart structure and the Sentiment agent
reads regime/mood, this agent reasons about the data more formally:
realized volatility, how the current move compares statistically to
the visible history, and how much confidence a sample of this size can
actually support - explicitly guarding against the overfitting and
small-sample-size traps described in its knowledge base.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent
from knowledge.rag_engine import retrieve_for_prompt


class QuantAgent(SpecialistAgent):

    @property
    def name(self) -> str:
        return "quant"

    @property
    def display_name(self) -> str:
        return "Quant"

    @property
    def domain_description(self) -> str:
        return (
            "Statistical read of the price data: realized volatility versus "
            "recent history, how unusual the current move is relative to "
            "the visible range, and how much a sample of this size can "
            "actually support statistically. You are the agent most likely "
            "to say 'the data doesn't support a strong view here.'"
        )

    @property
    def level_type_example(self) -> str:
        return "statistical_range_level"

    @property
    def confidence_formula(self) -> str:
        return (
            "confidence must scale DOWN, not up, when the candle sample "
            "size is small or the recent range is unusually erratic - this "
            "agent's job is to be the honest check on sample size, not to "
            "match the enthusiasm of the other agents."
        )

    @property
    def extra_instructions(self) -> str:
        return (
            "8. Explicitly consider sample size: with fewer candles, say so "
            "and lower confidence accordingly rather than reasoning as "
            "confidently as you would with a large sample.\n"
            "9. Compare the current move's size to the recent range - is "
            "this move statistically unusual (several times the recent "
            "average range) or unremarkable? State this explicitly.\n"
            "10. Watch for overfitting your own reasoning to a small number "
            "of recent candles that may just be noise - if the pattern only "
            "shows up in the last handful of candles with no earlier "
            "precedent visible in the data, say that plainly rather than "
            "presenting it as a robust statistical finding."
        )

    @property
    def min_candles(self) -> int:
        return 25

    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        context = context or {}
        candle_text = self.format_candles(candles)
        knowledge = retrieve_for_prompt(
            "quant",
            "statistical significance sample size overfitting correlation volatility",
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
            "Give a statistical read: realized volatility vs. recent "
            "history, how unusual the current move is, and whether this "
            "sample size actually supports a confident view. Return your "
            "JSON output."
        )
        return "\n\n".join(parts)
