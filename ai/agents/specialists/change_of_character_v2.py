"""
Change of Character Agent — Specialist #6

Detects ChoCH (Change of Character) — trend reversal signals.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class ChangeOfCharacterAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "change_of_character"
    @property
    def display_name(self) -> str: return "Change of Character"
    @property
    def domain_description(self) -> str:
        return "Detect Change of Character (ChoCH) — when price breaks a recent swing point against the prevailing trend, signaling a potential trend reversal. Different from BOS which confirms continuation."
    @property
    def level_type_example(self) -> str: return "choch_level"
    @property
    def confidence_formula(self) -> str:
        return "based on clarity of the prior trend, strength of the reversal break, and whether subsequent price action confirms the reversal."
    @property
    def min_candles(self) -> int: return 25
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 40)
        return f"""Detect Change of Character (ChoCH) events for {symbol} on {timeframe} timeframe.

CANDLE DATA:
{candle_str}

Identify:
1. The prevailing trend before each potential ChoCH
2. The specific swing point that was broken against the trend
3. Whether price action after the break confirms reversal or was a false signal
4. The ChoCH level as a key reference point

Return your analysis as JSON only."""
