"""
Provider-agnostic AI model contract, per Implementation Guide Vol. V
Section 5.9-5.10: "The application shall not directly depend on one
provider." Mirrors the same pattern already used for market data
(market-data-provider.interface.ts in market-service) - any future
provider (OpenAI, Gemini, a local model) implements this same interface,
and nothing else in this service or in agent-service needs to change.
"""

from abc import ABC, abstractmethod


class ModelProvider(ABC):
    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Send a prompt to the model and return its raw text response."""
        raise NotImplementedError
