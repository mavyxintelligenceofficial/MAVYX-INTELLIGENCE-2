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
from agents.specialists.executive_synthesis_v2 import (
    build_synthesis_prompt, parse_executive_response, 
    create_fallback_synthesis, EXECUTIVE_SYSTEM_PROMPT,
)

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
                context={"session": self._get_session()},
                request_id=f"spec_{agent_name}",
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
        )
        specialist_outputs.append(news_output)
        result.specialists.append(news_output)
        
        # ─── Phase 3: Quorum Gate Check ───
        quorum_met, agents_reporting, agents_sufficient = self.queue.check_quorum(specialist_outputs)
        result.quorum_met = quorum_met
        result.agents_reporting = agents_reporting
        result.agents_data_sufficient = agents_sufficient
        
        # Emit quorum status
        self._emit_status(AgentStatus(
            agent="quorum_gate",
            status="completed" if quorum_met else "failed",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            output_preview={
                "quorum_met": quorum_met,
                "agents_reporting": agents_reporting,
                "agents_data_sufficient": agents_sufficient,
            },
        ))
        
        # ─── Phase 4: Executive Synthesis (only if quorum met) ───
        if not quorum_met:
            logger.warning(f"Quorum NOT met ({agents_sufficient}/{agents_reporting}) — withholding recommendation")
            result.executive = {
                "recommendation": "no_trade",
                "confidence": 0,
                "agents_reporting": agents_reporting,
                "agents_data_sufficient": agents_sufficient,
                "bull_case": [],
                "bear_case": [f"Quorum not met: only {agents_sufficient}/{agents_reporting} agents returned sufficient data"],
                "risk_assessment": f"Recommendation withheld — insufficient data from {agents_reporting - agents_sufficient} agents",
                "invalidation_price": None,
                "recommended_scenario": "Wait for all agents to report successfully",
                "alternative_scenario": "Re-run analysis when market conditions improve",
                "executive_summary": f"Analysis incomplete: only {agents_sufficient} of {agents_reporting} specialist agents returned sufficient data. A minimum of 7 is required. Recommendation is withheld to avoid providing analysis based on incomplete information.",
            }
        else:
            # Calculate consensus from specialist outputs
            consensus = {"bullish": 0, "bearish": 0, "neutral": 0}
            valid_confidences = []
            for output in specialist_outputs:
                bias = output.get("bias", "neutral")
                if bias in consensus:
                    consensus[bias] += 1
                if output.get("data_sufficient") and output.get("confidence", 0) > 0:
                    valid_confidences.append(output["confidence"])
            
            avg_confidence = sum(valid_confidences) / len(valid_confidences) if valid_confidences else 0
            
            # Build synthesis prompt
            synthesis_prompt = build_synthesis_prompt(
                symbol, timeframe, specialist_outputs,
                quorum_met, agents_reporting, agents_sufficient,
            )
            
            # Call AI for executive synthesis
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
                    parsed = create_fallback_synthesis(consensus, avg_confidence, agents_reporting, agents_sufficient)
                
                result.executive = parsed
                
            except Exception as e:
                logger.error(f"Executive synthesis failed: {e}")
                result.executive = create_fallback_synthesis(consensus, avg_confidence, agents_reporting, agents_sufficient)
            
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
            "agent_consensus": {
                "bullish": sum(1 for o in specialist_outputs if o.get("bias") == "bullish"),
                "bearish": sum(1 for o in specialist_outputs if o.get("bias") == "bearish"),
                "neutral": sum(1 for o in specialist_outputs if o.get("bias") == "neutral"),
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
        """Get current trading session based on UTC hour."""
        from datetime import datetime, timezone
        hour = datetime.now(timezone.utc).hour
        if 0 <= hour < 7:
            return "Asian"
        elif 7 <= hour < 13:
            return "London"
        elif 13 <= hour < 21:
            return "New York"
        else:
            return "Off-Hours"
