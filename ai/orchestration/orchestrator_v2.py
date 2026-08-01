"""
AI Orchestrator v2 — Rebuilt per Rebuild Spec.

Key changes from v1:
- Sequential execution with rate limiting (not parallel)
- Quorum gate before Executive Synthesis
- Schema validation on every response
- Output caching
- Live Activity Feed via SSE
- Honest about single-model wearing 12 hats

Per Rebuild Spec Sections 3-4.
"""

import json
import logging
import time
from dataclasses import asdict
from typing import Any, Optional, Callable

from agents.queue import AgentQueue, OutputCache, PipelineResult, AgentStatus
from agents.schema import validate_specialist_output, validate_executive_output
from agents.specialists.market_structure_v2 import MarketStructureAgent
from agents.specialists.liquidity_v2 import LiquidityAgent
from agents.specialists.order_blocks_v2 import OrderBlocksAgent
from agents.specialists.fair_value_gaps_v2 import FairValueGapsAgent
from agents.specialists.break_of_structure_v2 import BreakOfStructureAgent
from agents.specialists.change_of_character_v2 import ChangeOfCharacterAgent
from agents.specialists.premium_discount_v2 import PremiumDiscountAgent
from agents.specialists.session_boundaries_v2 import SessionBoundariesAgent
from agents.specialists.institutional_targets_v2 import InstitutionalTargetsAgent
from agents.specialists.invalidation_levels_v2 import InvalidationLevelsAgent
from agents.specialists.news_fundamental_v2 import NewsFundamentalAgent
from agents.specialists.devils_advocate import DevilsAdvocateAgent
from agents.specialists.executive_synthesis_v2 import (
    build_synthesis_prompt, parse_executive_response, 
    create_fallback_synthesis, EXECUTIVE_SYSTEM_PROMPT,
)
from decision_engine.consensus_engine import compute_consensus
from decision_engine.risk_engine import run_risk_gate

logger = logging.getLogger(__name__)

# Agent execution order — independent agents first, dependents after
# Per spec Section 4: dependency ordering
SPECIALIST_ORDER = [
    # Independent agents (no dependencies)
    ("session_boundaries", SessionBoundariesAgent),
    ("premium_discount", PremiumDiscountAgent),
    ("market_structure", MarketStructureAgent),
    ("liquidity", LiquidityAgent),
    ("order_blocks", OrderBlocksAgent),
    ("fair_value_gaps", FairValueGapsAgent),
    ("break_of_structure", BreakOfStructureAgent),
    ("change_of_character", ChangeOfCharacterAgent),
    ("institutional_targets", InstitutionalTargetsAgent),
    # Dependent agents (need prior outputs)
    ("invalidation_levels", InvalidationLevelsAgent),
    # Devil's Advocate runs last among specialists so it can challenge
    # every other agent's output, including invalidation_levels'.
    ("devils_advocate", DevilsAdvocateAgent),
]

NEWS_AGENT = ("news_fundamental", NewsFundamentalAgent)


class AIOrchestratorV2:
    """Rebuilt orchestrator following the Rebuild Spec exactly.
    
    Key design decisions:
    - Sequential execution (not parallel) due to z.ai free tier
    - Quorum gate: minimum 7/10 specialists must report
    - Schema validation on every response
    - Caching to stay under 1,000 requests/day
    - Live Activity Feed via callbacks
    """
    
    def __init__(self, provider, cache_ttl: int = 900):
        self.provider = provider
        self.cache = OutputCache(ttl_seconds=cache_ttl)
        self.queue = AgentQueue(provider, self.cache)
        self._status_callbacks: list[Callable] = []
    
    def on_status_change(self, callback: Callable):
        """Register callback for Live Activity Feed."""
        self._status_callbacks.append(callback)
        self.queue.on_status_change(callback)
    
    def _emit_status(self, status: AgentStatus):
        for cb in self._status_callbacks:
            try:
                cb(status)
            except Exception:
                pass
    
    async def analyze(
        self,
        symbol: str,
        timeframe: str = "15m",
        market_data: Optional[dict] = None,
        economic_calendar: Optional[list] = None,
        model: Optional[str] = None,
    ) -> dict[str, Any]:
        """Run the full analysis pipeline.
        
        Returns a complete result dict with all agent outputs,
        executive synthesis, and metadata.
        """
        start_time = time.time()
        result = PipelineResult(specialists=[])
        
        logger.info(f"=== Analysis Pipeline v2: {symbol} ({timeframe}) ===")
        
        # Emit pipeline start
        self._emit_status(AgentStatus(
            agent="pipeline",
            status="running",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        ))
        
        # Extract candle data
        candle_data = []
        if market_data:
            candle_data = market_data.get("candles", [])
            if not candle_data and "price" in market_data:
                # Some market_data formats nest candles differently
                candle_data = market_data.get("price", {}).get("candles", [])
        
        if not candle_data:
            logger.warning(f"No candle data for {symbol} — all agents will report insufficient data")

        session = self._get_session()
        market_closed = session.startswith("Weekend")
        
        # ─── Phase 1: Run 10 Specialist Agents (sequential, rate-limited) ───
        specialist_outputs = []
        
        for agent_name, agent_class in SPECIALIST_ORDER:
            agent = agent_class()
            
            async def run_agent_func(sym, candles, tf, ctx, _agent=agent):
                """Wrapper that calls the provider through the agent."""
                system_prompt = _agent.build_system_prompt()
                user_prompt = _agent.build_user_prompt(sym, candles, tf, ctx)
                raw = await self.provider.generate(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    model=model,
                )
                return raw
            
            output = await self.queue.run_agent(
                agent_name=agent_name,
                agent_func=run_agent_func,
                symbol=symbol,
                timeframe=timeframe,
                candle_data=candle_data,
                context={"session": session},
                request_id=f"spec_{agent_name}",
                min_candles=agent.min_candles,
                detail=agent.domain_description,
            )
            
            specialist_outputs.append(output)
            result.specialists.append(output)
        
        # ─── Phase 2: Run News/Fundamental Agent (in parallel slot) ───
        # It doesn't depend on price-derived agents
        news_agent = NewsFundamentalAgent()
        
        async def run_news_func(sym, candles, tf, ctx):
            system_prompt = news_agent.build_system_prompt()
            user_prompt = news_agent.build_user_prompt(sym, candles, tf, {
                **ctx,
                "economic_calendar": economic_calendar or [],
            })
            return await self.provider.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=model,
            )
        
        news_output = await self.queue.run_agent(
            agent_name="news_fundamental",
            agent_func=run_news_func,
            symbol=symbol,
            timeframe=timeframe,
            candle_data=candle_data,
            context={"economic_calendar": economic_calendar or []},
            request_id="news",
            min_candles=news_agent.min_candles,
            detail=news_agent.domain_description,
        )
        specialist_outputs.append(news_output)
        result.specialists.append(news_output)
        
        # ─── Phase 3: Consensus Engine (code-computed, Rule 2) ───
        self._emit_status(AgentStatus(
            agent="consensus_engine",
            status="running",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            detail="Tallying weighted votes across all reporting specialists (code, no AI call)…",
        ))
        consensus = compute_consensus(specialist_outputs)
        quorum_met, agents_reporting, agents_sufficient = self.queue.check_quorum(specialist_outputs)
        result.quorum_met = quorum_met
        result.agents_reporting = agents_reporting
        result.agents_data_sufficient = agents_sufficient
        self._emit_status(AgentStatus(
            agent="consensus_engine",
            status="completed",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            output_preview={
                "majority_bias": consensus["majority_bias"],
                "agreement_ratio": consensus["agreement_ratio"],
                "consensus_confidence": consensus["consensus_confidence"],
                "disagreement": consensus["disagreement"],
                "counts": consensus["counts"],
            },
        ))

        # ─── Phase 4: Risk Management Engine (mandatory gate, Rule 10) ───
        self._emit_status(AgentStatus(
            agent="risk_management_gate",
            status="running",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            detail="Applying quorum, disagreement, and Devil's Advocate penalties to consensus confidence (code, no AI call)…",
        ))
        devils_advocate_output = next(
            (o for o in specialist_outputs if o.get("agent") == "devils_advocate"), None
        )
        gate = run_risk_gate(consensus, quorum_met, devils_advocate_output, market_closed=market_closed)
        self._emit_status(AgentStatus(
            agent="risk_management_gate",
            status="completed" if not gate["risk_flags"] else "failed",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            output_preview={
                "final_confidence": gate["final_confidence"],
                "forced_recommendation": gate["forced_recommendation"],
                "risk_flags": gate["risk_flags"],
            },
            error="; ".join(gate["risk_flags"]) if gate["risk_flags"] else None,
        ))
        risk_context = {"consensus": consensus, "gate": gate}

        # ─── Phase 5: Executive Synthesis (narrative only — LLM does not compute confidence) ───
        if not quorum_met:
            logger.warning(f"Quorum NOT met ({agents_sufficient}/{agents_reporting}) — withholding recommendation")
            result.executive = create_fallback_synthesis(
                consensus["counts"], gate["final_confidence"], agents_reporting, agents_sufficient, risk_context,
            )
        else:
            # Build synthesis prompt with the pre-computed consensus/risk data
            synthesis_prompt = build_synthesis_prompt(
                symbol, timeframe, specialist_outputs,
                quorum_met, agents_reporting, agents_sufficient,
                risk_context=risk_context,
            )
            
            # Call AI for executive synthesis (narrative only)
            self._emit_status(AgentStatus(
                agent="executive_synthesis",
                status="running",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            ))
            
            await self.queue._rate_limit_wait()
            
            try:
                raw_synthesis = await self.provider.generate(
                    system_prompt=EXECUTIVE_SYSTEM_PROMPT,
                    user_prompt=synthesis_prompt,
                    model=model,
                )
                parsed = parse_executive_response(raw_synthesis)
                
                # Validate
                is_valid, errors = validate_executive_output(parsed)
                if not is_valid:
                    logger.error(f"Executive synthesis schema invalid: {errors}")
                    parsed = create_fallback_synthesis(
                        consensus["counts"], gate["final_confidence"], agents_reporting, agents_sufficient, risk_context,
                    )

                # The Risk Gate is authoritative, not advisory — override
                # whatever the LLM asserted for confidence/recommendation.
                parsed["confidence"] = gate["final_confidence"]
                if gate["forced_recommendation"]:
                    parsed["recommendation"] = gate["forced_recommendation"]

                # The Devil's Advocate challenge must appear in bear_case
                # regardless of whether the LLM included it (Rule 7 — the
                # AI must always identify reasons not to take the trade,
                # and this cannot be silently dropped by the narrative step).
                bear_case = parsed.get("bear_case") or []
                if not isinstance(bear_case, list):
                    bear_case = [str(bear_case)]
                if gate["devils_advocate_challenge"] and not any(
                    gate["devils_advocate_challenge"] in b for b in bear_case
                ):
                    bear_case.append(f"{gate['devils_advocate_challenge']} (agent: devils_advocate)")
                for flag in gate["risk_flags"]:
                    if not any(flag in b for b in bear_case):
                        bear_case.append(flag)
                parsed["bear_case"] = bear_case

                result.executive = parsed
                
            except Exception as e:
                logger.error(f"Executive synthesis failed: {e}")
                result.executive = create_fallback_synthesis(
                    consensus["counts"], gate["final_confidence"], agents_reporting, agents_sufficient, risk_context,
                )
            
            self._emit_status(AgentStatus(
                agent="executive_synthesis",
                status="completed",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                output_preview={
                    "recommendation": result.executive.get("recommendation"),
                    "confidence": result.executive.get("confidence"),
                },
            ))
        
        # ─── Phase 5: Compile Final Result ───
        elapsed_ms = int((time.time() - start_time) * 1000)
        result.total_duration_ms = elapsed_ms
        
        # Build the final response
        final = {
            "symbol": symbol,
            "timeframe": timeframe,
            "session": session,
            "market_closed": market_closed,
            "recommendation": result.executive.get("recommendation", "no_trade"),
            "confidence": result.executive.get("confidence", 0),
            "executive_summary": result.executive.get("executive_summary", ""),
            "bull_case": result.executive.get("bull_case", []),
            "bear_case": result.executive.get("bear_case", []),
            "risk_assessment": result.executive.get("risk_assessment", ""),
            "invalidation_price": result.executive.get("invalidation_price"),
            "recommended_scenario": result.executive.get("recommended_scenario", ""),
            "alternative_scenario": result.executive.get("alternative_scenario", ""),
            "suggested_action": result.executive.get("suggested_action", {}),
            "agent_consensus": consensus["counts"],
            "consensus_detail": consensus,
            "risk_gate": {
                "risk_flags": gate["risk_flags"],
                "devils_advocate_challenge": gate["devils_advocate_challenge"],
                "devils_advocate_confidence": gate["devils_advocate_confidence"],
                "forced_recommendation": gate["forced_recommendation"],
            },
            "full_agent_outputs": specialist_outputs,
            "agent_breakdown": [
                {
                    "agent_id": o.get("agent", "unknown"),
                    "signal": o.get("bias", "neutral"),
                    "confidence": o.get("confidence", 0),
                    "summary": o.get("reasoning", ""),
                    "data_sufficient": o.get("data_sufficient", False),
                    "key_levels": o.get("key_levels", []),
                }
                for o in specialist_outputs
            ],
            "processing_time_ms": elapsed_ms,
            "total_agents": agents_reporting,
            "successful_agents": agents_sufficient,
            "quorum_met": quorum_met,
            "model": "glm-4.5-flash (free tier)",
            "disclaimer": "This is AI-generated analysis only. Not financial advice. Always manage your own risk.",
        }
        
        logger.info(
            f"=== Pipeline v2 complete: {final['recommendation']} "
            f"({final['confidence']}) in {elapsed_ms}ms ==="
        )
        
        return final
    
    def _get_session(self) -> str:
        """Get current trading session based on UTC day + hour.

        Forex markets are closed roughly Friday 22:00 UTC through Sunday
        22:00 UTC (broker feeds vary by an hour or two, but this covers the
        universal closed window). Previously this only checked the hour,
        so it would confidently report a live session (e.g. "London") even
        on a Saturday with markets fully closed and candle data stale since
        Friday's close - misleading for anyone reading the analysis.
        """
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        weekday = now.weekday()  # Monday=0 ... Sunday=6
        hour = now.hour

        if weekday == 5:  # Saturday - always closed
            return "Weekend — Markets Closed"
        if weekday == 6 and hour < 22:  # Sunday before ~22:00 UTC reopen
            return "Weekend — Markets Closed"
        if weekday == 4 and hour >= 22:  # Friday after ~22:00 UTC close
            return "Weekend — Markets Closed"

        if 0 <= hour < 7:
            return "Asian"
        elif 7 <= hour < 13:
            return "London"
        elif 13 <= hour < 21:
            return "New York"
        else:
            return "Off-Hours"
