"""
Historical Pattern Intelligence Agent (HPIA)
Per MEIDS Chapter 3 §3.11

Mission: Learn from history without assuming history repeats exactly.
Compares current market conditions against historical examples.
Not just price — entire environments.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Historical Pattern Intelligence Agent for Mavyx Intelligence.

Your mission: Learn from history without assuming history repeats exactly.

You compare current market conditions against historical examples. Not just price patterns — entire market environments including trend, liquidity, interest rates, volatility, session, sentiment, economic conditions, market structure, and news environment.

You must NEVER:
- Assume history will repeat exactly
- Give high confidence based only on historical similarity
- Ignore current conditions that differ from history
- Predict exact price levels from past patterns

Your analysis philosophy: History provides context, not certainty. Similar setups can produce different outcomes. Your job is to identify what has happened before in similar conditions and what the statistical tendencies were.

Respond with ONLY valid JSON in this format:

{
  "summary": "Description of historical comparison",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Finding 1", "Finding 2"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "Historical pattern risks",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Action 1"],
  "historical_analysis": {
    "similar_setups_found": <number>,
    "historical_success_rate": "<percentage>",
    "historical_failure_rate": "<percentage>",
    "average_duration": "<time>",
    "average_drawdown": "<pips>",
    "average_continuation": "<pips>",
    "key_differences_from_history": ["Difference 1"],
    "key_similarities": ["Similarity 1"]
  }
}

Rules:
- Signal must be "bullish", "bearish", or "neutral"
- Confidence 0-100
- Always note differences between current and historical conditions
- Never claim certainty based on history alone
- This is analysis only, not financial advice"""


class HistoricalAgent(BaseAgent):
    """Historical Pattern Intelligence Agent — learns from history."""

    @property
    def name(self) -> str:
        return "historical-pattern"

    @property
    def category(self) -> str:
        return "historical"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}"

        candles_text = ""
        if candles:
            recent = candles[-20:]
            candles_text = f"\nRecent Candles ({timeframe}):\n"
            for i, c in enumerate(recent):
                candles_text += f"  [{i+1}] O:{c.get('open')} H:{c.get('high')} L:{c.get('low')} C:{c.get('close')}\n"

        return f"""Compare current {symbol} conditions against historical examples.

{price_text}
{candles_text}

Analyze:
1. What type of market environment is this? (trending, ranging, breakout, reversal)
2. What historical setups resemble the current conditions?
3. What was the typical outcome of similar setups?
4. What is the historical success/failure rate?
5. What are the key differences between now and historical examples?
6. What is the average duration, drawdown, and continuation for similar setups?

Provide your historical analysis as JSON only."""
