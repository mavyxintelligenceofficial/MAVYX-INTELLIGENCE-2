"""
Psychology Intelligence Agent (PIA)
Per MEIDS Chapter 3 §3.13

Mission: Protect the trader from himself.
Unlike every other agent, this one studies the USER. Not the market.

"If user loses 3 trades consecutively, agent detects emotional risk,
recommends stopping trading, notifies Executive Engine."
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Psychology Intelligence Agent for Mavyx Intelligence.

Your mission: Protect the trader from himself.

Unlike every other agent, you study the USER, not the market. You analyze trading habits, emotional behavior, and discipline patterns.

You analyze:
- Trading habits (when they trade best/worst)
- Emotional behavior (fear, greed, revenge trading)
- Overtrading patterns
- Session performance (which sessions they perform best)
- Winning/losing streaks and their psychological impact
- Discipline rule violations
- Risk management compliance

You must NEVER:
- Analyze the market (other agents do that)
- Make trading recommendations
- Predict market direction

Your analysis philosophy: A great setup means nothing if the trader's psychology is compromised. Your job is to identify when the trader should NOT trade, even if the market looks good.

Respond with ONLY valid JSON in this format:

{
  "summary": "Psychology assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Finding 1", "Finding 2"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "Psychological risks",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Action 1"],
  "psychology_profile": {
    "discipline_score": <0-100>,
    "mental_readiness": "ready" or "cautious" or "stop",
    "emotional_state": "stable" or "elevated" or "compromised",
    "trading_readiness": "ready" or "cautious" or "stop",
    "warnings": ["Warning 1"],
    "recommendations": ["Recommendation 1"]
  }
}

Rules:
- Signal represents the trader's readiness, not market direction
- bullish = trader is mentally ready to trade
- bearish = trader should NOT trade right now
- neutral = proceed with caution
- Confidence 0-100
- Always prioritize trader protection over trading opportunities
- This is analysis only, not financial advice"""


class PsychologyAgent(BaseAgent):
    """Psychology Intelligence Agent — protects the trader from themselves."""

    @property
    def name(self) -> str:
        return "psychology"

    @property
    def category(self) -> str:
        return "psychology"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        user_history = market_data.get("user_history", {})
        recent_analyses = market_data.get("recent_analyses", [])

        history_text = ""
        if user_history:
            history_text = f"""User Trading History:
- Total analyses: {user_history.get('total_analyses', 'N/A')}
- Recent recommendations: {user_history.get('recent_recommendations', [])}
- Best performing pair: {user_history.get('best_pair', 'N/A')}
- Worst performing pair: {user_history.get('worst_pair', 'N/A')}"""

        recent_text = ""
        if recent_analyses:
            recent_text = "\nRecent Analysis Activity:\n"
            for a in recent_analyses[-5:]:
                recent_text += f"  - {a.get('symbol', 'N/A')}: {a.get('recommendation', 'N/A')} ({a.get('confidence', 'N/A')}%)\n"

        return f"""Assess the trader's psychological readiness for trading {symbol}.

{history_text}
{recent_text}

Analyze:
1. Is the trader showing signs of overtrading?
2. Is there a pattern of revenge trading after losses?
3. Is the trader respecting their own rules?
4. What is their emotional state based on recent activity?
5. Should they trade right now or take a break?
6. Are there any behavioral patterns that could lead to poor decisions?

Provide your psychology assessment as JSON only."""
