import os
import google.generativeai as genai
from model_provider import ModelProvider

DEFAULT_MODEL = "gemini-1.5-flash"


class GeminiProvider(ModelProvider):
    """Concrete ModelProvider implementation for Google Gemini.
    Chosen for now because it has a genuinely free tier with no credit
    card required, unlike Anthropic/OpenAI which need prepaid credits.
    Docs: https://ai.google.dev/gemini-api/docs
    """

    def __init__(self) -> None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key or api_key == "paste_your_gemini_api_key_here":
            raise RuntimeError(
                "GEMINI_API_KEY is not set - get a free key at "
                "https://aistudio.google.com/apikey and add it to .env"
            )
        genai.configure(api_key=api_key)
        self._model_name = DEFAULT_MODEL

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        model = genai.GenerativeModel(
            model_name=self._model_name,
            system_instruction=system_prompt,
        )
        response = await model.generate_content_async(user_prompt)
        return response.text
