"""
Sentiment Agent — market mood, risk-on/risk-off regime, and positioning.

Per the user's architecture: this agent's library covers news sentiment
patterns, social sentiment, positioning, and risk-on/risk-off dynamics.
It only ever retrieves from the 'sentiment' knowledge domain.

Honest limitation, stated directly in its own prompt: there is no live
news-article or social-feed text wired into this pipeline yet. This
agent reasons from session context, the pair's typical risk-on/risk-off
classification (e.g. AUD/NZD as risk-on, JPY/CHF as safe-haven), and how
price is actually behaving - not from headlines it was never given.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent
from knowledge.rag_engine import retrieve_for_prompt


class SentimentAgent(SpecialistAgent):

    @property
    def name(self) -> str:
        return "sentiment"

    @property
    def display_name(self) -> str:
        return "Sentiment"

    @property
    def domain_description(self) -> str:
        return (
            "Market mood and positioning: risk-on/risk-off regime, whether "
            "this pair's currencies behave as safe-haven or risk-sensitive, "
            "and whether price action confirms or diverges from the "
            "prevailing regime."
        )

    @property
    def level_type_example(self) -> str:
        return "sentiment_reaction_level"

    @property
    def confidence_formula(self) -> str:
        return (
            "scale confidence with how clearly price action confirms (or "
            "contradicts) the expected risk-on/risk-off behavior for this "
            "pair's currencies; a clean confirmation across several recent "
            "candles is stronger evidence than a single candle."
        )

    @property
    def extra_instructions(self) -> str:
        return (
            "8. You do NOT have live news headlines or social media text - "
            "never invent a specific news event, tweet, or source. Reason "
            "only from the session/price data given and general knowledge "
            "of which currencies behave as risk-on vs. safe-haven.\n"
            "9. If price is moving in a way that contradicts the expected "
            "regime behavior for this pair, that divergence itself is the "
            "finding - state it plainly rather than forcing a narrative to "
            "fit the expected pattern."
        )

    @property
    def min_candles(self) -> int:
        return 10

    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        context = context or {}
        candle_text = self.format_candles(candles, max_candles=20)
        session = context.get("session", "unknown")
        knowledge = retrieve_for_prompt(
            "sentiment",
            "risk on risk off positioning safe haven price reaction",
        )
        parts = [
            f"Symbol: {symbol}",
            f"Timeframe: {timeframe}",
            f"Session: {session}",
            f"Recent candles ({len(candles)} total):",
            candle_text,
        ]
        if knowledge:
            parts.append(knowledge)
        parts.append(
            "Assess the risk-on/risk-off regime and whether price confirms "
            "or diverges from it for this pair. Return your JSON output."
        )
        return "\n\n".join(parts)
