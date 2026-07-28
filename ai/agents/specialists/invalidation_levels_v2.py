"""
Invalidation Levels Agent — Specialist #10

Identifies price levels that would invalidate the current thesis.
This agent depends on Order Blocks and Liquidity outputs.
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class InvalidationLevelsAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "invalidation_levels"
    @property
    def display_name(self) -> str: return "Invalidation Levels"
    @property
    def domain_description(self) -> str:
        return "Identify price levels that would invalidate the current market thesis — if price breaks these levels, the analysis from other agents is no longer valid."
    @property
    def level_type_example(self) -> str: return "invalidation"
    @property
    def confidence_formula(self) -> str:
        return "based on the significance of the level (e.g., break of a major OB invalidates the OB thesis) and how clearly defined the level is."
    @property
    def min_candles(self) -> int: return 20
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 40)
        prior = context.get("prior_agent_outputs", {}) if context else {}
        
        # This agent depends on Order Blocks and Liquidity
        ob = prior.get("order_blocks", {})
        liq = prior.get("liquidity", {})
        ms = prior.get("market_structure", {})
        
        dep_ctx = ""
        if ob:
            dep_ctx += f"\nORDER BLOCKS OUTPUT:\nBias: {ob.get('bias')}, Levels: {ob.get('key_levels', [])[:3]}"
        if liq:
            dep_ctx += f"\nLIQUIDITY OUTPUT:\nBias: {liq.get('bias')}, Levels: {liq.get('key_levels', [])[:3]}"
        if ms:
            dep_ctx += f"\nMARKET STRUCTURE OUTPUT:\nBias: {ms.get('bias')}, Levels: {ms.get('key_levels', [])[:3]}"
        
        return f"""Identify invalidation levels for {symbol} on {timeframe} timeframe.

CANDLE DATA:
{candle_str}
{dep_ctx}

Find:
1. Price levels that would invalidate the bullish thesis (if any)
2. Price levels that would invalidate the bearish thesis (if any)
3. Key structural levels whose break would change the market character
4. The single most important invalidation level for the current setup

Return your analysis as JSON only."""
