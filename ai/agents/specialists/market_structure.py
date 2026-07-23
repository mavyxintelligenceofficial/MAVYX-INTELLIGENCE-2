"""
Market Structure Specialist Agent.

Per Volume IV §2.4 — Smart Money & ICT Agents category:
Responsible for institutional trading concepts.

This agent analyzes:
- Market structure (higher highs, lower lows)
- Liquidity zones and sweeps
- Order blocks
- Fair value gaps (FVG)
- Break of structure (BOS)
- Change of character (CHoCH)
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Market Structure Specialist for Mavyx Intelligence, an AI-powered Forex market intelligence platform.

Your role: Analyze market structure using Smart Money / ICT (Inner Circle Trader) concepts to identify institutional behavior, liquidity zones, and structural shifts.

IMPORTANT: Respond with ONLY valid JSON. No text before or after. Use this exact format:

{
  "summary": "One paragraph summary of the market structure",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "key_findings": [
    "Finding 1 about market structure",
    "Finding 2 about liquidity or order flow"
  ],
  "evidence": [
    "Evidence point 1 with specific price levels",
    "Evidence point 2"
  ],
  "risk_assessment": "Structural risks to the current thesis",
  "assumptions": [
    "Assumption 1"
  ],
  "limitations": [
    "Limitation 1"
  ],
  "suggested_actions": [
    "Action 1 based on structure"
  ]
}

Rules:
- Signal must be exactly "bullish", "bearish", or "neutral"
- Confidence must be an integer 0-100
- Identify market structure shifts (BOS, CHoCH)
- Mark potential order blocks and fair value gaps
- Note liquidity pools above/below recent price
- This is analysis only, not financial advice"""


class MarketStructureAgent(BaseAgent):
    """Market Structure specialist — analyzes Smart Money / ICT concepts."""

    @property
    def name(self) -> str:
        return "market-structure"

    @property
    def category(self) -> str:
        return "smart_money"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(
        self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h"
    ) -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        price_text = ""
        if price:
            price_text = f"""Current Price: {price.get('price', 'N/A')} ({symbol})
Timestamp: {price.get('timestamp', 'N/A')}"""

        candles_text = ""
        if candles:
            recent = candles[-30:]
            candles_text = f"\nRecent Candles ({timeframe}, last {len(recent)}):\n"
            for i, c in enumerate(recent):
                candles_text += (
                    f"  [{i+1}] O:{c.get('open')} H:{c.get('high')} "
                    f"L:{c.get('low')} C:{c.get('close')} T:{c.get('timestamp')}\n"
                )

        return f"""Analyze the market structure of {symbol} using Smart Money / ICT concepts.

{price_text}
{candles_text}

Analyze:
1. Current market structure — is price making higher highs/higher lows (bullish) or lower highs/lower lows (bearish)?
2. Most recent Break of Structure (BOS) or Change of Character (CHoCH)
3. Potential order blocks (last opposing candle before a strong move)
4. Fair value gaps (imbalances where price moved too fast)
5. Liquidity pools (equal highs/lows, stop loss clusters)
6. Premium vs discount zones relative to recent range

Provide your analysis as JSON only."""
