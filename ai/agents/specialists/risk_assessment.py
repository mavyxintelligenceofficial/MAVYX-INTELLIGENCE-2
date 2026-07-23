"""
Risk Intelligence Specialist Agent.

Per Volume IV §2.4 — Risk Intelligence Agents category:
Responsible for evaluating uncertainty and risk conditions.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Risk Intelligence Specialist for Mavyx Intelligence, an AI-powered Forex market intelligence platform.

Your role: Evaluate risk conditions, volatility, and risk/reward potential for a currency pair trade setup.

IMPORTANT: Respond with ONLY valid JSON. No text before or after. Use this exact format:

{
  "summary": "One paragraph risk assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "key_findings": [
    "Finding 1 about risk",
    "Finding 2"
  ],
  "evidence": [
    "Evidence point 1",
    "Evidence point 2"
  ],
  "risk_assessment": "Overall risk level and key risk factors",
  "assumptions": [
    "Assumption 1"
  ],
  "limitations": [
    "Limitation 1"
  ],
  "suggested_actions": [
    "Suggested risk management action"
  ]
}

Rules:
- Signal must be exactly "bullish", "bearish", or "neutral"
- Confidence must be an integer 0-100
- Assess volatility using the candle data range
- Evaluate risk/reward ratio for a potential trade
- Note any upcoming high-impact economic events
- Recommend maximum position risk (e.g., 1-2% of account)
- This is analysis only, not financial advice"""


class RiskAssessmentAgent(BaseAgent):
    """Risk specialist — evaluates volatility, risk/reward, and position sizing."""

    @property
    def name(self) -> str:
        return "risk-assessment"

    @property
    def category(self) -> str:
        return "risk"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(
        self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h"
    ) -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}"

        # Calculate basic volatility from candles
        volatility_text = ""
        if candles and len(candles) >= 5:
            recent = candles[-20:]
            ranges = [
                float(c.get("high", 0)) - float(c.get("low", 0))
                for c in recent
                if c.get("high") and c.get("low")
            ]
            if ranges:
                avg_range = sum(ranges) / len(ranges)
                max_range = max(ranges)
                volatility_text = f"""
Volatility Data (last {len(ranges)} candles):
- Average Range: {avg_range:.5f}
- Maximum Range: {max_range:.5f}
- Current vs Average: {'Higher' if ranges[-1] > avg_range else 'Lower'} than average"""

        return f"""Evaluate the risk conditions for {symbol} on the {timeframe} timeframe.

{price_text}
{volatility_text}

Assess:
1. Current volatility level (low, normal, elevated, high)
2. Risk/reward potential for a trade at current levels
3. Key risk factors (upcoming events, correlation risks, etc.)
4. Recommended maximum risk per trade
5. Optimal stop loss placement relative to structure
6. Market condition suitability for trading

Provide your risk assessment as JSON only."""
