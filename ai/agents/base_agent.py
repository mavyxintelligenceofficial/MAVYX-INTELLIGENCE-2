"""
Base class for all specialist AI agents.

Per Volume IV (AI System Design Blueprint):
- Section 2.6: Standard AI Agent Architecture
- Section 2.5: Responsibilities of Every AI Agent
- Section 2.9: Standard AI Output Format
- Section 2.10: Agent Independence

Every specialist agent extends this base class and implements:
  - name: unique agent identifier
  - category: analytical domain (technical, smart_money, etc.)
  - system_prompt: defines the agent's expertise and output format
  - build_user_prompt(): constructs the analysis request with market context

The base class handles:
  - Calling the AI provider (model-service)
  - Parsing structured JSON output from the AI response
  - Standardizing the output format (12 required fields per Vol. IV §2.9)
  - Error handling and fallback behavior
  - Audit logging
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Optional
import json
import re
import logging

logger = logging.getLogger(__name__)


class AgentOutput:
    """Standardized agent output with the 12 required fields per Vol. IV §2.9."""

    def __init__(
        self,
        agent_id: str,
        symbol: str,
        timeframe: str,
        summary: str,
        signal: str,  # bullish, bearish, neutral
        confidence: int,  # 0-100
        key_findings: list[str],
        evidence: list[str],
        risk_assessment: str,
        assumptions: list[str],
        limitations: list[str],
        suggested_actions: list[str],
        raw_response: str = "",
    ):
        self.agent_id = agent_id
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.symbol = symbol
        self.timeframe = timeframe
        self.summary = summary
        self.signal = signal
        self.confidence = confidence
        self.key_findings = key_findings
        self.evidence = evidence
        self.risk_assessment = risk_assessment
        self.assumptions = assumptions
        self.limitations = limitations
        self.suggested_actions = suggested_actions
        self.raw_response = raw_response

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "agent_id": self.agent_id,
            "timestamp": self.timestamp,
            "symbol": self.symbol,
            "timeframe": self.timeframe,
            "summary": self.summary,
            "signal": self.signal,
            "confidence": self.confidence,
            "key_findings": self.key_findings,
            "evidence": self.evidence,
            "risk_assessment": self.risk_assessment,
            "assumptions": self.assumptions,
            "limitations": self.limitations,
            "suggested_actions": self.suggested_actions,
        }


class BaseAgent(ABC):
    """Abstract base class for all specialist AI agents.

    Per Volume IV §2.10, agents are fully independent — they can use
    different prompts, reasoning strategies, knowledge sources, and even
    different AI providers.

    Subclasses MUST implement:
      - name (property)
      - category (property)
      - system_prompt (property)
      - build_user_prompt(symbol, market_data, timeframe) -> str
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique agent identifier (e.g. 'technical-analysis')."""
        ...

    @property
    @abstractmethod
    def category(self) -> str:
        """Analytical domain category."""
        ...

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """System prompt defining this agent's expertise and output format."""
        ...

    @abstractmethod
    def build_user_prompt(
        self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h"
    ) -> str:
        """Build the user prompt with market context for analysis."""
        ...

    async def analyze(
        self,
        provider: Any,
        symbol: str,
        market_data: dict[str, Any],
        timeframe: str = "4h",
        model: Optional[str] = None,
    ) -> AgentOutput:
        """Run the agent analysis and return a standardized output.

        This is the main entry point called by the orchestrator.
        Per Vol. IV §2.5, every agent shall:
          1. Receive standardized analytical input
          2. Validate input quality
          3. Apply domain-specific reasoning
          4. Produce structured findings
          5. Assign evidence
          6. Estimate confidence
          7. Identify uncertainty
          8. Submit results (via orchestrator)
        """
        logger.info(f"[{self.name}] Starting analysis for {symbol} ({timeframe})")

        try:
            # Build the prompt
            user_prompt = self.build_user_prompt(symbol, market_data, timeframe)

            # Call the AI provider
            raw_response = await provider.generate(
                system_prompt=self.system_prompt,
                user_prompt=user_prompt,
                model=model,
            )

            # Parse the structured output
            parsed = self._parse_output(raw_response)

            # Build standardized output
            output = AgentOutput(
                agent_id=self.name,
                symbol=symbol,
                timeframe=timeframe,
                summary=parsed.get("summary", "Analysis completed"),
                signal=self._validate_signal(parsed.get("signal", "neutral")),
                confidence=self._validate_confidence(parsed.get("confidence", 50)),
                key_findings=parsed.get("key_findings", []),
                evidence=parsed.get("evidence", []),
                risk_assessment=parsed.get("risk_assessment", "Not assessed"),
                assumptions=parsed.get("assumptions", []),
                limitations=parsed.get("limitations", []),
                suggested_actions=parsed.get("suggested_actions", []),
                raw_response=raw_response,
            )

            logger.info(
                f"[{self.name}] Completed: signal={output.signal}, "
                f"confidence={output.confidence}"
            )
            return output

        except Exception as e:
            logger.error(f"[{self.name}] Analysis failed: {e}")
            # Per Vol. IV §2.7 — one agent failing shouldn't kill the pipeline
            return self._create_error_output(symbol, timeframe, str(e))

    def _parse_output(self, raw: str) -> dict[str, Any]:
        """Extract JSON from the AI's response.

        The AI is instructed to return JSON, but it may wrap it in
        markdown code blocks or add explanatory text. This method
        handles all common patterns.
        """
        # Try direct JSON parse first
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Try to find JSON in markdown code blocks
        json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try to find JSON object in the text
        json_match = re.search(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", raw, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        # If all parsing fails, return a basic structure with the raw text
        logger.warning(f"[{self.name}] Could not parse JSON from response")
        return {
            "summary": raw[:500] if raw else "No response received",
            "signal": "neutral",
            "confidence": 30,
            "key_findings": [],
            "evidence": [],
            "risk_assessment": "Unable to parse structured output",
            "assumptions": [],
            "limitations": ["Response could not be parsed into structured format"],
            "suggested_actions": [],
        }

    @staticmethod
    def _validate_signal(signal: str) -> str:
        """Ensure signal is one of the valid values."""
        valid = {"bullish", "bearish", "neutral"}
        signal = signal.lower().strip()
        return signal if signal in valid else "neutral"

    @staticmethod
    def _validate_confidence(confidence: Any) -> int:
        """Ensure confidence is an integer between 0 and 100."""
        try:
            c = int(confidence)
            return max(0, min(100, c))
        except (ValueError, TypeError):
            return 50

    def _create_error_output(
        self, symbol: str, timeframe: str, error: str
    ) -> AgentOutput:
        """Create a fallback output when the agent fails."""
        return AgentOutput(
            agent_id=self.name,
            symbol=symbol,
            timeframe=timeframe,
            summary=f"Agent analysis failed: {error}",
            signal="neutral",
            confidence=0,
            key_findings=[],
            evidence=[],
            risk_assessment="Unable to assess — agent error",
            assumptions=[],
            limitations=[f"Agent error: {error}"],
            suggested_actions=[],
        )
