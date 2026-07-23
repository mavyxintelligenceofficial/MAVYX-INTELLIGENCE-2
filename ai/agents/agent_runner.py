"""
Agent Runner — executes specialist agents in parallel.

Per Volume IV §2.7: AI Agent Communication Framework
- No direct peer-to-peer dependencies
- Independent execution
- Asynchronous processing where practical

Per Volume IV §2.8: AI Task Lifecycle
- Stage 3: Relevant specialists identified
- Stage 4: Tasks distributed
- Stage 5: Independent analysis completed
- Stage 6: Results validated
"""

import asyncio
import logging
from typing import Any, Optional

from agents.base_agent import BaseAgent, AgentOutput

logger = logging.getLogger(__name__)


class AgentRunner:
    """Runs multiple specialist agents in parallel and collects their results.

    Each agent runs independently — if one fails, the others continue.
    This matches Vol. IV §2.10: Agent Independence.
    """

    def __init__(self, agents: list[BaseAgent]):
        self.agents = agents

    async def run_all(
        self,
        provider: Any,
        symbol: str,
        market_data: dict[str, Any],
        timeframe: str = "4h",
        model: Optional[str] = None,
    ) -> list[AgentOutput]:
        """Run all agents in parallel for a given symbol.

        Returns a list of AgentOutput objects, one per agent.
        Failed agents produce an error output instead of raising.
        """
        logger.info(
            f"Running {len(self.agents)} agents for {symbol} ({timeframe})"
        )

        tasks = [
            agent.analyze(provider, symbol, market_data, timeframe, model)
            for agent in self.agents
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle any exceptions that slipped through
        outputs = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(
                    f"Agent {self.agents[i].name} raised exception: {result}"
                )
                outputs.append(
                    self.agents[i]._create_error_output(
                        symbol, timeframe, str(result)
                    )
                )
            else:
                outputs.append(result)

        logger.info(
            f"Completed {len(outputs)} agent analyses for {symbol}"
        )
        return outputs

    async def run_subset(
        self,
        agent_names: list[str],
        provider: Any,
        symbol: str,
        market_data: dict[str, Any],
        timeframe: str = "4h",
        model: Optional[str] = None,
    ) -> list[AgentOutput]:
        """Run only the specified agents by name."""
        selected = [a for a in self.agents if a.name in agent_names]
        if not selected:
            logger.warning(f"No agents found matching: {agent_names}")
            return []

        runner = AgentRunner(selected)
        return await runner.run_all(
            provider, symbol, market_data, timeframe, model
        )
