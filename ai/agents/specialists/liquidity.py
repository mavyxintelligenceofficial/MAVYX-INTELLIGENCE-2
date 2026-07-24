"""
Liquidity Intelligence Agent (LIA)
Per MEIDS Chapter 3 §3.10

Mission: Think like Smart Money.
This is one of the most important agents in Mavyx.
It studies liquidity rather than price.

"Markets seek liquidity. Every move must be evaluated from this perspective."
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Liquidity Intelligence Agent for Mavyx Intelligence.

Your mission: Think like Smart Money. Study LIQUIDITY, not price.

You are one of the most important agents in the platform.

Your responsibility is to detect and map:
- Buy-side liquidity (equal highs, stop clusters above price)
- Sell-side liquidity (equal lows, stop clusters below price)
- Liquidity sweeps (when price takes out a liquidity pool)
- Stop hunts (engineered moves to trigger stops)
- Resting liquidity (pending orders at key levels)
- Session liquidity (liquidity built during specific sessions)
- Institutional target areas (where smart money likely aims)

You must NEVER:
- Analyze price trends (Technical Agent's job)
- Read news (Fundamental Agent's job)
- Calculate risk (Risk Agent's job)
- Predict price direction

Your analysis philosophy: Markets seek liquidity. Every significant move is driven by the need to fill orders. Smart money engineers liquidity before making real moves.

Respond with ONLY valid JSON in this format:

{
  "summary": "Description of current liquidity landscape",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Finding 1", "Finding 2"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "Liquidity-related risks",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Action 1"],
  "liquidity_map": {
    "buy_side_liquidity": ["Level 1", "Level 2"],
    "sell_side_liquidity": ["Level 1", "Level 2"],
    "sweeps_detected": ["Sweep 1"],
    "institutional_targets": ["Target 1"],
    "liquidity_taken": ["Taken 1"],
    "remaining_liquidity": ["Remaining 1"]
  }
}

Rules:
- Signal must be "bullish", "bearish", or "neutral"
- Confidence 0-100
- Always identify where stop losses are clustered
- Always note which liquidity has been taken vs remaining
- This is analysis only, not financial advice"""


class LiquidityAgent(BaseAgent):
    """Liquidity Intelligence Agent — thinks like Smart Money."""

    @property
    def name(self) -> str:
        return "liquidity-intelligence"

    @property
    def category(self) -> str:
        return "liquidity"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}"

        candles_text = ""
        if candles:
            recent = candles[-30:]
            candles_text = f"\nRecent Candles ({timeframe}, last {len(recent)}):\n"
            for i, c in enumerate(recent):
                candles_text += f"  [{i+1}] O:{c.get('open')} H:{c.get('high')} L:{c.get('low')} C:{c.get('close')} T:{c.get('timestamp')}\n"

        return f"""Map the liquidity landscape for {symbol}.

{price_text}
{candles_text}

Analyze:
1. Where are equal highs? (Buy-side liquidity pools)
2. Where are equal lows? (Sell-side liquidity pools)
3. Has price recently swept any liquidity? (taken out stops)
4. Where are stop losses likely clustered?
5. What liquidity remains untapped?
6. Where might institutional targets be?
7. Is price engineering liquidity before a move?

Provide your liquidity analysis as JSON only."""
