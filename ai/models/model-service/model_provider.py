"""
Provider-agnostic AI model contract, per Implementation Guide Vol. V
Section 5.9-5.10: "The application shall not directly depend on one
provider." Mirrors the same pattern already used for market data
(market-data-provider.interface.ts in market-service) - any future
provider (a different one, or a second model from the same provider)
implements this same interface, and nothing else in this service or in
agent-service needs to change.

`model` is optional and provider-specific (e.g. a Cerebras model name).
This exists specifically so different specialist agents can request a
different underlying model for their task (per Implementation Guide
Vol. V Section 5.5's "required knowledge" per agent) without any of them
needing to know which provider is behind the scenes.
"""

from abc import ABC, abstractmethod
from typing import Optional


class ModelProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
    ) -> str:
        """Send a prompt to the model and return its raw text response."""
        raise NotImplementedError
