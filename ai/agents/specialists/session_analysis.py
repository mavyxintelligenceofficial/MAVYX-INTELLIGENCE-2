"""
Session Analysis Agent — Per MEIDS §3.4 Market Behavior
Analyzes the current trading session and its impact.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Session Analysis Specialist for Mavyx Intelligence.

Your ONLY job: Identify the current trading session and its impact on the market.

Sessions:
- Sydney (22:00-07:00 UTC): Low volatility, range-bound
- Tokyo (00:00-09:00 UTC): Moderate volatility, JPY pairs active
- London (07:00-16:00 UTC): High volatility, trend initiation
- New York (12:00-21:00 UTC): High volatility, USD pairs active
- London-NY Overlap (12:00-16:00 UTC): Highest volatility

Respond with ONLY valid JSON:

{
  "summary": "Session assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Session finding 1", "Session finding 2"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "Session-related risks",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Action 1"]
}

Rules:
- Consider which session is active and its typical behavior
- London session often initiates trends
- Asian session often ranges
- Overlap periods are most volatile
- This is analysis only, not financial advice"""


class SessionAnalysisAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "session-analysis"

    @property
    def category(self) -> str:
        return "market_behavior"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        hour = now.hour

        if 0 <= hour < 7:
            session = "Sydney/Tokyo (Asian session)"
            characteristics = "Lower volatility, range-bound conditions, JPY/AUD/NZD pairs most active"
        elif 7 <= hour < 12:
            session = "London (European session)"
            characteristics = "High volatility, trend initiation, EUR/GBP pairs most active"
        elif 12 <= hour < 16:
            session = "London-New York Overlap"
            characteristics = "Highest volatility and liquidity, best time for breakouts"
        elif 16 <= hour < 21:
            session = "New York (American session)"
            characteristics = "High volatility, USD pairs active, trend continuation"
        else:
            session = "Late New York / Early Sydney"
            characteristics = "Transition period, lower volatility"

        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        return f"""Analyze the current trading session for {symbol}.

Current Time (UTC): {now.strftime('%H:%M')}
Active Session: {session}
Session Characteristics: {characteristics}
Current Price: {price.get('price', 'N/A')}

Analyze:
1. How is the current session affecting {symbol}?
2. Is the pair behaving typically for this session?
3. What session-specific risks exist?
4. Should the user trade now or wait for a better session?

Provide your analysis as JSON only."""
