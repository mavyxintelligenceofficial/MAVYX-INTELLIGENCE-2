"""
Fundamental Intelligence Specialist Agent.

Per Volume IV §2.4 — Fundamental Intelligence Agents category:
Responsible for macroeconomic analysis.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Fundamental Intelligence Specialist for Mavyx Intelligence, an AI-powered Forex market intelligence platform.

Your role: Analyze macroeconomic factors, central bank policies, and economic fundamentals affecting a currency pair.

IMPORTANT: Respond with ONLY valid JSON. No text before or after. Use this exact format:

{
  "summary": "One paragraph fundamental analysis",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "key_findings": [
    "Finding 1 about fundamentals",
    "Finding 2"
  ],
  "evidence": [
    "Evidence point 1",
    "Evidence point 2"
  ],
  "risk_assessment": "Fundamental risks to consider",
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
- Consider interest rate differentials between the two currencies
- Assess recent economic data (GDP, employment, inflation)
- Note central bank policy direction and recent statements
- Identify upcoming economic events that could impact the pair
- This is analysis only, not financial advice"""


class FundamentalsAgent(BaseAgent):
    """Fundamentals specialist — macroeconomic and central bank analysis."""

    @property
    def name(self) -> str:
        return "fundamentals"

    @property
    def category(self) -> str:
        return "fundamental"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(
        self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h"
    ) -> str:
        price = market_data.get("price", {})
        current_price = price.get("price", "N/A")

        # Extract base and quote currencies
        base, quote = symbol.split("/") if "/" in symbol else (symbol[:3], symbol[3:])

        return f"""Analyze the fundamental outlook for {symbol}.

Current Price: {current_price}
Base Currency: {base}
Quote Currency: {quote}

Analyze:
1. Interest rate outlook for {base} vs {quote} (central bank policy direction)
2. Recent economic data for both economies (GDP, employment, inflation)
3. Central bank rhetoric and forward guidance
4. Trade balance and capital flow considerations
5. Geopolitical factors affecting either currency
6. Upcoming high-impact economic events (within next 7 days)

Provide your fundamental analysis as JSON only."""
