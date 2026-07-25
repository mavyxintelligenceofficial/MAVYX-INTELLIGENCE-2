"""
Trade Journal Intelligence Engine
Per MEIDS Chapter 13: Trade Journal Intelligence System

"The journal is not a diary. It is an AI research database.
Every trade becomes a research case."

Capabilities:
- AI Trade Review (§13.4)
- Mistake Detection Engine (§13.5)
- Strength Recognition Engine (§13.6)
- Decision Quality Score (§13.7)
"""

import json
import logging
from typing import Any
from openai import AsyncOpenAI
import os

logger = logging.getLogger(__name__)

REVIEW_PROMPT = """You are the Trade Journal Intelligence Engine for Mavyx Intelligence.

Your mission: Review every completed analysis as a research case and extract actionable intelligence.

You must evaluate:
1. Was the analysis correct?
2. Was the confidence appropriate?
3. Which agents performed well?
4. Which agents were incorrect?
5. Were risks properly identified?
6. What could be improved?
7. What patterns are emerging?

Respond with ONLY valid JSON:

{
  "decision_quality_score": <0-100>,
  "review_summary": "2-3 sentence review of the analysis quality",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "mistakes_detected": [
    {"type": "mistake_type", "description": "What went wrong", "severity": "low|medium|high"}
  ],
  "lessons_learned": ["Lesson 1", "Lesson 2"],
  "improvement_suggestions": ["Suggestion 1", "Suggestion 2"],
  "agent_performance": {
    "best_agent": "agent-name",
    "worst_agent": "agent-name",
    "notes": "Performance notes"
  },
  "pattern_detected": "Any recurring pattern detected, or null",
  "confidence_assessment": "Was the confidence appropriate? Overestimated? Underestimated?"
}

Decision Quality Score criteria:
- 90-100: Excellent analysis, strong evidence, good risk management
- 70-89: Good analysis, minor issues
- 50-69: Average analysis, some concerns
- 30-49: Below average, significant issues
- 0-29: Poor analysis, major problems"""


WEEKLY_PROMPT = """You are the Executive Performance Reviewer for Mavyx Intelligence.

Generate a weekly intelligence review based on the user's trading activity.

Respond with ONLY valid JSON:

{
  "weekly_summary": "2-3 paragraph executive summary of the week",
  "performance_score": <0-100>,
  "best_decisions": ["Best decision 1", "Best decision 2"],
  "worst_decisions": ["Worst decision 1"],
  "recurring_habits": ["Habit 1", "Habit 2"],
  "psychology_review": "Assessment of emotional discipline this week",
  "ai_accuracy": "How well did the AI perform this week",
  "risk_discipline": "How well was risk managed",
  "market_preferences": "Which pairs/sessions performed best",
  "weekly_goals": ["Goal 1 for next week", "Goal 2"],
  "strengths_to_reinforce": ["Strength 1"],
  "weaknesses_to_address": ["Weakness 1"]
}"""


class JournalEngine:
    """Trade Journal Intelligence Engine — AI-powered trade review."""

    def __init__(self):
        api_key = os.environ.get("ZAI_API_KEY")
        base_url = os.environ.get("ZAI_BASE_URL", "https://api.z.ai/api/paas/v4")
        model = os.environ.get("ZAI_MODEL", "glm-4.5-flash")

        if not api_key:
            raise RuntimeError("ZAI_API_KEY not set")

        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    async def review_analysis(self, analysis: dict) -> dict[str, Any]:
        """AI review of a completed analysis — §13.4"""
        user_prompt = f"""Review this completed analysis:

Symbol: {analysis.get('symbol', 'N/A')}
Timeframe: {analysis.get('timeframe', 'N/A')}
Recommendation: {analysis.get('recommendation', 'N/A')}
Confidence: {analysis.get('confidence', 0)}%
Executive Summary: {analysis.get('executiveSummary', 'N/A')}
Key Evidence: {json.dumps(analysis.get('keyEvidence', []))}
Risk Warnings: {json.dumps(analysis.get('riskWarnings', []))}
Agent Breakdown: {json.dumps(analysis.get('agentBreakdown', []))}

Provide a thorough review as JSON only."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": REVIEW_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.5,
                max_tokens=1000,
            )
            raw = response.choices[0].message.content
            return self._parse_json(raw)
        except Exception as e:
            logger.error(f"Journal review failed: {e}")
            return self._fallback_review()

    async def generate_weekly_review(self, journal_entries: list[dict]) -> dict[str, Any]:
        """Generate weekly intelligence review — §13.15"""
        if not journal_entries:
            return {"weekly_summary": "No analyses completed this week.", "performance_score": 0}

        entries_text = "\n".join([
            f"- {e.get('symbol', 'N/A')}: {e.get('recommendation', 'N/A')} "
            f"({e.get('confidence', 0)}%) at {e.get('timestamp', 'N/A')}"
            for e in journal_entries[:20]
        ])

        user_prompt = f"""Review this week's trading activity:

Total Analyses: {len(journal_entries)}

Analyses:
{entries_text}

Generate a weekly executive review as JSON only."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": WEEKLY_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.5,
                max_tokens=1500,
            )
            raw = response.choices[0].message.content
            return self._parse_json(raw)
        except Exception as e:
            logger.error(f"Weekly review failed: {e}")
            return {"weekly_summary": "Unable to generate review.", "performance_score": 0}

    def _parse_json(self, raw: str) -> dict:
        """Parse JSON from AI response."""
        import re
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass
        return {"review_summary": raw[:300] if raw else "No review generated"}

    def _fallback_review(self) -> dict:
        return {
            "decision_quality_score": 50,
            "review_summary": "Unable to generate AI review.",
            "strengths": [],
            "weaknesses": [],
            "mistakes_detected": [],
            "lessons_learned": [],
            "improvement_suggestions": [],
            "agent_performance": {},
            "pattern_detected": None,
            "confidence_assessment": "Unable to assess",
        }
