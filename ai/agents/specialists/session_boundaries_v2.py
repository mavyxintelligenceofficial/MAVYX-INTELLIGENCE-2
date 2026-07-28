"""
Session Boundaries Agent — Specialist #8

Analyzes Asian, London, New York session ranges.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class SessionBoundariesAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "session_boundaries"
    @property
    def display_name(self) -> str: return "Session Boundaries"
    @property
    def domain_description(self) -> str:
        return "Analyze trading session ranges (Asian, London, New York) — session highs/lows, range expansion/consolidation, and session-based liquidity."
    @property
    def level_type_example(self) -> str: return "session_high"
    @property
    def confidence_formula(self) -> str:
        return "based on clarity of session range, whether price is respecting session boundaries, and current session context."
    @property
    def min_candles(self) -> int: return 15
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 30)
        session = "Unknown"
        if context:
            session = context.get("session", "Unknown")
        
        return f"""Analyze session boundaries for {symbol} on {timeframe} timeframe.
Current session: {session}

CANDLE DATA:
{candle_str}

Identify:
1. Asian session range (high/low) if visible in the data
2. London session range (high/low) if visible
3. New York session range (high/low) if visible
4. Whether price is in range expansion or consolidation phase
5. Key session-based levels

Return your analysis as JSON only."""
