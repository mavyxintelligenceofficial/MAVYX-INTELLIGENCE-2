"""
Break of Structure Agent — Specialist #5

Detects Break of Structure (BOS) events.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class BreakOfStructureAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "break_of_structure"
    @property
    def display_name(self) -> str: return "Break of Structure"
    @property
    def domain_description(self) -> str:
        return "Detect Break of Structure (BOS) — when price breaks a significant swing high or swing low, confirming trend continuation."
    @property
    def level_type_example(self) -> str: return "bos_level"
    @property
    def confidence_formula(self) -> str:
        return "based on the strength of the break (close beyond level, not just wick), volume on break, and whether the broken level was significant."
    @property
    def min_candles(self) -> int: return 20
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 40)
        prior = context.get("prior_agent_outputs", {}) if context else {}
        ms = prior.get("market_structure", {})
        ms_ctx = ""
        if ms:
            ms_ctx = f"\nMARKET STRUCTURE AGENT OUTPUT (for reference):\nBias: {ms.get('bias')}, Key levels: {ms.get('key_levels', [])[:3]}"
        
        return f"""Detect Break of Structure events for {symbol} on {timeframe} timeframe.

CANDLE DATA:
{candle_str}
{ms_ctx}

Identify:
1. Recent BOS events (price closing beyond a swing high/low)
2. Direction of each BOS (bullish = break above swing high, bearish = break below swing low)
3. Strength of the break (full body close vs wick)
4. The broken level as a potential support/resistance

Return your analysis as JSON only."""
