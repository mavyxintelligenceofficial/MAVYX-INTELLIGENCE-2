"""
Recommendation Intelligence Specialist Agent.

Per Volume IV §2.4 — Recommendation Intelligence Agents category:
Responsible for transforming analytical evidence into actionable insights.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Recommendation Intelligence Specialist for Mavyx Intelligence, an AI-powered Forex market intelligence platform.

Your role: Based on the combined analytical inputs from other specialists, determine optimal entry, exit, stop loss, and take profit levels.

IMPORTANT: Respond with ONLY valid JSON. No text before or after. Use this exact format:

{
  "summary": "One paragraph trade recommendation summary",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "key_findings": [
    "Finding 1 about optimal entry/exit",
    "Finding 2"
  ],
  "evidence": [
    "Evidence point 1 with specific price levels",
    "Evidence point 2"
  ],
  "risk_assessment": "Risk assessment for the recommended setup",
  "assumptions": [
    "Assumption 1"
  ],
  "limitations": [
    "Limitation 1"
  ],
  "suggested_actions": [
    "Entry: [price level]",
    "Stop Loss: [price level]",
    "Take Profit 1: [price level]",
    "Take Profit 2: [price level]"
  ]
}

Rules:
- Signal must be exactly "bullish", "bearish", or "neutral"
- Confidence must be an integer 0-100
- Provide specific price levels for entry, stop loss, and take profit
- Calculate risk/reward ratio
- Consider the overall consensus from other agents
- If signals conflict, recommend "wait" or "neutral"
- This is analysis only, not financial advice"""


class RecommendationAgent(BaseAgent):
    """Recommendation specialist — determines entry/exit/SL/TP levels."""

    @property
    def name(self) -> str:
        return "recommendation"

    @property
    def category(self) -> str:
        return "recommendation"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(
        self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h"
    ) -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])
        agent_results = market_data.get("agent_results", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}"

        # Include other agents' findings
        agents_text = ""
        if agent_results:
            agents_text = "\nSpecialist Agent Findings:\n"
            for result in agent_results:
                agents_text += f"""
--- {result.get('agent_id', 'Unknown')} ---
Signal: {result.get('signal', 'N/A')} (Confidence: {result.get('confidence', 'N/A')}%)
Summary: {result.get('summary', 'N/A')}
Key Findings: {', '.join(result.get('key_findings', []))}
"""

        # Recent candles for level identification
        candles_text = ""
        if candles:
            recent = candles[-10:]
            candles_text = f"\nRecent Candles ({timeframe}):\n"
            for i, c in enumerate(recent):
                candles_text += (
                    f"  [{i+1}] O:{c.get('open')} H:{c.get('high')} "
                    f"L:{c.get('low')} C:{c.get('close')}\n"
                )

        return f"""Based on the following specialist analyses, provide a trade recommendation for {symbol}.

{price_text}
{agents_text}
{candles_text}

Determine:
1. Overall direction (based on specialist consensus)
2. Optimal entry zone (price range)
3. Stop loss level (based on structure)
4. Take profit targets (TP1, TP2)
5. Risk/reward ratio
6. Whether to trade now or wait

Provide your recommendation as JSON only."""
