"""
Executive Synthesis Agent — Synthesis Agent #12

The ONLY agent allowed to write prose.
Combines outputs of agents 1-11. Cannot introduce any claim not traceable 
to a specific specialist's output.

Per Rebuild Spec Section 3:
- Receives ONLY structured JSON outputs as input
- Every bull_case/bear_case must tag which specialist it came from
- Cannot smooth over missing data with generic commentary
- If quorum isn't met, returns insufficient_data immediately
"""

import json
import re
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

EXECUTIVE_SYSTEM_PROMPT = """You are the Executive Synthesis Agent for Mavyx Intelligence.

YOUR ROLE: You aggregate pre-computed structured outputs from specialist agents into a final recommendation. You are the ONLY agent allowed to write prose.

STRICT RULES:
1. You may NOT state any fact, price level, or piece of reasoning that does not appear in the JSON you were given.
2. If fewer than 7 of the 10 specialist agents returned data_sufficient=true, you must say so explicitly and lower your confidence accordingly.
3. Every bull_case and bear_case entry must literally tag which specialist agent it came from — format: "point description (agent: agent_name)"
4. You cannot smooth over missing data with generic market commentary.
5. Never use absolute language ("will", "guaranteed", "certain"). Use probabilistic framing.
6. Never produce trade execution instructions or position sizing.

REQUIRED OUTPUT FORMAT — return ONLY valid JSON:
{
  "recommendation": "buy | sell | wait | no_trade",
  "confidence": 0.0,
  "agents_reporting": 10,
  "agents_data_sufficient": 7,
  "bull_case": ["point 1 (agent: order_blocks)", "point 2 (agent: liquidity)"],
  "bear_case": ["point 1 (agent: change_of_character)"],
  "risk_assessment": "string, must cite specific invalidation_levels agent output",
  "invalidation_price": 1.1345,
  "recommended_scenario": "string",
  "alternative_scenario": "string"
}

DECISION RULES:
- "buy" = strong bullish consensus (7+ agents bullish) with high confidence
- "sell" = strong bearish consensus (7+ agents bearish) with high confidence  
- "wait" = mixed signals or moderate confidence
- "no_trade" = poor conditions, conflicting signals, very low confidence, or quorum not met
- If average confidence of sufficient agents is below 40%, recommend "wait" or "no_trade"
- Always include risk_warnings
- Always be transparent about conflicting evidence
- This is analysis only, not financial advice"""


def build_synthesis_prompt(symbol: str, timeframe: str, specialist_outputs: list[dict], quorum_met: bool, agents_reporting: int, agents_sufficient: int) -> str:
    """Build the prompt for Executive Synthesis from specialist outputs."""
    
    reports = ""
    for output in specialist_outputs:
        agent_name = output.get("agent", "unknown")
        bias = output.get("bias", "neutral")
        confidence = output.get("confidence", 0)
        key_levels = output.get("key_levels", [])
        reasoning = output.get("reasoning", "No reasoning provided")
        sufficient = output.get("data_sufficient", False)
        
        levels_str = ", ".join([f"{l.get('type','?')} {l.get('price','?')} ({l.get('strength','?')})" for l in key_levels[:3]])
        
        reports += f"""
=== {agent_name.upper()} ===
Bias: {bias} (Confidence: {confidence})
Data Sufficient: {sufficient}
Key Levels: {levels_str if levels_str else 'None'}
Reasoning: {reasoning}
---"""
    
    quorum_note = ""
    if not quorum_met:
        quorum_note = f"\n\n⚠️ QUORUM NOT MET: Only {agents_sufficient}/{agents_reporting} agents returned sufficient data. You MUST set recommendation to 'no_trade' and explain why in risk_assessment."
    
    return f"""Synthesize the following specialist reports for {symbol} ({timeframe} timeframe).

AGENTS REPORTING: {agents_reporting}/10
AGENTS WITH SUFFICIENT DATA: {agents_sufficient}/10
QUORUM MET: {'Yes' if quorum_met else 'No'}{quorum_note}

SPECIALIST REPORTS:
{reports}

Based on these specialist analyses, produce your executive synthesis as JSON only.
Remember: every bull_case/bear_case entry must tag which agent it came from."""


def parse_executive_response(raw: str) -> dict[str, Any]:
    """Parse the AI's JSON response for executive synthesis."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    
    return {"recommendation": "wait", "confidence": 0, "executive_summary": raw[:500] if raw else "Synthesis failed"}


def create_fallback_synthesis(consensus: dict, avg_confidence: float, agents_reporting: int, agents_sufficient: int) -> dict:
    """Fallback when AI synthesis fails — use consensus math."""
    if consensus.get("bullish", 0) > consensus.get("bearish", 0):
        rec = "buy" if avg_confidence > 0.6 else "wait"
    elif consensus.get("bearish", 0) > consensus.get("bullish", 0):
        rec = "sell" if avg_confidence > 0.6 else "wait"
    else:
        rec = "wait"
    
    return {
        "recommendation": rec,
        "confidence": avg_confidence,
        "agents_reporting": agents_reporting,
        "agents_data_sufficient": agents_sufficient,
        "bull_case": [f"{consensus.get('bullish',0)} agents bullish (consensus math)"],
        "bear_case": [f"{consensus.get('bearish',0)} agents bearish (consensus math)"],
        "risk_assessment": "AI synthesis unavailable — using consensus math. Confidence is lower than normal.",
        "invalidation_price": None,
        "recommended_scenario": "Wait for clearer signals",
        "alternative_scenario": "Re-run analysis when AI synthesis is available",
    }
