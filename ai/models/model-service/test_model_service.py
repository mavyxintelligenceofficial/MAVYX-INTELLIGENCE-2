import pytest
from typing import Optional
from model_provider import ModelProvider


class FakeProvider(ModelProvider):
    """A fake provider for testing the interface contract itself, with no
    real API key or network call needed - same spirit as the mocked
    Prisma client / mocked market provider used in the Node services'
    tests.
    """

    async def generate(
        self, system_prompt: str, user_prompt: str, model: Optional[str] = None
    ) -> str:
        return f"echo ({model or 'default'}): {user_prompt}"


@pytest.mark.asyncio
async def test_fake_provider_implements_the_contract():
    provider = FakeProvider()
    result = await provider.generate("You are a test.", "hello")
    assert result == "echo (default): hello"


@pytest.mark.asyncio
async def test_fake_provider_accepts_a_model_override():
    provider = FakeProvider()
    result = await provider.generate("You are a test.", "hello", model="some-model")
    assert result == "echo (some-model): hello"


def test_model_provider_cannot_be_instantiated_directly():
    # It's an abstract base class - this enforces that every real
    # provider must implement generate(), the same way TypeScript's
    # MarketDataProvider interface can't be used without implementing it.
    with pytest.raises(TypeError):
        ModelProvider()
