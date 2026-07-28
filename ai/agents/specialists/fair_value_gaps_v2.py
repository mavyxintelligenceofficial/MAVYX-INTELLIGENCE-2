"""
Fair Value Gaps Agent — Specialist #4

Identifies imbalance zones (FVGs/IFVGs).
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class FairValueGapsAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "fair_value_gaps"
    @property
    def display_name(self) -> str: return "Fair Value Gaps"
    @property
    def domain_description(self) -> str:
        return "Identify Fair Value Gaps (FVGs) — three-candle patterns where candle 1's high is below candle 3's low (bullish FVG) or candle 1's low is above candle 3's high (bearish FVG). These represent price imbalances that tend to get filled."
    @property
    def level_type_example(self) -> str: return "bullish_fvg"
    @property
    def confidence_formula(self) -> str:
        return "based on gap size relative to ATR, whether gap has been partially filled, and timeframe significance."
    @property
    def min_candles(self) -> int: return 15
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 40)
        return f"""Identify Fair Value Gaps for {symbol} on {timeframe} timeframe.

CANDLE DATA:
{candle_str}

Find:
1. Bullish FVGs (candle[1].high < candle[3].low in a 3-candle pattern)
2. Bearish FVGs (candle[1].low > candle[3].high in a 3-candle pattern)
3. Whether each FVG has been filled or remains open
4. Gap size relative to recent volatility

Return your analysis as JSON only."""
