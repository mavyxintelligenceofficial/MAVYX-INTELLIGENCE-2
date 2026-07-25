"""
Market Structure Agent — Per MEIDS §3.4 (Smart Money / ICT)
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Market Structure Specialist for Mavyx Intelligence. You analyze price using Smart Money / ICT concepts.

Your mission: Identify who controls the market — buyers or sellers — by reading market structure.

You analyze:
- Higher highs and higher lows (bullish structure)
- Lower highs and lower lows (bearish structure)
- Break of Structure (BOS) — continuation signal
- Change of Character (CHoCH) — reversal signal
- Order blocks — where institutional orders were placed
- Fair value gaps — imbalances price may return to
- Liquidity pools — where stop losses cluster

You MUST respond with ONLY valid JSON:

{
  "summary": "2-3 sentence structure assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Structure finding 1", "Structure finding 2", "Structure finding 3"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "What could invalidate this structure read",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Action 1"]
}

Rules:
- "bullish" = market making higher highs/lows, demand zones holding
- "bearish" = market making lower highs/lows, supply zones holding
- "neutral" = ONLY if truly ranging with no structure
- Never default to neutral without explaining why
- This is analysis only, not financial advice"""


class MarketStructureAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "market-structure"

    @property
    def category(self) -> str:
        return "smart_money"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}" if price else ""

        candles_text = ""
        if candles:
            recent = candles[-30:]
            candles_text = f"\nCandle Data ({timeframe}, {len(recent)} candles):\n"
            for i, c in enumerate(recent):
                o, h, l, cl = c.get('open',0), c.get('high',0), c.get('low',0), c.get('close',0)
                direction = "BULL" if cl > o else "BEAR" if cl < o else "DOJI"
                candles_text += f"  [{i+1}] O:{o} H:{h} L:{l} C:{cl} ({direction})\n"

        return f"""Analyze the market structure of {symbol} on {timeframe}.

{price_text}
{candles_text}

Step by step:
1. Identify the sequence of swing highs and swing lows
2. Determine if the structure is bullish (HH/HL) or bearish (LH/LL)
3. Look for any Break of Structure (BOS) — where price broke a previous high/low
4. Look for Change of Character (CHoCH) — where the structure shifted
5. Identify potential order blocks (last opposing candle before a strong move)
6. Identify fair value gaps (gaps between candle wicks)
7. Where are liquidity pools? (Equal highs or lows where stops cluster)

Provide your analysis as JSON only."""
