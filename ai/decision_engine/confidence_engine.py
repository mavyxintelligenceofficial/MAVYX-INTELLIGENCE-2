"""
Confidence Engine — Per MEIDS Chapter 3 §3.16 & Chapter 11
Calculates confidence. Never guesses.

Per MEIDS §11.2: Components of Confidence
- Technical Evidence Quality
- Fundamental Evidence Quality
- Sentiment Evidence Quality
- Liquidity Evidence Quality
- Historical Similarity
- Risk Validation
- Agent Agreement
- Data Freshness
- Data Completeness
- Contradiction Penalty
- Market Stability

"Confidence is not an opinion. It is a measurable consequence of
evidence quality, agreement, and uncertainty."
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)

# Default weights — configurable per MEIDS §11.2
DEFAULT_WEIGHTS = {
    "technical": 0.20,
    "fundamental": 0.15,
    "sentiment": 0.10,
    "liquidity": 0.15,
    "historical": 0.10,
    "risk": 0.10,
    "psychology": 0.05,
    "devils_advocate": 0.05,
    "agreement_bonus": 0.05,
    "contradiction_penalty": 0.05,
}


class ConfidenceEngine:
    """Calculates Executive Confidence Score from agent outputs.

    Per MEIDS §11.1: "Confidence is not prediction accuracy.
    Confidence is the system's assessment of how strong and reliable
    the available evidence is at the moment the analysis is performed."
    """

    def __init__(self, weights: dict[str, float] = None):
        self.weights = weights or DEFAULT_WEIGHTS

    def calculate(self, agent_results: list[dict], evidence_summary: dict) -> dict[str, Any]:
        """Calculate the Executive Confidence Score.

        Returns a detailed breakdown of how confidence was calculated.
        """
        # Map agent results by category
        agent_map = {}
        for result in agent_results:
            agent_id = result.get("agent_id", "")
            agent_map[agent_id] = result

        # Calculate component scores
        components = {}

        # Individual agent confidences weighted by importance
        weight_map = {
            "technical-analysis": "technical",
            "market-structure": "liquidity",
            "fundamentals": "fundamental",
            "sentiment": "sentiment",
            "liquidity-intelligence": "liquidity",
            "historical-pattern": "historical",
            "risk-assessment": "risk",
            "psychology": "psychology",
            "devils-advocate": "devils_advocate",
            "market-behavior": "technical",
            "recommendation": "technical",
        }

        weighted_sum = 0
        total_weight = 0

        for result in agent_results:
            agent_id = result.get("agent_id", "")
            confidence = result.get("confidence", 0)
            weight_key = weight_map.get(agent_id, "technical")
            weight = self.weights.get(weight_key, 0.10)

            components[agent_id] = {
                "confidence": confidence,
                "weight": weight,
                "weighted_score": confidence * weight,
            }

            weighted_sum += confidence * weight
            total_weight += weight

        # Base confidence from weighted agent scores
        base_confidence = weighted_sum / total_weight if total_weight > 0 else 0

        # Agreement bonus
        agreement_score = self._calculate_agreement(agent_results)
        agreement_adjustment = (agreement_score - 50) * self.weights.get("agreement_bonus", 0.05)

        # Contradiction penalty
        contradiction_score = self._calculate_contradictions(agent_results)
        contradiction_penalty = contradiction_score * self.weights.get("contradiction_penalty", 0.05) * 100

        # Missing data penalty
        missing_penalty = 0
        missing = evidence_summary.get("missing", [])
        if missing:
            missing_penalty = len(missing) * 3  # -3% per missing agent

        # Final confidence
        final_confidence = base_confidence + agreement_adjustment - contradiction_penalty - missing_penalty
        final_confidence = max(0, min(100, round(final_confidence)))

        return {
            "overall_confidence": final_confidence,
            "base_confidence": round(base_confidence, 1),
            "agreement_adjustment": round(agreement_adjustment, 1),
            "contradiction_penalty": round(contradiction_penalty, 1),
            "missing_penalty": missing_penalty,
            "agreement_score": agreement_score,
            "contradiction_score": contradiction_score,
            "components": components,
            "evidence_quality": evidence_summary.get("overall_evidence_quality", "unknown"),
        }

    def _calculate_agreement(self, agent_results: list[dict]) -> float:
        """Calculate how much agents agree (0-100)."""
        if not agent_results:
            return 0

        signals = [r.get("signal", "neutral") for r in agent_results]
        bullish = signals.count("bullish")
        bearish = signals.count("bearish")
        total = len(signals)

        # Agreement = percentage of the dominant signal
        dominant = max(bullish, bearish, signals.count("neutral"))
        return round((dominant / total) * 100) if total > 0 else 0

    def _calculate_contradictions(self, agent_results: list[dict]) -> float:
        """Calculate contradiction level (0-1). Higher = more contradictions."""
        if not agent_results:
            return 0

        signals = [r.get("signal", "neutral") for r in agent_results]
        bullish = signals.count("bullish")
        bearish = signals.count("bearish")
        total = len(signals)

        if total == 0:
            return 0

        # Contradiction = how split the signals are
        if bullish > 0 and bearish > 0:
            # Both bullish and bearish signals exist
            minority = min(bullish, bearish)
            return round(minority / total, 2)

        return 0.0

    def get_consensus(self, agent_results: list[dict]) -> dict[str, int]:
        """Get consensus counts."""
        counts = {"bullish": 0, "bearish": 0, "neutral": 0}
        for r in agent_results:
            signal = r.get("signal", "neutral")
            if signal in counts:
                counts[signal] += 1
        return counts
