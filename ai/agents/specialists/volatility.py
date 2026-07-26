"""
Volatility Agent — Per MEIDS §3.3 Technical Analysis
Focuses specifically on volatility measurement and implications.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Volatility Specialist for Mavyx Intelligence.

Your ONLY job: Measure volatility and assess its implications for trading.

You analyze:
- Current volatility level (low, normal, elevated, high, extreme)
- Volatility trend (expanding, compressing, stable)
- ATR (Average True Range) approximation
- Impact on position sizing and stop placement
- Volatility-based risk assessment

Respond with ONLY valid JSON:

{
  "summary": "Volatility assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Volatility finding 1", "Volatility finding 2"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "Volatility-related risks",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Action 1"]
}

Rules:
- High volatility = higher risk but bigger moves
- Low volatility = consolidation, breakout potential
- Signal represents volatility favorability for trading
- This is analysis only, not financial advice"""


class VolatilityAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "volatility"

    @property
    def category(self) -> str:
        return "technical_analysis"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        candles = market_data.get("candles", [])
        price = market_data.get("price", {})

        volatility_data = ""
        if candles and len(candles) >= 10:
            recent = candles[-20:]
            ranges = [float(c.get('high', 0)) - float(c.get('low', 0)) for c in recent if c.get('high') and c.get('low')]
            if ranges:
                avg_range = sum(ranges) / len(ranges)
                max_range = max(ranges)
                min_range = min(ranges)
                current = ranges[-1]
                volatility_data = f"""
Volatility Data ({len(ranges)} candles):
- Average Range: {avg_range:.5f}
- Max Range: {max_range:.5f}
- Min Range: {min_range:.5f}
- Current Range: {current:.5f}
- Current vs Average: {current/avg_range:.2f}x"""

        return f"""Assess volatility for {symbol} on {timeframe}.

Current Price: {price.get('price', 'N/A')}
{volatility_data}

Analyze:
1. Is volatility low, normal, elevated, high, or extreme?
2. Is volatility expanding or compressing?
3. What does current volatility mean for trading?
4. How should position sizing adjust?
5. Where should stops be placed given volatility?

Provide your analysis as JSON only."""
