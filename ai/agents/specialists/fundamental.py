"""
Fundamental Agent — macroeconomic analysis.

Per the user's architecture: this agent's library covers macroeconomics,
central banks, interest rates, CPI, GDP, employment, monetary and fiscal
policy. It only ever retrieves from the 'fundamental' knowledge domain -
it does not need to know what a Fair Value Gap is.

Replaces news_fundamental_v2 from the previous generation. Honest
limitation: there is currently no live news-article text feed wired
into this pipeline, only the structured economic calendar - so this
agent reasons from scheduled macro events and their expected/actual
values, not from news headlines or article sentiment (that is now the
Sentiment agent's job, and it has the same honest limitation stated in
its own prompt).
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent
from knowledge.rag_engine import retrieve_for_prompt


class FundamentalAgent(SpecialistAgent):

    @property
    def name(self) -> str:
        return "fundamental"

    @property
    def display_name(self) -> str:
        return "Fundamental"

    @property
    def domain_description(self) -> str:
        return (
            "Macroeconomic drivers: interest rate expectations, CPI/"
            "inflation, GDP, employment data, and central bank policy "
            "stance. You reason about how scheduled economic events and "
            "their surprise (actual vs. expected) affect currency strength."
        )

    @property
    def level_type_example(self) -> str:
        return "event_reaction_level"

    @property
    def confidence_formula(self) -> str:
        return (
            "scale confidence with how much high-impact economic data is "
            "actually available in this window and how large the surprise "
            "(actual vs. forecast) is; if no meaningful economic events are "
            "in the provided calendar, confidence must be low and "
            "data_sufficient should reflect that there is little to reason "
            "from, not that the currency is fundamentally neutral."
        )

    @property
    def extra_instructions(self) -> str:
        return (
            "8. You only have the structured economic calendar provided - "
            "you do NOT have live news article text. Never invent a news "
            "headline, central bank quote, or event you were not given.\n"
            "9. Weigh surprise (actual vs. forecast), not just whether an "
            "event happened - an in-line print carries far less signal than "
            "a large beat or miss.\n"
            "10. If the calendar has no meaningful upcoming or recent "
            "high-impact events for this currency pair, say so plainly and "
            "set data_sufficient=false rather than fabricating a view."
        )

    @property
    def min_candles(self) -> int:
        # Fundamental reasoning depends on the economic calendar, not deep
        # price history - a handful of recent candles for current price
        # context is enough, unlike Technical which needs real structure.
        return 5

    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        context = context or {}
        candle_text = self.format_candles(candles, max_candles=10)
        calendar = context.get("economic_calendar", [])
        calendar_text = (
            "\n".join(f"  - {e}" for e in calendar) if calendar else "  (no economic calendar events provided)"
        )
        knowledge = retrieve_for_prompt(
            "fundamental",
            "interest rates CPI inflation employment GDP central bank policy",
        )
        parts = [
            f"Symbol: {symbol}",
            f"Timeframe: {timeframe}",
            f"Recent price context ({len(candles)} candles):",
            candle_text,
            "Economic calendar:",
            calendar_text,
        ]
        if knowledge:
            parts.append(knowledge)
        parts.append(
            "Analyze the macroeconomic picture for this pair based only on "
            "the calendar data given. Return your JSON output."
        )
        return "\n\n".join(parts)
