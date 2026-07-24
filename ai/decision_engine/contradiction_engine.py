"""
Contradiction Detection Engine — Per MEIDS Chapter 9 §9.10

"One of the most important systems."

The platform continuously checks for contradictions.
Examples:
- Technical says Bullish, Fundamental says Bearish
- Sentiment is optimistic while liquidity suggests a probable stop hunt
- Historical patterns support continuation while risk analysis identifies
  unacceptable exposure

"The system never hides disagreement. Disagreement is valuable intelligence."
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class Contradiction:
    """A detected contradiction between agents."""

    def __init__(self, agent_a: str, signal_a: str, agent_b: str, signal_b: str,
                 severity: str, description: str):
        self.agent_a = agent_a
        self.signal_a = signal_a
        self.agent_b = agent_b
        self.signal_b = signal_b
        self.severity = severity  # minor, moderate, major, critical
        self.description = description

    def to_dict(self) -> dict:
        return {
            "agent_a": self.agent_a,
            "signal_a": self.signal_a,
            "agent_b": self.agent_b,
            "signal_b": self.signal_b,
            "severity": self.severity,
            "description": self.description,
        }


class ContradictionEngine:
    """Detects contradictions between specialist agents.

    Per MEIDS §9.10: "Contradictions are valuable. The system must
    actively search for conflicting conclusions."
    """

    def detect(self, agent_results: list[dict]) -> dict[str, Any]:
        """Detect all contradictions between agent results."""
        contradictions = []

        # Compare every pair of agents
        for i, a in enumerate(agent_results):
            for j, b in enumerate(agent_results):
                if i >= j:
                    continue

                signal_a = a.get("signal", "neutral")
                signal_b = b.get("signal", "neutral")

                # Skip if either is neutral
                if signal_a == "neutral" or signal_b == "neutral":
                    continue

                # Check for direct contradiction (bullish vs bearish)
                if signal_a != signal_b:
                    severity = self._assess_severity(a, b)
                    desc = self._describe_contradiction(a, b)

                    contradictions.append(Contradiction(
                        agent_a=a.get("agent_id", "unknown"),
                        signal_a=signal_a,
                        agent_b=b.get("agent_id", "unknown"),
                        signal_b=signal_b,
                        severity=severity,
                        description=desc,
                    ))

        # Calculate overall contradiction level
        contradiction_level = self._calculate_level(contradictions)

        return {
            "total_contradictions": len(contradictions),
            "contradiction_level": contradiction_level,
            "contradictions": [c.to_dict() for c in contradictions],
            "has_major_conflicts": any(c.severity in ("major", "critical") for c in contradictions),
            "recommendation": self._get_recommendation(contradiction_level),
        }

    def _assess_severity(self, agent_a: dict, agent_b: dict) -> str:
        """Assess how severe a contradiction is."""
        conf_a = agent_a.get("confidence", 0)
        conf_b = agent_b.get("confidence", 0)
        avg_conf = (conf_a + conf_b) / 2

        # High-confidence agents disagreeing is more severe
        if avg_conf >= 75:
            return "critical"
        elif avg_conf >= 60:
            return "major"
        elif avg_conf >= 40:
            return "moderate"
        return "minor"

    def _describe_contradiction(self, agent_a: dict, agent_b: dict) -> str:
        """Generate a human-readable description of the contradiction."""
        name_a = agent_a.get("agent_id", "Unknown").replace("-", " ").title()
        name_b = agent_b.get("agent_id", "Unknown").replace("-", " ").title()
        signal_a = agent_a.get("signal", "unknown").upper()
        signal_b = agent_b.get("signal", "unknown").upper()
        conf_a = agent_a.get("confidence", 0)
        conf_b = agent_b.get("confidence", 0)

        return (f"{name_a} signals {signal_a} ({conf_a}%) while "
                f"{name_b} signals {signal_b} ({conf_b}%)")

    def _calculate_level(self, contradictions: list[Contradiction]) -> str:
        """Calculate overall contradiction level."""
        if not contradictions:
            return "none"

        severity_scores = {"minor": 1, "moderate": 2, "major": 3, "critical": 4}
        total_score = sum(severity_scores.get(c.severity, 0) for c in contradictions)

        if total_score >= 6:
            return "critical"
        elif total_score >= 4:
            return "major"
        elif total_score >= 2:
            return "moderate"
        return "minor"

    def _get_recommendation(self, level: str) -> str:
        """Get recommendation based on contradiction level."""
        recommendations = {
            "none": "Proceed with analysis — no conflicts detected.",
            "minor": "Minor differences exist — proceed with awareness.",
            "moderate": "Moderate conflicts detected — reduce confidence and review carefully.",
            "major": "Major conflicts detected — recommend waiting for clearer conditions.",
            "critical": "Critical conflicts — analysis should be held until conflicts resolve.",
        }
        return recommendations.get(level, "Review contradictions carefully.")
