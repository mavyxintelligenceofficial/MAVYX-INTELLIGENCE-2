"""
Market Structure Agent — Specialist #1

Analyzes swing highs/lows, trend direction, market structure.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class MarketStructureAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "market_structure"
    @property
    def display_name(self) -> str: return "Market Structure"
    @property
    def domain_description(self) -> str:
        return "Analyze swing highs, swing lows, trend direction, and overall market structure (higher highs/higher lows vs lower highs/lower lows)."
    @property
    def level_type_example(self) -> str: return "swing_high"
    @property
    def confidence_formula(self) -> str:
        return "based on number of consecutive structure points confirming the trend and recency of the last structural break."
    @property
    def min_candles(self) -> int: return 30
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 40)
        prior = context.get("prior_agent_outputs", {}) if context else {}
        prior_ctx = ""
        if prior:
            prior_ctx = f"\nPRIOR AGENT OUTPUTS (for reference only, do not re-analyze):\n{', '.join(prior.keys())}"
        
        return f"""Analyze the market structure for {symbol} on {timeframe} timeframe.

CANDLE DATA (last {min(len(candles), 40)} bars):
{candle_str}
{prior_ctx}

Identify:
1. Swing highs and swing lows (use candle indices)
2. Current trend direction (higher highs/lows = bullish, lower highs/lows = bearish)
3. Most recent structural break (if any)
4. Key structural levels

Return your analysis as JSON only."""
