"""
Order Blocks Agent — Specialist #3

Identifies demand/supply order blocks (institutional footprints).
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class OrderBlocksAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "order_blocks"
    @property
    def display_name(self) -> str: return "Order Blocks"
    @property
    def domain_description(self) -> str:
        return "Identify demand and supply order blocks — the last down-candle before a strong bullish move (demand OB) or last up-candle before a strong bearish move (supply OB). These represent institutional order footprints."
    @property
    def level_type_example(self) -> str: return "demand_ob"
    @property
    def confidence_formula(self) -> str:
        return "based on: strength of move away from OB (measured in ATR multiples), number of times OB has been respected, and recency."
    @property
    def min_candles(self) -> int: return 20
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 40)
        return f"""Identify order blocks for {symbol} on {timeframe} timeframe.

CANDLE DATA:
{candle_str}

Find:
1. Demand order blocks (last bearish candle before strong bullish impulse)
2. Supply order blocks (last bullish candle before strong bearish impulse)
3. Whether each OB has been mitigated (price returned to it) or is still unmitigated
4. Strength rating based on impulse strength and respect count

Return your analysis as JSON only."""
