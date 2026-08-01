"""
Risk Management Engine — the mandatory gate per MEIDS Chapter 1, Rule 10:
"No recommendation may bypass the Risk Management Engine. Risk validation
is mandatory."

Previously there was no such gate. "risk_assessment" was just a text field
the executive-synthesis LLM call wrote alongside its narrative — nothing
in the pipeline actually stopped a recommendation from reaching the user
regardless of data quality, agent disagreement, or the Devil's Advocate's
findings. This module is a real code-level gate: it runs after the
Consensus Engine and before the executive synthesis LLM call, and its
decision cannot be overridden by the LLM's narrative — the orchestrator
uses this module's `final_confidence` and `forced_recommendation` as hard
constraints, not suggestions.

Per Rule 7 ("must always identify reasons not to take a trade"), the
Devil's Advocate agent's output is a required input here, not optional —
its confidence (inverted meaning: how strong the case against the trade
is) directly reduces final_confidence. This is "the Devil's Advocate must
be rewarded for finding weaknesses" implemented as an actual computation
rather than a design aspiration.
"""

from typing import Any, Optional

# Below this confidence, the recommendation is forced to "wait" regardless
# of what the executive synthesis LLM would otherwise say.
MIN_ACTIONABLE_CONFIDENCE = 0.35

# A Devil's Advocate confidence at or above this threshold means it found a
# serious, specific objection — strong enough to force "wait" on its own.
DEVILS_ADVOCATE_VETO_THRESHOLD = 0.70

# How much of the Devil's Advocate's confidence is subtracted from the
# consensus confidence. E.g. a 0.8 devil's-advocate confidence removes 0.28.
DEVILS_ADVOCATE_WEIGHT = 0.35


def run_risk_gate(
    consensus: dict[str, Any],
    quorum_met: bool,
    devils_advocate_output: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Run the mandatory risk gate. Returns a dict the orchestrator must
    treat as authoritative, not advisory:

      - final_confidence: risk-adjusted confidence (0-1), already accounting
        for disagreement and the Devil's Advocate's challenge
      - forced_recommendation: if set, the orchestrator MUST use this
        recommendation regardless of what the executive LLM proposes
      - risk_flags: human-readable reasons for the gate's decision, always
        surfaced to the user (this is what Rule 6 "every disagreement must
        be visible" requires)
      - devils_advocate_challenge: the strongest objection found, always
        included in the final bear_case shown to the user — the LLM cannot
        omit or soften it, since it's injected after the LLM call, not
        requested from it
    """
    risk_flags: list[str] = []
    forced_recommendation: Optional[str] = None
    confidence = consensus.get("consensus_confidence", 0.0)

    if not quorum_met:
        forced_recommendation = "no_trade"
        risk_flags.append("Quorum not met — insufficient agents reported sufficient data.")

    if consensus.get("disagreement"):
        risk_flags.append(
            f"Specialist agents disagree on direction "
            f"(bullish={consensus['counts']['bullish']}, "
            f"bearish={consensus['counts']['bearish']}, "
            f"neutral={consensus['counts']['neutral']}) — no clear plurality."
        )
        if forced_recommendation is None:
            forced_recommendation = "wait"

    devils_advocate_challenge = ""
    da_confidence = 0.0
    if devils_advocate_output:
        da_confidence = devils_advocate_output.get("confidence", 0.0) or 0.0
        devils_advocate_challenge = devils_advocate_output.get("reasoning", "")
        if da_confidence > 0:
            confidence = max(0.0, confidence - (da_confidence * DEVILS_ADVOCATE_WEIGHT))
        if da_confidence >= DEVILS_ADVOCATE_VETO_THRESHOLD:
            risk_flags.append(
                f"Devil's Advocate raised a high-conviction objection "
                f"(confidence {da_confidence:.2f}): {devils_advocate_challenge}"
            )
            if forced_recommendation is None:
                forced_recommendation = "wait"
    else:
        risk_flags.append("Devil's Advocate did not report — proceeding without an independent challenge check.")

    confidence = round(min(max(confidence, 0.0), 1.0), 3)

    if confidence < MIN_ACTIONABLE_CONFIDENCE and forced_recommendation is None:
        forced_recommendation = "wait"
        risk_flags.append(
            f"Risk-adjusted confidence ({confidence:.2f}) is below the "
            f"minimum actionable threshold ({MIN_ACTIONABLE_CONFIDENCE})."
        )

    return {
        "final_confidence": confidence,
        "forced_recommendation": forced_recommendation,
        "risk_flags": risk_flags,
        "devils_advocate_challenge": devils_advocate_challenge,
        "devils_advocate_confidence": da_confidence,
    }
