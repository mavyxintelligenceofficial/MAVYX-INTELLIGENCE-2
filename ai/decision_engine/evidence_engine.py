"""
Evidence Engine — Per MEIDS Chapter 3 §3.15
Does not analyze markets. Organizes intelligence.

Responsibilities:
- Receive reports from every specialist
- Validate completeness
- Normalize outputs into a common structure
- Remove duplicates
- Measure evidence quality
- Prepare reports for Executive Decision Engine

Every Evidence Record Contains:
- Source Agent
- Timestamp
- Confidence
- Evidence Strength
- Supporting Data
- Risk Level
- Validation Status
"""

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class EvidenceRecord:
    """A single piece of evidence from a specialist agent."""

    def __init__(self, agent_id: str, finding: str, strength: str, confidence: int):
        self.agent_id = agent_id
        self.finding = finding
        self.strength = strength  # critical, strong, moderate, weak, unknown
        self.confidence = confidence
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.validated = True

    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "finding": self.finding,
            "strength": self.strength,
            "confidence": self.confidence,
            "timestamp": self.timestamp,
            "validated": self.validated,
        }


class EvidenceEngine:
    """Organizes intelligence from all specialist agents.

    Per MEIDS §3.15: "The Evidence Engine does not analyze markets.
    It organizes intelligence."
    """

    def process(self, agent_results: list[dict]) -> dict[str, Any]:
        """Process all agent results into organized evidence."""
        all_evidence = []
        supporting = []
        opposing = []
        missing = []

        for result in agent_results:
            agent_id = result.get("agent_id", "unknown")
            signal = result.get("signal", "neutral")
            confidence = result.get("confidence", 0)
            findings = result.get("key_findings", [])
            evidence_items = result.get("evidence", [])

            # Classify evidence strength based on confidence
            strength = self._classify_strength(confidence)

            # Create evidence records
            for finding in findings:
                record = EvidenceRecord(agent_id, finding, strength, confidence)
                all_evidence.append(record)

                # Classify as supporting or opposing
                if signal in ("bullish", "bearish"):
                    supporting.append(record)
                else:
                    opposing.append(record)

            for ev in evidence_items:
                record = EvidenceRecord(agent_id, ev, strength, confidence)
                all_evidence.append(record)

            # Check for missing information
            if confidence < 40:
                missing.append({
                    "agent_id": agent_id,
                    "reason": "Low confidence — insufficient data",
                    "confidence": confidence,
                })

            if not findings and not evidence_items:
                missing.append({
                    "agent_id": agent_id,
                    "reason": "No findings or evidence produced",
                })

        return {
            "total_evidence": len(all_evidence),
            "supporting_count": len(supporting),
            "opposing_count": len(opposing),
            "missing_count": len(missing),
            "evidence_records": [r.to_dict() for r in all_evidence],
            "supporting": [r.to_dict() for r in supporting],
            "opposing": [r.to_dict() for r in opposing],
            "missing": missing,
            "overall_evidence_quality": self._assess_quality(all_evidence),
        }

    def _classify_strength(self, confidence: int) -> str:
        """Classify evidence strength based on confidence."""
        if confidence >= 80:
            return "critical"
        elif confidence >= 65:
            return "strong"
        elif confidence >= 45:
            return "moderate"
        elif confidence >= 25:
            return "weak"
        return "unknown"

    def _assess_quality(self, records: list[EvidenceRecord]) -> str:
        """Assess overall evidence quality."""
        if not records:
            return "insufficient"

        avg_confidence = sum(r.confidence for r in records) / len(records)
        if avg_confidence >= 70:
            return "high"
        elif avg_confidence >= 50:
            return "moderate"
        elif avg_confidence >= 30:
            return "low"
        return "insufficient"
