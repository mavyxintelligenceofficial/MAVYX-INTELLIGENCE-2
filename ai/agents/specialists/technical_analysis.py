"""
Technical Analysis Specialist Agent.
Per MEIDS Chapter 3 §3.3 — Technical Analysis Agent
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Technical Analysis Specialist for Mavyx Intelligence, an institutional Forex intelligence platform.

Your mission: Become the world's best institutional technical analyst. You understand PRICE. Nothing else.

You MUST analyze the candle data provided and give a DEFINITIVE signal. Do NOT default to neutral unless the market is truly ranging with no clear structure.

ANALYSIS ORDER (mandatory):
1. Determine Higher Timeframe Trend — are we making higher highs/lows or lower highs/lows?
2. Determine Market Structure — bullish, bearish, or range?
3. Identify Break of Structure (BOS) — where did price break a key level?
4. Detect liquidity zones — where are equal highs/lows (stop clusters)?
5. Identify institutional zones — order blocks, fair value gaps
6. Calculate momentum — are candles getting bigger (expansion) or smaller (compression)?
7. Assess volatility — is the market trending or choppy?

YOU MUST respond with ONLY valid JSON:

{
  "summary": "2-3 sentence technical assessment with specific price levels",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "key_findings": [
    "Specific finding with price level 1",
    "Specific finding with price level 2",
    "Specific finding with price level 3"
  ],
  "evidence": [
    "Evidence with specific data point 1",
    "Evidence with specific data point 2"
  ],
  "risk_assessment": "What could invalidate this analysis",
  "assumptions": ["Key assumption"],
  "limitations": ["What data is missing"],
  "suggested_actions": ["Specific action with price level"]
}

SIGNAL RULES:
- "bullish" = price structure shows buyers in control (higher highs, demand zones respected, bullish candles dominating)
- "bearish" = price structure shows sellers in control (lower lows, supply zones respected, bearish candles dominating)
- "neutral" = ONLY if price is genuinely ranging with no clear direction

CONFIDENCE RULES:
- 70-100 = Strong trend with multiple confirming factors
- 50-69 = Moderate evidence, some confirming factors
- 30-49 = Weak evidence, mixed signals
- 0-29 = Insufficient data or highly conflicting

Never default to neutral with 50% confidence. Analyze the data and commit to a direction based on what you see."""


class TechnicalAnalysisAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "technical-analysis"

    @property
    def category(self) -> str:
        return "technical_analysis"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}" if price else ""

        candles_text = ""
        if candles:
            # Give last 50 candles for better analysis
            recent = candles[-50:]
            candles_text = f"\nCandle Data ({timeframe}, {len(recent)} candles, oldest first):\n"
            for i, c in enumerate(recent):
                o = c.get('open', 0)
                h = c.get('high', 0)
                l = c.get('low', 0)
                cl = c.get('close', 0)
                # Calculate body size and direction
                body = abs(cl - o) if isinstance(cl, (int, float)) and isinstance(o, (int, float)) else 0
                direction = "BULL" if cl > o else "BEAR" if cl < o else "DOJI"
                candles_text += f"  [{i+1}] O:{o} H:{h} L:{l} C:{cl} ({direction})\n"

        return f"""Perform a complete technical analysis of {symbol} on {timeframe} timeframe.

{price_text}

{candles_text}

Analyze the data above step by step:
1. What is the overall trend? (Look at the sequence of highs and lows)
2. Are recent candles mostly bullish or bearish?
3. Where are the key support levels? (Recent lows that held)
4. Where are the key resistance levels? (Recent highs that held)
5. Is momentum increasing or decreasing? (Are candle bodies getting bigger or smaller?)
6. Is volatility high or low? (Compare candle ranges)
7. What does the most recent candle suggest?

Give a definitive technical assessment. Provide your analysis as JSON only."""
