"""
Executive Decision Engine — synthesizes all specialist agent outputs.

Per Volume IV:
- Level 3 — Executive Intelligence: Coordinates specialist outputs
  and constructs unified recommendations.
- Section 1.3: Intelligence Philosophy — "Evidence Before Confidence"
- Section 1.7: Cognitive Decision Process (Stages 6-12)

The engine:
1. Receives all agent outputs
2. Counts signal consensus (bullish/bearish/neutral)
3. Calculates weighted confidence based on agent agreement
4. Identifies conflicts between agents
5. Uses AI to generate an executive summary
6. Compiles evidence and risk warnings
7. Produces the final recommendation: Buy / Sell / Wait / No Trade
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from agents.base_agent import AgentOutput

logger = logging.getLogger(__name__)

EXECUTIVE_SYSTEM_PROMPT = """You are the Executive Decision Engine for Mavyx Intelligence, an AI-powered Forex market intelligence platform.

Your role: You are the senior analyst who reads reports from multiple specialist agents and produces a final, unified recommendation.

IMPORTANT: Respond with ONLY valid JSON. No text before or after. Use this exact format:

{
  "recommendation": "buy" or "sell" or "wait" or "no_trade",
  "executive_summary": "2-3 paragraph executive summary explaining the reasoning, evidence, and recommendation in clear language",
  "key_evidence": [
    "Strongest evidence point 1",
    "Strongest evidence point 2",
    "Strongest evidence point 3"
  ],
  "risk_warnings": [
    "Risk warning 1",
    "Risk warning 2"
  ],
  "suggested_action": {
    "direction": "long" or "short" or "none",
    "entry_zone": "price range or N/A",
    "stop_loss": "price level or N/A",
    "take_profit_1": "price level or N/A",
    "take_profit_2": "price level or N/A",
    "risk_note": "Risk management note"
  }
}

Decision Rules:
- "buy" = strong bullish consensus with high confidence
- "sell" = strong bearish consensus with high confidence
- "wait" = mixed signals or moderate confidence — wait for clearer setup
- "no_trade" = poor conditions, conflicting signals, or very low confidence
- If fewer than 3 agents agree on a direction, recommend "wait"
- If average confidence is below 50%, recommend "wait" or "no_trade"
- Always include risk warnings
- Always be transparent about conflicting evidence
- This is analysis only, not financial advice"""


class ExecutiveDecisionEngine:
    """Synthesizes specialist agent outputs into a final recommendation.

    Per Volume IV §1.3: "Confidence shall never be estimated arbitrarily.
    Every confidence score must emerge from measurable evidence."
    """

    def __init__(self, provider: Any):
        self.provider = provider

    async def synthesize(
        self,
        symbol: str,
        timeframe: str,
        agent_results: list[AgentOutput],
        model: Optional[str] = None,
    ) -> dict[str, Any]:
        """Produce the final recommendation from all agent outputs.

        Per Vol. IV §1.7 Cognitive Decision Process:
        Stage 6: Executive Intelligence evaluates all reports
        Stage 7: Conflicting opinions analyzed
        Stage 8: Confidence calculated
        Stage 9: Risk assessment completed
        Stage 10: Recommendation generated
        Stage 11: Explainability information produced
        """
        logger.info(
            f"Executive synthesis for {symbol}: {len(agent_results)} agents"
        )

        # Step 1: Calculate consensus statistics
        consensus = self._calculate_consensus(agent_results)
        avg_confidence = self._calculate_weighted_confidence(agent_results)

        # Step 2: Build the synthesis prompt
        user_prompt = self._build_synthesis_prompt(
            symbol, timeframe, agent_results, consensus, avg_confidence
        )

        # Step 3: Call AI for executive synthesis
        try:
            raw_response = await self.provider.generate(
                system_prompt=EXECUTIVE_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                model=model,
            )
            parsed = self._parse_response(raw_response)
        except Exception as e:
            logger.error(f"Executive AI synthesis failed: {e}")
            parsed = self._fallback_synthesis(consensus, avg_confidence)

        # Step 4: Build the final response
        recommendation = self._validate_recommendation(
            parsed.get("recommendation", "wait")
        )

        # Override if consensus is very weak
        if recommendation in ("buy", "sell") and avg_confidence < 40:
            recommendation = "wait"
            parsed["risk_warnings"] = parsed.get("risk_warnings", []) + [
                "Confidence too low for directional recommendation"
            ]

        result = {
            "symbol": symbol,
            "timeframe": timeframe,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "recommendation": recommendation,
            "confidence": avg_confidence,
            "executive_summary": parsed.get(
                "executive_summary", "Analysis completed."
            ),
            "agent_consensus": consensus,
            "agent_breakdown": [
                {
                    "agent_id": r.agent_id,
                    "signal": r.signal,
                    "confidence": r.confidence,
                    "summary": r.summary,
                }
                for r in agent_results
            ],
            "key_evidence": parsed.get("key_evidence", []),
            "risk_warnings": parsed.get("risk_warnings", []),
            "suggested_action": parsed.get("suggested_action", {}),
            "full_agent_outputs": [r.to_dict() for r in agent_results],
        }

        logger.info(
            f"Executive result: {recommendation} (confidence: {avg_confidence}%)"
        )
        return result

    def _calculate_consensus(
        self, results: list[AgentOutput]
    ) -> dict[str, int]:
        """Count how many agents are bullish, bearish, neutral."""
        counts = {"bullish": 0, "bearish": 0, "neutral": 0}
        for r in results:
            signal = r.signal.lower()
            if signal in counts:
                counts[signal] += 1
        return counts

    def _calculate_weighted_confidence(
        self, results: list[AgentOutput]
    ) -> int:
        """Calculate average confidence, weighted by signal strength.

        Per Vol. IV §1.3: Confidence must emerge from measurable evidence:
        - Agreement between specialists
        - Signal consistency
        - Data completeness
        """
        if not results:
            return 0

        # Filter out error results (confidence 0)
        valid = [r for r in results if r.confidence > 0]
        if not valid:
            return 0

        # Simple average of valid confidences
        avg = sum(r.confidence for r in valid) / len(valid)

        # Bonus for agreement: if most agents agree, boost confidence
        consensus = self._calculate_consensus(results)
        total = sum(consensus.values())
        if total > 0:
            max_agreement = max(consensus.values()) / total
            if max_agreement >= 0.7:  # 70%+ agreement
                avg = min(100, avg * 1.1)

        return round(avg)

    def _build_synthesis_prompt(
        self,
        symbol: str,
        timeframe: str,
        results: list[AgentOutput],
        consensus: dict[str, int],
        avg_confidence: int,
    ) -> str:
        """Build the prompt for the executive AI synthesis."""

        agent_reports = ""
        for r in results:
            findings = "\n".join(f"    - {f}" for f in r.key_findings[:5])
            evidence = "\n".join(f"    - {e}" for e in r.evidence[:3])
            agent_reports += f"""
=== {r.agent_id.upper()} ===
Signal: {r.signal} (Confidence: {r.confidence}%)
Summary: {r.summary}
Key Findings:
{findings}
Evidence:
{evidence}
Risk: {r.risk_assessment}
---
"""

        return f"""Analyze the following specialist reports for {symbol} ({timeframe} timeframe) and produce a final recommendation.

CONSENSUS SUMMARY:
- Bullish agents: {consensus['bullish']}
- Bearish agents: {consensus['bearish']}
- Neutral agents: {consensus['neutral']}
- Average confidence: {avg_confidence}%

SPECIALIST REPORTS:
{agent_reports}

Based on these specialist analyses:
1. What is the overall recommendation (buy/sell/wait/no_trade)?
2. What is the strongest evidence supporting this?
3. What are the key risks and warnings?
4. What specific action levels (entry, stop loss, take profit) are suggested?

Provide your executive synthesis as JSON only."""

    def _parse_response(self, raw: str) -> dict[str, Any]:
        """Parse the AI's JSON response."""
        import re

        # Try direct parse
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Try markdown code block
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        # Try to find JSON object
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        return {"executive_summary": raw[:500] if raw else "Synthesis failed"}

    def _fallback_synthesis(
        self, consensus: dict[str, int], avg_confidence: int
    ) -> dict[str, Any]:
        """Fallback when AI synthesis fails — use consensus math."""
        if consensus["bullish"] > consensus["bearish"]:
            rec = "buy" if avg_confidence > 60 else "wait"
        elif consensus["bearish"] > consensus["bullish"]:
            rec = "sell" if avg_confidence > 60 else "wait"
        else:
            rec = "wait"

        return {
            "recommendation": rec,
            "executive_summary": (
                f"Based on {consensus['bullish']} bullish, "
                f"{consensus['bearish']} bearish, and "
                f"{consensus['neutral']} neutral signals with "
                f"average confidence {avg_confidence}%. "
                f"AI synthesis was unavailable — using consensus math."
            ),
            "key_evidence": [],
            "risk_warnings": ["Executive AI synthesis was unavailable"],
            "suggested_action": {},
        }

    @staticmethod
    def _validate_recommendation(rec: str) -> str:
        """Ensure recommendation is valid."""
        valid = {"buy", "sell", "wait", "no_trade"}
        rec = rec.lower().strip()
        return rec if rec in valid else "wait"
