"""
AI Orchestrator — the main entry point for the intelligence pipeline.

Per Volume IV:
- Section 2.2: AI Ecosystem Overview
- Section 2.8: AI Task Lifecycle (12 stages)
- Level 3 — Executive Intelligence

This is the single entry point that:
1. Receives an analysis request (symbol, timeframe)
2. Fetches market data from market-service
3. Runs all specialist agents in parallel
4. Passes results to the Executive Decision Engine
5. Returns the final recommendation

The orchestrator coordinates but does NOT analyze — analysis is
delegated to specialist agents (Vol. IV §2.10: Agent Independence).
"""

import logging
import time
from typing import Any, Optional

from agents.agent_runner import AgentRunner
from agents.base_agent import AgentOutput
from decision_engine.engine import ExecutiveDecisionEngine
from memory.memory_manager import MemoryManager
from knowledge.knowledge_base import KnowledgeBase

logger = logging.getLogger(__name__)


class AIOrchestrator:
    """Coordinates the full AI intelligence pipeline.

    Usage:
        orchestrator = AIOrchestrator(provider, agents, market_fetcher)
        result = await orchestrator.analyze("EUR/USD", "4h")
    """

    def __init__(
        self,
        provider: Any,
        agents: list,
        market_fetcher: Any = None,
        memory_manager: MemoryManager = None,
        knowledge_base: KnowledgeBase = None,
    ):
        """
        Args:
            provider: AI provider (ModelProvider instance from model-service)
            agents: List of specialist agent instances
            market_fetcher: Optional callable to fetch market data.
                           signature: async (symbol, interval) -> dict
            memory_manager: Optional memory system for cross-analysis context
            knowledge_base: Optional knowledge system for domain expertise
        """
        self.provider = provider
        self.runner = AgentRunner(agents)
        self.decision_engine = ExecutiveDecisionEngine(provider)
        self.market_fetcher = market_fetcher
        self.memory = memory_manager or MemoryManager()
        self.knowledge = knowledge_base or KnowledgeBase()

    async def analyze(
        self,
        symbol: str,
        timeframe: str = "4h",
        market_data: Optional[dict[str, Any]] = None,
        model: Optional[str] = None,
    ) -> dict[str, Any]:
        """Run the full analysis pipeline for a symbol.

        Per Vol. IV §2.8 AI Task Lifecycle:
        Stage 1: Task created
        Stage 2: Market context assembled
        Stage 3: Relevant specialists identified (all agents)
        Stage 4: Tasks distributed (parallel execution)
        Stage 5: Independent analysis completed
        Stage 6: Results validated
        Stage 7: Evidence aggregated
        Stage 8: Executive review
        Stage 9: Recommendation generated
        Stage 10: Explanation produced
        Stage 11: Results stored
        Stage 12: Recommendation delivered
        """
        start_time = time.time()

        logger.info(f"=== Analysis Pipeline: {symbol} ({timeframe}) ===")

        # Stage 1-2: Assemble market context
        if market_data is None:
            market_data = await self._fetch_market_data(symbol, timeframe)

        # Enrich with memory context (Vol. IV §4.4: Short-Term Memory)
        learning_context = self.memory.get_learning_context(symbol)
        if learning_context:
            market_data["memory_context"] = learning_context
            logger.info(f"Added memory context for {symbol}")

        # Enrich with knowledge context (Vol. IV §4.5: Knowledge Intelligence)
        # Each agent receives domain-specific knowledge via the orchestrator
        for agent in self.runner.agents:
            agent._knowledge_context = self.knowledge.get_agent_knowledge(
                agent.category
            )

        # Stages 3-5: Run specialist agents in parallel
        agent_results = await self.runner.run_all(
            provider=self.provider,
            symbol=symbol,
            market_data=market_data,
            timeframe=timeframe,
            model=model,
        )

        # Stages 6-7: Validate and aggregate
        valid_results = [r for r in agent_results if r.confidence > 0]
        logger.info(
            f"Valid agent results: {len(valid_results)}/{len(agent_results)}"
        )

        # Pass agent results into market_data for the recommendation agent
        market_data_with_results = {
            **market_data,
            "agent_results": [r.to_dict() for r in valid_results],
        }

        # Run the recommendation agent with all other agent results
        recommendation_results = await self.runner.run_subset(
            agent_names=["recommendation"],
            provider=self.provider,
            symbol=symbol,
            market_data=market_data_with_results,
            timeframe=timeframe,
            model=model,
        )

        # Combine all results
        all_results = valid_results + [
            r for r in recommendation_results if r.confidence > 0
        ]

        # Stages 8-10: Executive synthesis
        executive_result = await self.decision_engine.synthesize(
            symbol=symbol,
            timeframe=timeframe,
            agent_results=all_results,
            model=model,
        )

        # Add metadata
        elapsed_ms = round((time.time() - start_time) * 1000)
        executive_result["processing_time_ms"] = elapsed_ms
        executive_result["total_agents"] = len(agent_results)
        executive_result["successful_agents"] = len(valid_results)

        logger.info(
            f"=== Pipeline complete: {executive_result['recommendation']} "
            f"({executive_result['confidence']}%) in {elapsed_ms}ms ==="
        )

        # Store in short-term memory (Vol. IV §4.4)
        self.memory.store_analysis(symbol, executive_result)

        return executive_result

    async def _fetch_market_data(
        self, symbol: str, timeframe: str
    ) -> dict[str, Any]:
        """Fetch market data from the market service.

        If no market_fetcher is configured, returns empty data.
        The agents will work with whatever data is available.
        """
        if self.market_fetcher is None:
            logger.warning(
                "No market fetcher configured — agents will work without data"
            )
            return {"price": {}, "candles": []}

        try:
            return await self.market_fetcher(symbol, timeframe)
        except Exception as e:
            logger.error(f"Failed to fetch market data: {e}")
            return {"price": {}, "candles": []}
