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

YOUR ROLE: You write the narrative explanation around numbers that have ALREADY been
computed by the Consensus Engine and Risk Management Engine (code, not you). You are
the ONLY agent allowed to write prose. You do NOT calculate confidence or make the
final recommendation call — those are supplied to you as CONSENSUS DATA and RISK GATE
RESULT in the prompt. Your "confidence" and "recommendation" fields are a sanity check
only; the orchestrator will override them with the code-computed, risk-adjusted values
if they differ. Do not fight the provided numbers — narrate why they make sense.

STRICT RULES:
1. You may NOT state any fact, price level, or piece of reasoning that does not appear in the JSON you were given.
2. If the RISK GATE RESULT says quorum was not met or a recommendation is forced, you must reflect that explicitly and explain why in risk_assessment.
3. Every bull_case and bear_case entry must literally tag which specialist agent it came from — format: "point description (agent: agent_name)"
4. You cannot smooth over missing data with generic market commentary.
5. Never use absolute language ("will", "guaranteed", "certain"). Use probabilistic framing.
6. Never produce trade execution instructions or position sizing.
7. If a DEVIL'S ADVOCATE CHALLENGE is present in the prompt, you must include it verbatim as a bear_case entry — you may not soften, omit, or argue it away.

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
- Follow the provided CONSENSUS DATA and RISK GATE RESULT — do not override them with your own read of the specialist reports.
- Always include risk_warnings
- Always be transparent about conflicting evidence
- This is analysis only, not financial advice"""


def build_synthesis_prompt(symbol: str, timeframe: str, specialist_outputs: list[dict], quorum_met: bool, agents_reporting: int, agents_sufficient: int, risk_context: Optional[dict] = None) -> str:
    """Build the prompt for Executive Synthesis from specialist outputs.

    risk_context, when provided, carries the code-computed Consensus Engine
    and Risk Management Engine results (see decision_engine/consensus_engine.py
    and decision_engine/risk_engine.py) — the LLM must narrate around these
    numbers, not invent its own.
    """
    
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

    risk_section = ""
    if risk_context:
        consensus = risk_context.get("consensus", {})
        gate = risk_context.get("gate", {})
        risk_section = f"""

CONSENSUS DATA (computed by code, not you — treat as ground truth):
Majority bias: {consensus.get('majority_bias')}
Agreement ratio: {consensus.get('agreement_ratio')}
Average specialist confidence: {consensus.get('avg_specialist_confidence')}
Disagreement detected: {consensus.get('disagreement')}

RISK GATE RESULT (computed by code — your confidence/recommendation MUST match this):
Final risk-adjusted confidence: {gate.get('final_confidence')}
Forced recommendation (if any): {gate.get('forced_recommendation') or 'none — use your judgment within the consensus data'}
Risk flags: {gate.get('risk_flags') or 'none'}
DEVIL'S ADVOCATE CHALLENGE (must appear verbatim in bear_case if non-empty): {gate.get('devils_advocate_challenge') or 'none reported'}"""
    
    return f"""Synthesize the following specialist reports for {symbol} ({timeframe} timeframe).

AGENTS REPORTING: {agents_reporting}
AGENTS WITH SUFFICIENT DATA: {agents_sufficient}
QUORUM MET: {'Yes' if quorum_met else 'No'}{quorum_note}
{risk_section}

SPECIALIST REPORTS:
{reports}

Based on these specialist analyses and the consensus/risk gate data above, produce your executive synthesis as JSON only.
Remember: every bull_case/bear_case entry must tag which agent it came from, and your confidence/recommendation must match the Risk Gate Result."""


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


def create_fallback_synthesis(consensus: dict, avg_confidence: float, agents_reporting: int, agents_sufficient: int, risk_context: Optional[dict] = None) -> dict:
    """Fallback when AI synthesis fails — use consensus math and the risk gate directly."""
    gate = (risk_context or {}).get("gate", {})
    forced = gate.get("forced_recommendation")

    if forced:
        rec = forced
    elif consensus.get("bullish", 0) > consensus.get("bearish", 0):
        rec = "buy" if avg_confidence > 0.6 else "wait"
    elif consensus.get("bearish", 0) > consensus.get("bullish", 0):
        rec = "sell" if avg_confidence > 0.6 else "wait"
    else:
        rec = "wait"

    final_confidence = gate.get("final_confidence", avg_confidence)

    bear_case = [f"{consensus.get('bearish',0)} agents bearish (consensus math)"]
    for flag in gate.get("risk_flags", []):
        bear_case.append(flag)
    if gate.get("devils_advocate_challenge"):
        bear_case.append(f"{gate['devils_advocate_challenge']} (agent: devils_advocate)")

    return {
        "recommendation": rec,
        "confidence": final_confidence,
        "agents_reporting": agents_reporting,
        "agents_data_sufficient": agents_sufficient,
        "bull_case": [f"{consensus.get('bullish',0)} agents bullish (consensus math)"],
        "bear_case": bear_case,
        "risk_assessment": "AI synthesis unavailable — using consensus math and the Risk Management Engine directly. Confidence is lower than normal.",
        "invalidation_price": None,
        "recommended_scenario": "Wait for clearer signals" if rec in ("wait", "no_trade") else f"Consider {rec} per consensus math",
        "alternative_scenario": "Re-run analysis when AI synthesis is available",
    }
