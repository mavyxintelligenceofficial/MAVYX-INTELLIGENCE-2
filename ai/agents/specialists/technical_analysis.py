"""
Technical Analysis Agent — price action, market structure, and Smart
Money Concepts.

Per the user's architecture: this agent's library covers ICT, Smart
Money Concepts, Wyckoff-style market structure, and classical technical
analysis (support/resistance, trend, candlestick patterns). It only
ever retrieves from the 'technical' knowledge domain - never macro,
sentiment, or risk documents.

This replaces the previous generation's 8 separate ICT-granular agents
(market_structure, liquidity, order_blocks, fair_value_gaps,
break_of_structure, change_of_character, premium_discount,
session_boundaries as a technical concept) - those concepts are still
covered, but as one agent's reasoning across a unified read of the
chart, not 8 agents each looking at one narrow slice in isolation.
session_boundaries's actual job (which session is active) moved to
being computed directly by the orchestrator (_get_session), since it
was never something that needed AI judgment.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent
from knowledge.rag_engine import retrieve_for_prompt


class TechnicalAnalysisAgent(SpecialistAgent):

    @property
    def name(self) -> str:
        return "technical_analysis"

    @property
    def display_name(self) -> str:
        return "Technical Analysis"

    @property
    def domain_description(self) -> str:
        return (
            "Price action and structure: Smart Money Concepts (market "
            "structure, Break of Structure, Change of Character, order "
            "blocks, fair value gaps, liquidity pools, premium/discount "
            "zones) and classical technical analysis (support/resistance, "
            "trend, candlestick patterns). You read the whole chart as one "
            "picture rather than one concept in isolation."
        )

    @property
    def level_type_example(self) -> str:
        return "order_block | fvg | liquidity_pool | support | resistance"

    @property
    def confidence_formula(self) -> str:
        return (
            "count how many distinct technical concepts (structure, "
            "liquidity, order blocks/FVGs, premium-discount) agree on the "
            "same directional bias; confidence should scale with that "
            "convergence, not with how confident any single concept feels "
            "in isolation. More agreeing concepts = higher confidence."
        )

    @property
    def extra_instructions(self) -> str:
        return (
            "8. Identify the current market structure (trend direction, most "
            "recent BOS/CHoCH) FIRST, then layer in liquidity pools, order "
            "blocks, and fair value gaps as supporting or contradicting "
            "evidence for that structural read - don't treat each concept "
            "as an independent vote.\n"
            "9. If different concepts disagree (e.g. structure is bullish "
            "but price sits in a premium zone with unfilled bearish FVGs "
            "above), say so explicitly in reasoning rather than picking "
            "one and ignoring the other."
        )

    @property
    def min_candles(self) -> int:
        return 30

    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        context = context or {}
        candle_text = self.format_candles(candles)
        session = context.get("session", "unknown")
        knowledge = retrieve_for_prompt(
            "technical",
            "market structure order blocks fair value gaps liquidity premium discount trend support resistance",
        )
        parts = [
            f"Symbol: {symbol}",
            f"Timeframe: {timeframe}",
            f"Session: {session}",
            f"Candles ({len(candles)} total, most recent last):",
            candle_text,
        ]
        if knowledge:
            parts.append(knowledge)
        parts.append(
            "Analyze market structure, liquidity, order blocks, fair value "
            "gaps, and premium/discount positioning together as one read. "
            "Return your JSON output."
        )
        return "\n\n".join(parts)
