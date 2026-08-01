"""
Consensus Engine — code-computed agreement and confidence scoring.

Per MEIDS Chapter 1, Rule 2: "Every confidence score must have measurable
evidence." Per Volume IV Chapter 3 §3.3: "Given identical inputs and
configurations, the EDE shall produce consistent outputs" (Consistency) and
"Every decision must be reproducible using recorded inputs" (Auditability).

Previously, confidence was whatever number the executive-synthesis LLM call
asserted alongside its narrative — not measurable, not reproducible (same
inputs could yield different confidence on different runs), and not
separable from the narrative generation step. This module replaces that
with a pure function: same specialist outputs in, same numbers out, every
time. The LLM is no longer trusted to compute confidence — only to narrate
around numbers this module already computed.

DEVILS_ADVOCATE_AGENT is deliberately excluded from the directional tally:
its "bias" field has an inverted meaning (see specialists/devils_advocate.py)
and would corrupt the bull/bear/neutral vote if counted directly.
"""

from typing import Any

DEVILS_ADVOCATE_AGENT = "devils_advocate"


def compute_consensus(specialist_outputs: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute directional consensus and a measurable confidence score.

    Returns a dict with:
      - counts: {bullish, bearish, neutral} tally (devil's advocate excluded)
      - majority_bias: the leading direction
      - agreement_ratio: majority_count / total_directional_votes (0-1)
      - avg_specialist_confidence: mean confidence of data_sufficient agents
      - data_sufficiency_ratio: data_sufficient / total agents
      - consensus_confidence: the single measurable confidence score, 0-1
      - disagreement: True if no direction has a clear plurality
    """
    directional = [o for o in specialist_outputs if o.get("agent") != DEVILS_ADVOCATE_AGENT]

    counts = {"bullish": 0, "bearish": 0, "neutral": 0}
    confidences = []
    sufficient_count = 0

    for o in directional:
        bias = o.get("bias", "neutral")
        if bias in counts:
            counts[bias] += 1
        if o.get("data_sufficient"):
            sufficient_count += 1
            conf = o.get("confidence", 0)
            if isinstance(conf, (int, float)) and conf > 0:
                confidences.append(conf)

    total_directional = len(directional)
    majority_bias = max(counts, key=counts.get) if total_directional else "neutral"
    majority_count = counts[majority_bias]
    agreement_ratio = (majority_count / total_directional) if total_directional else 0.0

    avg_specialist_confidence = (sum(confidences) / len(confidences)) if confidences else 0.0
    data_sufficiency_ratio = (sufficient_count / total_directional) if total_directional else 0.0

    # Measurable confidence formula — every factor here is a count or a
    # mean pulled directly from specialist outputs, nothing asserted by an LLM.
    # Weighted: half from how much specialists agree, half from how confident
    # the agreeing specialists were, scaled by how many agents had enough data.
    consensus_confidence = (
        (0.5 * agreement_ratio + 0.5 * avg_specialist_confidence) * data_sufficiency_ratio
    )
    consensus_confidence = round(min(max(consensus_confidence, 0.0), 1.0), 3)

    # No clear plurality: top two directions tied, or majority is "neutral"
    # with real competing bullish/bearish votes.
    sorted_counts = sorted(counts.values(), reverse=True)
    disagreement = (
        total_directional == 0
        or (len(sorted_counts) > 1 and sorted_counts[0] == sorted_counts[1] and sorted_counts[0] > 0)
        or (majority_bias == "neutral" and (counts["bullish"] > 0 and counts["bearish"] > 0))
    )

    return {
        "counts": counts,
        "majority_bias": majority_bias,
        "agreement_ratio": round(agreement_ratio, 3),
        "avg_specialist_confidence": round(avg_specialist_confidence, 3),
        "data_sufficiency_ratio": round(data_sufficiency_ratio, 3),
        "consensus_confidence": consensus_confidence,
        "disagreement": disagreement,
        "total_directional_agents": total_directional,
    }
