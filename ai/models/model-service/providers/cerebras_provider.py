import os
from typing import Optional
from cerebras.cloud.sdk import AsyncCerebras
from model_provider import ModelProvider

# Cerebras' free-tier model lineup changes fairly often (models get
# deprecated with a few weeks' notice - see PROJECT_REPORT.md for the
# research trail). "gpt-oss-120b" is Cerebras' current production-tier
# model as of this writing - check https://inference-docs.cerebras.ai/models/overview
# before assuming this is still accurate months from now.
DEFAULT_MODEL = "gpt-oss-120b"


class CerebrasProvider(ModelProvider):
    """Concrete ModelProvider implementation for Cerebras Cloud.
    Chosen because it has a genuinely free tier (1M tokens/day, no
    credit card) and very fast inference, which matters for a multi-agent
    system that may make several sequential AI calls per recommendation.
    Docs: https://inference-docs.cerebras.ai/
    """

    def __init__(self) -> None:
        api_key = os.environ.get("CEREBRAS_API_KEY")
        if not api_key or api_key == "paste_your_cerebras_api_key_here":
            raise RuntimeError(
                "CEREBRAS_API_KEY is not set - get a free key at "
                "https://cloud.cerebras.ai/ and add it to .env"
            )
        self._client = AsyncCerebras(api_key=api_key)

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
    ) -> str:
        response = await self._client.chat.completions.create(
            model=model or DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content
