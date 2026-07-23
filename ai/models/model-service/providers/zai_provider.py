"""
Provider implementation for Z.ai (Zhipu AI) GLM models.

Z.ai exposes an OpenAI-compatible API at https://api.z.ai/api/openai/v1,
so we reuse the OpenAI Python SDK with a custom base_url — zero protocol
boilerplate.  This is the same trick that lets every tool that speaks
OpenAI work with Z.ai without code changes (see PROJECT_REPORT.md for
the provider-agnostic design principle).

Default model: glm-4.7-flash (FREE, 200K context, no credit card).
Alternatives: glm-5.1 (flagship, paid), glm-4.7 (balanced, paid).
Pricing & models: https://docs.z.ai
"""

import os
from typing import Optional
from openai import AsyncOpenAI
from model_provider import ModelProvider

# GLM-4.5-Flash is free for all registered Z.ai accounts with a 128K
# context window.  GLM-4.7-Flash has 200K context but may hit rate
# limits on free tier.  For production-grade analysis, glm-5.1 is the
# flagship model (paid).
DEFAULT_MODEL = "glm-4.5-flash"


class ZaiProvider(ModelProvider):
    """Concrete ModelProvider for Z.ai (Zhipu AI) GLM models.

    Uses the OpenAI-compatible endpoint so the SDK handles all protocol
    details.  Swap DEFAULT_MODEL or pass model= to GenerateRequest to
    use a different GLM variant.
    """

    def __init__(self) -> None:
        api_key = os.environ.get("ZAI_API_KEY")
        if not api_key or api_key == "paste_your_zai_api_key_here":
            raise RuntimeError(
                "ZAI_API_KEY is not set — get a free key at "
                "https://z.ai/manage-apikey/apikey-list and add it to .env"
            )
        base_url = os.environ.get(
            "ZAI_BASE_URL", "https://api.z.ai/api/paas/v4"
        )
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)

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
