"""
Premium/Discount Agent — Specialist #7

Determines if price is in premium or discount zone.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class PremiumDiscountAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "premium_discount"
    @property
    def display_name(self) -> str: return "Premium/Discount"
    @property
    def domain_description(self) -> str:
        return "Determine if current price is in a premium zone (above equilibrium, expensive) or discount zone (below equilibrium, cheap) based on the recent range."
    @property
    def level_type_example(self) -> str: return "equilibrium"
    @property
    def confidence_formula(self) -> str:
        return "based on how far price is from the 50% equilibrium level of the range, and the range's timeframe significance."
    @property
    def min_candles(self) -> int: return 20
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 30)
        return f"""Determine premium/discount zones for {symbol} on {timeframe} timeframe.

CANDLE DATA:
{candle_str}

Calculate:
1. The recent range (swing high to swing low)
2. The equilibrium (50% level) of that range
3. Whether current price is in premium (>50%) or discount (<50%)
4. Key premium/discount boundary levels (e.g., 61.8%, 38.2% Fibonacci of range)

Return your analysis as JSON only."""
