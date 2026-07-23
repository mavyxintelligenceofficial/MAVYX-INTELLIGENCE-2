"""
Memory Manager — layered memory system for AI agents.

Per Volume IV §4.4: Memory Architecture
The AI ecosystem implements a layered memory architecture:

1. Working Memory — current task info (discarded after completion)
2. Short-Term Memory — recent analytical activity
3. Long-Term Memory — persistent domain knowledge
4. Historical Intelligence — past analyses and outcomes
5. User Context — user-specific preferences

This module manages short-term and historical memory.
Working memory is handled by each agent internally.
Long-term memory is the knowledge base (separate module).
User context is handled by user-service.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger(__name__)


class MemoryManager:
    """Manages layered memory for the AI intelligence system.

    Per Volume IV §4.4, memory supports continuity across related
    analyses and enables learning from historical patterns.
    """

    def __init__(self, store: Any = None):
        """
        Args:
            store: AnalysisStore instance for historical memory retrieval
        """
        self.store = store
        # Short-term memory: recent analyses for a symbol (in-memory cache)
        self._short_term: dict[str, list[dict]] = {}

    def get_symbol_context(self, symbol: str, user_id: str = "system") -> dict[str, Any]:
        """Build comprehensive context for a symbol analysis.

        Per Vol. IV §4.3: Context Construction Engine
        Assembles: market instrument, recent price history, historical
        recommendations, recent market structures.
        """
        context = {
            "symbol": symbol,
            "recent_analyses": self._get_recent_analyses(symbol),
            "historical_patterns": self._get_historical_patterns(symbol),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return context

    def store_analysis(self, symbol: str, result: dict) -> None:
        """Store analysis result in short-term memory.

        Per Vol. IV §4.4: Short-Term Memory
        Maintains awareness of recent analytical activity.
        """
        if symbol not in self._short_term:
            self._short_term[symbol] = []

        # Keep last 10 analyses per symbol in short-term memory
        self._short_term[symbol].append({
            "recommendation": result.get("recommendation"),
            "confidence": result.get("confidence"),
            "timestamp": result.get("timestamp"),
            "agent_consensus": result.get("agent_consensus"),
        })

        if len(self._short_term[symbol]) > 10:
            self._short_term[symbol] = self._short_term[symbol][-10:]

        logger.info(f"Stored analysis in short-term memory for {symbol}")

    def get_learning_context(self, symbol: str) -> str:
        """Generate a learning context string for agents.

        This provides agents with awareness of recent analyses,
        helping them identify patterns and avoid contradictions.
        """
        recent = self._get_recent_analyses(symbol)
        if not recent:
            return ""

        context_parts = ["Recent analysis history for this symbol:"]
        for i, analysis in enumerate(recent[-5:], 1):
            rec = analysis.get("recommendation", "unknown")
            conf = analysis.get("confidence", 0)
            ts = analysis.get("timestamp", "unknown")
            context_parts.append(
                f"  {i}. {rec.upper()} (confidence: {conf}%) at {ts}"
            )

        # Add pattern detection
        patterns = self._detect_patterns(recent)
        if patterns:
            context_parts.append("Detected patterns:")
            for p in patterns:
                context_parts.append(f"  - {p}")

        return "\n".join(context_parts)

    def _get_recent_analyses(self, symbol: str) -> list[dict]:
        """Get recent analyses from short-term memory."""
        return self._short_term.get(symbol, [])

    def _get_historical_patterns(self, symbol: str) -> list[str]:
        """Detect patterns from historical analyses."""
        recent = self._get_recent_analyses(symbol)
        return self._detect_patterns(recent)

    def _detect_patterns(self, analyses: list[dict]) -> list[str]:
        """Detect patterns in recent analyses."""
        patterns = []

        if len(analyses) < 2:
            return patterns

        # Check for consistent direction
        recent_recs = [a.get("recommendation") for a in analyses[-5:]]
        bullish_count = recent_recs.count("buy")
        bearish_count = recent_recs.count("sell")

        if bullish_count >= 3:
            patterns.append("Consistent bullish bias in recent analyses")
        elif bearish_count >= 3:
            patterns.append("Consistent bearish bias in recent analyses")

        # Check for improving/degrading confidence
        confidences = [a.get("confidence", 0) for a in analyses[-3:]]
        if len(confidences) >= 2:
            if confidences[-1] > confidences[0]:
                patterns.append("Confidence trend: improving")
            elif confidences[-1] < confidences[0]:
                patterns.append("Confidence trend: degrading")

        return patterns
