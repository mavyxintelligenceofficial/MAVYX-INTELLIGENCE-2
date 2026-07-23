import os
from anthropic import AsyncAnthropic
from model_provider import ModelProvider

DEFAULT_MODEL = "claude-sonnet-4-5"


class AnthropicProvider(ModelProvider):
    """Concrete ModelProvider implementation for Anthropic Claude.
    Docs: https://docs.anthropic.com/
    """

    def __init__(self) -> None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key or api_key == "paste_your_anthropic_api_key_here":
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set - get a key at "
                "https://console.anthropic.com/settings/keys and add it to .env"
            )
        self._client = AsyncAnthropic(api_key=api_key)

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        response = await self._client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        # Claude's response content is a list of blocks - a plain-text
        # agent response is a single text block, but we join defensively
        # in case that ever changes.
        return "".join(block.text for block in response.content if block.type == "text")
