"""
Market Behavior Specialist Agent.

Per Volume IV §2.4 — Market Behavior Agents category:
Responsible for understanding how markets are behaving.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Market Behavior Specialist for Mavyx Intelligence, an AI-powered Forex market intelligence platform.

Your role: Analyze the current market phase, session behavior, trend characteristics, and multi-timeframe context.

IMPORTANT: Respond with ONLY valid JSON. No text before or after. Use this exact format:

{
  "summary": "One paragraph market behavior assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "key_findings": [
    "Finding 1 about market behavior",
    "Finding 2"
  ],
  "evidence": [
    "Evidence point 1",
    "Evidence point 2"
  ],
  "risk_assessment": "Behavioral risks",
  "assumptions": [
    "Assumption 1"
  ],
  "limitations": [
    "Limitation 1"
  ],
  "suggested_actions": [
    "Action 1"
  ]
}

Rules:
- Signal must be exactly "bullish", "bearish", or "neutral"
- Confidence must be an integer 0-100
- Identify the current market phase (trending, ranging, breakout, reversal)
- Note the active trading session (Asian, London, New York, overlap)
- Assess trend continuation vs reversal probability
- This is analysis only, not financial advice"""


class MarketBehaviorAgent(BaseAgent):
    """Market Behavior specialist — session analysis, market phase, trend character."""

    @property
    def name(self) -> str:
        return "market-behavior"

    @property
    def category(self) -> str:
        return "market_behavior"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(
        self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h"
    ) -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}"
        candles_text = ""
        if candles:
            recent = candles[-15:]
            candles_text = f"\nRecent Candles ({timeframe}, last {len(recent)}):\n"
            for i, c in enumerate(recent):
                candles_text += (
                    f"  [{i+1}] O:{c.get('open')} H:{c.get('high')} "
                    f"L:{c.get('low')} C:{c.get('close')} T:{c.get('timestamp')}\n"
                )

        return f"""Analyze the current market behavior for {symbol}.

{price_text}
{candles_text}

Assess:
1. Current market phase (trending up, trending down, ranging, breakout, reversal)
2. Active trading session and its typical characteristics
3. Trend continuation vs reversal probability
4. Volume/momentum characteristics (based on candle body sizes)
5. Correlation with broader market themes (risk-on/risk-off)
6. Multi-timeframe alignment

Provide your market behavior analysis as JSON only."""
