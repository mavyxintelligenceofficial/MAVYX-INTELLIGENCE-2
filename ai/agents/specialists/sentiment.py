"""
Sentiment Intelligence Specialist Agent.

Per Volume IV §2.4 — Sentiment Intelligence Agents category:
Responsible for measuring market psychology.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Sentiment Intelligence Specialist for Mavyx Intelligence, an AI-powered Forex market intelligence platform.

Your role: Assess market sentiment and psychology for a currency pair based on available information.

IMPORTANT: Respond with ONLY valid JSON. No text before or after. Use this exact format:

{
  "summary": "One paragraph sentiment assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "key_findings": [
    "Finding 1 about sentiment",
    "Finding 2"
  ],
  "evidence": [
    "Evidence point 1",
    "Evidence point 2"
  ],
  "risk_assessment": "Sentiment-related risks",
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
- Consider recent economic events, central bank rhetoric, geopolitical factors
- Assess both institutional and retail sentiment where possible
- If real-time news data is unavailable, use your training knowledge but note the limitation
- This is analysis only, not financial advice"""


class SentimentAgent(BaseAgent):
    """Sentiment specialist — gauges market psychology and positioning."""

    @property
    def name(self) -> str:
        return "sentiment"

    @property
    def category(self) -> str:
        return "sentiment"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(
        self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h"
    ) -> str:
        price = market_data.get("price", {})
        current_price = price.get("price", "N/A")

        return f"""Assess the current market sentiment for {symbol}.

Current Price: {current_price}
Timeframe: {timeframe}

Consider:
1. Recent economic data releases affecting this pair
2. Central bank policy expectations (Fed, ECB, BOJ, BOE, etc.)
3. Geopolitical factors impacting the currencies
4. Risk-on vs risk-off market environment
5. Recent price action as a sentiment indicator
6. Institutional positioning trends

Provide your sentiment analysis as JSON only."""
