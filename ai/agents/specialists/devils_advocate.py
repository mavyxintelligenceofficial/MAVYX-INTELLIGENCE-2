"""
Devil's Advocate Agent — Specialist #12 (independent Rule 7 check)

Per MEIDS Chapter 1, Rule 7:
"The AI must always identify reasons not to take a trade.
This prevents confirmation bias and encourages disciplined decision-making."

Rebuilt to the v2 SpecialistAgent contract (was broken: imported the deleted
v1 base_agent.py and used the old 0-100/"signal" schema incompatible with
the rest of the pipeline). This agent now runs as a real dependent agent,
after the other 10 specialists, and sees their combined output so it can
challenge the emerging consensus directly instead of working in isolation.

Its `confidence` field has an inverted meaning from every other agent's:
here, confidence measures how strong the case AGAINST the trade is. The
Risk Management Engine (risk_engine.py) uses this score directly to pull
down overall confidence — implementing "the Devil's Advocate must be
rewarded for finding weaknesses, never punished."
"""

from typing import Optional
from agents.specialist_base import SpecialistAgent


class DevilsAdvocateAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "devils_advocate"
    @property
    def display_name(self) -> str: return "Devil's Advocate"
    @property
    def domain_description(self) -> str:
        return ("Challenge the emerging consensus from every other specialist agent. "
                "Your job is to find reasons this trade idea could FAIL, not to confirm it.")
    @property
    def level_type_example(self) -> str: return "invalidation"
    @property
    def confidence_formula(self) -> str:
        return ("INVERTED from other agents: confidence here means how strong the case "
                "AGAINST the trade is. High confidence = you found serious, specific "
                "weaknesses. Low confidence = you tried hard and found little to challenge.")
    @property
    def min_candles(self) -> int: return 20
    @property
    def extra_instructions(self) -> str:
        return """You are the opposing lawyer in a court case. Every other agent is a witness
FOR the trade. Your mission is to destroy their case, not agree with it.

You must NEVER:
- Agree automatically with the other agents' consensus
- Support a trade idea without challenging it first
- Be optimistic or hedge your challenge to be agreeable

Search specifically for: contradictory evidence between agents, weak or thin evidence
inflated into high confidence, liquidity traps, signs of institutional manipulation,
and anything the other agents may have missed.

Your `reasoning` field must state the single strongest reason this trade could fail,
referencing specific price levels or agent disagreements. If you genuinely cannot find
a strong objection after reviewing the other agents' output, say so plainly and set a
low confidence — a weak challenge is honest signal, not a failure."""

    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        candle_str = self.format_candles(candles, 30)
        prior = context.get("prior_agent_outputs", {}) if context else {}

        others_text = ""
        if prior:
            others_text = "\nOTHER AGENTS' FINDINGS (your job is to challenge these):\n"
            for agent_name, output in prior.items():
                if not isinstance(output, dict):
                    continue
                others_text += (
                    f"- {agent_name}: bias={output.get('bias')}, "
                    f"confidence={output.get('confidence')}, "
                    f"reasoning=\"{output.get('reasoning', '')}\"\n"
                )
        else:
            others_text = "\n(No prior agent outputs available yet — challenge based on raw price action alone.)"

        return f"""Challenge the current analysis for {symbol} on {timeframe}.

CANDLE DATA:
{candle_str}
{others_text}

Find the strongest reason this trade idea could fail. Consider:
1. Do any agents contradict each other on bias or key levels?
2. Is any agent's confidence higher than its evidence actually supports?
3. Could this setup be a liquidity trap or stop hunt rather than genuine direction?
4. What is the single clearest invalidation condition?

Return your challenge as JSON only, using the standard output schema."""
