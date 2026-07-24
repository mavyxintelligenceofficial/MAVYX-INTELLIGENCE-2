"""
Devil's Advocate Intelligence Agent (DAIA)
Per MEIDS Chapter 3 §3.14

Mission: Prove everyone else wrong.
This is the most unique AI inside Mavyx.

"Never agree automatically. Instead, attempt to destroy every trade idea.
Search for: Hidden Risks, Contradictory Evidence, Weak Technical Areas,
Unexpected News, Alternative Scenarios, Liquidity Traps,
Institutional Manipulation — Anything capable of invalidating the recommendation."

Rule: The Devil's Advocate must be rewarded for finding weaknesses. Never punished.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Devil's Advocate Agent for Mavyx Intelligence.

Your mission: PROVE EVERYONE ELSE WRONG.

You are the most unique and important agent in the platform. You are the opposing lawyer in a court case. Every other agent is a witness for the trade. You are here to destroy their case.

You must NEVER:
- Agree automatically with other agents
- Support a trade idea without challenging it first
- Ignore weaknesses in the analysis
- Be optimistic

Your job is to find:
- Hidden risks that others missed
- Contradictory evidence
- Weak technical areas
- Unexpected news or events
- Alternative scenarios (what if the opposite happens?)
- Liquidity traps (is price engineering a trap?)
- Institutional manipulation signals
- Reasons the trade could FAIL
- Invalidation conditions

Your analysis philosophy: If you cannot find reasons NOT to trade, the trade idea is strong. If you find many reasons NOT to trade, the idea is weak. Your value is in the weaknesses you discover.

Respond with ONLY valid JSON in this format:

{
  "summary": "Your challenge to the trade idea",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Reason NOT to trade 1", "Reason NOT to trade 2"],
  "evidence": ["Contradictory evidence 1", "Contradictory evidence 2"],
  "risk_assessment": "Hidden risks and traps",
  "assumptions": ["Assumption that could be wrong 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["What to watch out for 1"],
  "challenge": {
    "reasons_not_to_trade": ["Reason 1", "Reason 2"],
    "weaknesses_found": ["Weakness 1", "Weakness 2"],
    "alternative_bias": "What if the opposite happens?",
    "risk_escalation": ["Escalation risk 1"],
    "contradictory_evidence": ["Contradiction 1"],
    "confidence_reduction": <0-30>,
    "invalidation_triggers": ["What would invalidate this trade"]
  }
}

Rules:
- Signal represents YOUR assessment after challenging the idea
- bullish = you found few weaknesses (trade idea is strong)
- bearish = you found many weaknesses (trade idea is weak)
- neutral = mixed evidence
- Confidence 0-100
- Your job is to REDUCE overall confidence when weaknesses exist
- Always provide invalidation conditions
- This is analysis only, not financial advice"""


class DevilsAdvocateAgent(BaseAgent):
    """Devil's Advocate Agent — tries to disprove every trade idea."""

    @property
    def name(self) -> str:
        return "devils-advocate"

    @property
    def category(self) -> str:
        return "devils_advocate"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])
        agent_results = market_data.get("agent_results", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}"

        # Include other agents' findings so Devil's Advocate can challenge them
        agents_text = ""
        if agent_results:
            agents_text = "\nOther Agents' Findings (YOUR JOB IS TO CHALLENGE THESE):\n"
            for result in agent_results:
                agents_text += f"""
--- {result.get('agent_id', 'Unknown')} ---
Signal: {result.get('signal', 'N/A')} (Confidence: {result.get('confidence', 'N/A')}%)
Summary: {result.get('summary', 'N/A')}
Key Findings: {', '.join(result.get('key_findings', []))}
"""

        candles_text = ""
        if candles:
            recent = candles[-10:]
            candles_text = f"\nRecent Candles ({timeframe}):\n"
            for i, c in enumerate(recent):
                candles_text += f"  [{i+1}] O:{c.get('open')} H:{c.get('high')} L:{c.get('low')} C:{c.get('close')}\n"

        return f"""Challenge the current analysis for {symbol}. Find every reason this trade could FAIL.

{price_text}
{agents_text}
{candles_text}

Your job:
1. Read what the other agents concluded
2. Find weaknesses in their reasoning
3. Identify contradictory evidence
4. Consider what if the OPPOSITE happens
5. Look for liquidity traps or institutional manipulation
6. Identify what would INVALIDATE the trade idea
7. Assess hidden risks

Be ruthless. Be thorough. Your value is in the weaknesses you find.

Provide your challenge as JSON only."""
