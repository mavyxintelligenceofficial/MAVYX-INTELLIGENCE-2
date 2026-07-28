"""
Liquidity Agent — Specialist #2

Maps resting liquidity pools and recent sweeps.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class LiquidityAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "liquidity"
    @property
    def display_name(self) -> str: return "Liquidity"
    @property
    def domain_description(self) -> str:
        return "Map resting liquidity pools (equal highs, equal lows, trendline liquidity) and identify recent liquidity sweeps."
    @property
    def level_type_example(self) -> str: return "liquidity_pool"
    @property
    def confidence_formula(self) -> str:
        return "based on number of touches creating the pool, volume on sweep, and whether price reclaimed after sweep."
    @property
    def min_candles(self) -> int: return 25
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 40)
        return f"""Analyze liquidity conditions for {symbol} on {timeframe} timeframe.

CANDLE DATA:
{candle_str}

Identify:
1. Liquidity pools (equal highs/lows where stops cluster)
2. Recent liquidity sweeps (price taking out a level then reversing)
3. Remaining resting liquidity above and below current price
4. Sweep + reclaim patterns

Return your analysis as JSON only."""
