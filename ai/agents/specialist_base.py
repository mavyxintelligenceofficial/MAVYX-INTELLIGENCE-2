"""
Base Specialist Agent — standardized I/O for all 10 specialist agents.

Per Rebuild Spec Section 2:
- Accepts standardized input envelope
- Returns standardized output schema
- Temperature 0.1-0.2 (pattern recognition, not creative writing)
- Confidence is a function of measurable inputs
- reasoning only references key_levels or input candles
- data_sufficient=false when insufficient data (never blank)
"""

import json
import re
import logging
from abc import ABC, abstractmethod
from typing import Any, Optional

logger = logging.getLogger(__name__)

SPECIALIST_SYSTEM_PROMPT_TEMPLATE = """You are the {agent_display_name} agent for Mavyx Intelligence, an AI-powered Forex market intelligence platform.

YOUR DOMAIN: {domain_description}

YOUR OUTPUT FORMAT — return ONLY valid JSON, no text before or after:
{{
  "agent": "{agent_name}",
  "bias": "bullish | bearish | neutral",
  "confidence": 0.0,
  "key_levels": [
    {{"price": 1.1389, "type": "{level_type_example}", "strength": "high | medium | low"}}
  ],
  "reasoning": "max 2 sentences, plain language, must reference key_levels prices only",
  "data_sufficient": true
}}

STRICT RULES:
1. NEVER output null, empty string, or omit a required field.
2. If you have insufficient data, set bias=neutral, confidence=0.0, data_sufficient=false, and explain why in reasoning.
3. reasoning may ONLY reference numbers from key_levels or the input candles. No macro narrative, no other agents' outputs.
4. confidence is a MEASURABLE function of the data: {confidence_formula}
5. Never use absolute language ("will", "guaranteed", "certain"). Use probabilistic framing ("likely", "X% confidence", "conditional on").
6. Never produce trade execution instructions or position sizing. Analysis only.
7. If candle data is empty or too short, set data_sufficient=false immediately.

{extra_instructions}"""


class SpecialistAgent(ABC):
    """Base class for all 10 specialist agents."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Agent identifier (e.g., 'market_structure')."""
        ...
    
    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable name."""
        ...
    
    @property
    @abstractmethod
    def domain_description(self) -> str:
        """What this agent analyzes."""
        ...
    
    @property
    @abstractmethod
    def level_type_example(self) -> str:
        """Example type for key_levels (e.g., 'demand_ob', 'support')."""
        ...
    
    @property
    @abstractmethod
    def confidence_formula(self) -> str:
        """How confidence is calculated from measurable inputs."""
        ...
    
    @property
    def extra_instructions(self) -> str:
        """Additional instructions specific to this agent."""
        return ""
    
    @property
    def min_candles(self) -> int:
        """Minimum candles needed for this agent to produce useful output."""
        return 20
    
    def build_system_prompt(self) -> str:
        """Build the full system prompt."""
        return SPECIALIST_SYSTEM_PROMPT_TEMPLATE.format(
            agent_display_name=self.display_name,
            agent_name=self.name,
            domain_description=self.domain_description,
            level_type_example=self.level_type_example,
            confidence_formula=self.confidence_formula,
            extra_instructions=self.extra_instructions,
        )
    
    @abstractmethod
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        """Build the user prompt with candle data."""
        ...
    
    async def analyze(
        self,
        symbol: str,
        candles: list,
        timeframe: str = "15m",
        context: Optional[dict] = None,
    ) -> str:
        """Run analysis — returns raw AI response (validated by queue).
        
        This method is called by the queue's agent_func.
        The queue handles retries, timeouts, caching, and validation.
        """
        # Early exit if insufficient candles
        if not candles or len(candles) < self.min_candles:
            return json.dumps({
                "agent": self.name,
                "bias": "neutral",
                "confidence": 0.0,
                "key_levels": [],
                "reasoning": f"Insufficient candle data: need {self.min_candles}, got {len(candles) if candles else 0}",
                "data_sufficient": False,
            })
        
        system_prompt = self.build_system_prompt()
        user_prompt = self.build_user_prompt(symbol, candles, timeframe, context)
        
        # The provider is injected by the queue/orchestrator
        # This method returns the raw string — the queue parses and validates
        return user_prompt  # Will be overridden by actual provider call
    
    def format_candles(self, candles: list, max_candles: int = 50) -> str:
        """Format candle data for the prompt. Limit to max_candles to save tokens."""
        subset = candles[-max_candles:] if len(candles) > max_candles else candles
        lines = []
        for i, c in enumerate(subset):
            if isinstance(c, dict):
                o = c.get('open', c.get('o', 0))
                h = c.get('high', c.get('h', 0))
                l = c.get('low', c.get('l', 0))
                cl = c.get('close', c.get('c', 0))
                v = c.get('volume', c.get('v', 0))
                lines.append(f"  [{i}] O:{o} H:{h} L:{l} C:{cl} V:{v}")
            elif isinstance(c, (list, tuple)) and len(c) >= 5:
                lines.append(f"  [{i}] O:{c[0]} H:{c[1]} L:{c[2]} C:{c[3]} V:{c[4]}")
        return "\n".join(lines)
