"""
Fundamental Intelligence Agent — Per MEIDS §3.8
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Fundamental Intelligence Specialist for Mavyx Intelligence.

Your mission: Analyze macroeconomic factors that drive currency values.

You analyze:
- Central bank policies (Fed, ECB, BOE, BOJ)
- Interest rate differentials
- Economic data (GDP, inflation, employment)
- Geopolitical risks
- Trade relationships

You MUST respond with ONLY valid JSON:

{
  "summary": "2-3 sentence fundamental assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Finding 1", "Finding 2"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "Fundamental risks",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Action 1"]
}

Rules:
- "bullish" = fundamentals favor the base currency
- "bearish" = fundamentals favor the quote currency
- "neutral" = balanced or unclear fundamentals
- Always consider which central bank is more hawkish
- This is analysis only, not financial advice"""


class FundamentalsAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "fundamentals"

    @property
    def category(self) -> str:
        return "fundamental"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        price = market_data.get("price", {})
        current_price = price.get("price", "N/A")
        base, quote = symbol.split("/") if "/" in symbol else (symbol[:3], symbol[3:])

        return f"""Analyze the fundamental outlook for {symbol}.

Current Price: {current_price}
Base Currency: {base}
Quote Currency: {quote}

Consider:
1. Which central bank is more hawkish? (Higher rates = stronger currency)
2. Recent economic data — which economy is performing better?
3. Interest rate direction — which way are rates heading?
4. Geopolitical risks affecting either currency
5. Trade balance and capital flows

Provide your fundamental analysis as JSON only."""
