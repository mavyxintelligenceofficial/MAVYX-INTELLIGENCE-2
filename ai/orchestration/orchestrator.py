"""
AI Orchestrator — the main entry point for the intelligence pipeline.

Per MEIDS Chapter 8 §8.4: AI Orchestration Pipeline
Per MEIDS Chapter 3 §3.2: Intelligence Workflow

This is the conductor. Not an analyst.
"""

import logging
import time
from typing import Any, Optional

from agents.agent_runner import AgentRunner
from agents.base_agent import AgentOutput
from decision_engine.engine import ExecutiveDecisionEngine
from decision_engine.evidence_engine import EvidenceEngine
from decision_engine.confidence_engine import ConfidenceEngine
from decision_engine.contradiction_engine import ContradictionEngine
from memory.memory_manager import MemoryManager
from knowledge.knowledge_base import KnowledgeBase

logger = logging.getLogger(__name__)


class AIOrchestrator:
    """Coordinates the full AI intelligence pipeline.

    Per MEIDS §3.2 — Intelligence Workflow:
    User Request → Market Data → Data Validation → Distribution →
    Specialist Agents → Evidence Collection → Conflict Detection →
    Risk Evaluation → Historical Comparison → Executive Decision →
    Executive Brief → Memory → Journal
    """

    def __init__(self, provider, agents, market_fetcher=None,
                 memory_manager=None, knowledge_base=None):
        self.provider = provider
        self.runner = AgentRunner(agents)
        self.decision_engine = ExecutiveDecisionEngine(provider)
        self.evidence_engine = EvidenceEngine()
        self.confidence_engine = ConfidenceEngine()
        self.contradiction_engine = ContradictionEngine()
        self.market_fetcher = market_fetcher
        self.memory = memory_manager or MemoryManager()
        self.knowledge = knowledge_base or KnowledgeBase()

    async def analyze(self, symbol, timeframe="4h", market_data=None, model=None):
        """Run the full analysis pipeline."""
        start_time = time.time()
        logger.info(f"=== Analysis Pipeline: {symbol} ({timeframe}) ===")

        # Stage 1-2: Assemble market context
        if market_data is None:
            market_data = await self._fetch_market_data(symbol, timeframe)

        # Enrich with memory context
        learning_context = self.memory.get_learning_context(symbol)
        if learning_context:
            market_data["memory_context"] = learning_context

        # Enrich agents with knowledge
        for agent in self.runner.agents:
            agent._knowledge_context = self.knowledge.get_agent_knowledge(agent.category)

        # Stage 3-5: Run specialist agents (excluding Devil's Advocate initially)
        primary_agents = [a for a in self.runner.agents if a.name != "devils-advocate" and a.name != "recommendation"]
        primary_runner = AgentRunner(primary_agents)
        primary_results = await primary_runner.run_all(
            self.provider, symbol, market_data, timeframe, model
        )

        valid_results = [r for r in primary_results if r.confidence > 0]
        logger.info(f"Primary agents: {len(valid_results)}/{len(primary_results)} valid")

        # Stage 5b: Run Devil's Advocate with all primary results
        market_data_with_results = {
            **market_data,
            "agent_results": [r.to_dict() for r in valid_results],
        }

        da_results = await self.runner.run_subset(
            ["devils-advocate"], self.provider, symbol,
            market_data_with_results, timeframe, model
        )

        # Combine primary + Devil's Advocate
        all_specialist_results = valid_results + [r for r in da_results if r.confidence > 0]

        # Stage 6: Evidence Engine — organize all intelligence
        evidence_summary = self.evidence_engine.process(
            [r.to_dict() for r in all_specialist_results]
        )
        logger.info(f"Evidence: {evidence_summary['total_evidence']} pieces, "
                     f"quality={evidence_summary['overall_evidence_quality']}")

        # Stage 7: Contradiction Detection
        contradictions = self.contradiction_engine.detect(
            [r.to_dict() for r in all_specialist_results]
        )
        logger.info(f"Contradictions: {contradictions['total_contradictions']}, "
                     f"level={contradictions['contradiction_level']}")

        # Stage 8: Confidence Engine — calculate evidence-based confidence
        confidence_result = self.confidence_engine.calculate(
            [r.to_dict() for r in all_specialist_results],
            evidence_summary,
        )
        logger.info(f"Confidence: {confidence_result['overall_confidence']}%")

        # Stage 9: Run Recommendation Agent with full context
        recommendation_results = await self.runner.run_subset(
            ["recommendation"], self.provider, symbol,
            market_data_with_results, timeframe, model
        )

        all_results = all_specialist_results + [r for r in recommendation_results if r.confidence > 0]

        # Stage 10: Executive Decision Engine — final synthesis
        executive_result = await self.decision_engine.synthesize(
            symbol=symbol,
            timeframe=timeframe,
            agent_results=all_results,
            model=model,
        )

        # Stage 11: Enrich with engines
        executive_result["evidence_summary"] = evidence_summary
        executive_result["contradictions"] = contradictions
        executive_result["confidence_breakdown"] = confidence_result
        executive_result["confidence"] = confidence_result["overall_confidence"]
        executive_result["agent_consensus"] = self.confidence_engine.get_consensus(
            [r.to_dict() for r in all_specialist_results]
        )

        # Metadata
        elapsed_ms = round((time.time() - start_time) * 1000)
        executive_result["processing_time_ms"] = elapsed_ms
        executive_result["total_agents"] = len(all_results)
        executive_result["successful_agents"] = len([r for r in all_results if r.confidence > 0])

        logger.info(f"=== Pipeline complete: {executive_result.get('recommendation', 'unknown')} "
                     f"({executive_result['confidence']}%) in {elapsed_ms}ms ===")

        # Stage 12: Store in memory
        self.memory.store_analysis(symbol, executive_result)

        return executive_result

    async def _fetch_market_data(self, symbol, timeframe):
        if self.market_fetcher is None:
            logger.warning("No market fetcher configured")
            return {"price": {}, "candles": []}
        try:
            return await self.market_fetcher(symbol, timeframe)
        except Exception as e:
            logger.error(f"Failed to fetch market data: {e}")
            return {"price": {}, "candles": []}
