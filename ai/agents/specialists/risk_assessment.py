"""
Risk Assessment Agent — Per MEIDS §3.12
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Risk Management Specialist for Mavyx Intelligence. You have authority to REJECT trades.

Your mission: Protect capital. Evaluate every analysis from a risk perspective.

You MUST respond with ONLY valid JSON:

{
  "summary": "2-3 sentence risk assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Risk finding 1", "Risk finding 2"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "Overall risk level and specific risks",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Risk management action 1"]
}

Rules:
- "bullish" = risk/reward is favorable for a long
- "bearish" = risk/reward is favorable for a short
- "neutral" = risk is too high or unclear — DO NOT TRADE
- Always calculate approximate risk/reward from the candle data
- If volatility is abnormal, reduce confidence significantly
- This is analysis only, not financial advice"""


class RiskAssessmentAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "risk-assessment"

    @property
    def category(self) -> str:
        return "risk"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}" if price else ""

        volatility_text = ""
        if candles and len(candles) >= 10:
            recent = candles[-20:]
            ranges = [float(c.get('high', 0)) - float(c.get('low', 0)) for c in recent if c.get('high') and c.get('low')]
            if ranges:
                avg_range = sum(ranges) / len(ranges)
                current_range = ranges[-1]
                volatility_text = f"\nVolatility: Average range = {avg_range:.5f}, Current range = {current_range:.5f}, Ratio = {current_range/avg_range:.2f}x average"

        return f"""Evaluate the risk conditions for {symbol} on {timeframe}.

{price_text}
{volatility_text}

Assess:
1. Current volatility — normal, elevated, or extreme?
2. Risk/reward potential — is there a clear stop loss level?
3. Upcoming risk events — any major news that could cause spikes?
4. Position sizing recommendation — how much risk is appropriate?
5. Is the market conditions suitable for trading right now?

Provide your risk assessment as JSON only."""
