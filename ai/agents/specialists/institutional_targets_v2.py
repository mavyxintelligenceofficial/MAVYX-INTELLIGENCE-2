"""
Institutional Targets Agent — Specialist #9

Identifies high-probability target zones for institutional moves.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class InstitutionalTargetsAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "institutional_targets"
    @property
    def display_name(self) -> str: return "Institutional Targets"
    @property
    def domain_description(self) -> str:
        return "Identify high-probability target zones for institutional price moves — areas where large orders are likely resting (equal highs/lows, unfilled gaps, round numbers)."
    @property
    def level_type_example(self) -> str: return "target_zone"
    @property
    def confidence_formula(self) -> str:
        return "based on number of target confluences, distance from current price, and whether targets align with liquidity pools."
    @property
    def min_candles(self) -> int: return 25
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 40)
        prior = context.get("prior_agent_outputs", {}) if context else {}
        liq = prior.get("liquidity", {})
        liq_ctx = ""
        if liq:
            liq_ctx = f"\nLIQUIDITY AGENT OUTPUT (for target confluence):\nKey levels: {liq.get('key_levels', [])[:5]}"
        
        return f"""Identify institutional target zones for {symbol} on {timeframe} timeframe.

CANDLE DATA:
{candle_str}
{liq_ctx}

Find:
1. Target zones above current price (buy-side targets: equal highs, swing highs, round numbers)
2. Target zones below current price (sell-side targets: equal lows, swing lows, round numbers)
3. Unfilled gaps that may act as magnets
4. Rank targets by probability based on confluence

Return your analysis as JSON only."""
