"""
AI Assistant — The Admin of Mavyx Intelligence
Uses Z.ai API for real conversational AI.
Can take any action the user requests.

Per MEIDS: The AI is an intelligent advisor that helps users
navigate and use the platform effectively.
"""

import os
import json
import logging
from typing import Any, Optional
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Mavyx AI Assistant — the intelligent admin of the Mavyx Intelligence platform.

IDENTITY:
- You are a smart, helpful, conversational AI built into the Mavyx Intelligence platform
- You know EVERYTHING about the platform and can help users with anything
- You are friendly, professional, and can be fun/playful when appropriate
- You speak like ChatGPT or Claude — natural, helpful, intelligent

YOUR CAPABILITIES — You can perform these actions when the user asks:

1. NAVIGATION — Navigate to any page:
   - dashboard, workspace, markets, watchlist, journal, analytics, settings, health, profile

2. RUN ANALYSIS — Trigger AI analysis for any currency pair:
   - User says "analyze EUR/USD" or "run analysis" or "what do you think about GBP/USD"
   - You trigger the analysis and explain the results

3. SETTINGS — Help with settings:
   - Change display name
   - View account info

4. MARKET DATA — Get live prices and market information
   - User asks about any currency pair
   - You provide current market context

5. PLATFORM HELP — Explain any feature, navigate, troubleshoot

6. LOGOUT — Log the user out when asked

7. GENERAL CONVERSATION — Chat about trading, markets, the platform, anything

IMPORTANT RULES:
- When the user asks you to DO something (navigate, analyze, logout, etc.), respond with a JSON action block
- When the user asks a question, answer naturally and conversationally
- Always be helpful and never refuse a reasonable request
- You can be funny, playful, and engaging — like ChatGPT
- You know about all 11 AI agents, the Executive Decision Engine, the full platform

ACTION FORMAT:
When you need to perform an action, include this in your response:
```action
{"type": "navigate", "target": "/workspace"}
```
or
```action
{"type": "analyze", "symbol": "EUR/USD", "timeframe": "4h"}
```
or
```action
{"type": "logout"}
```
or
```action
{"type": "settings", "field": "displayName", "value": "New Name"}
```

Available action types:
- navigate: {"type": "navigate", "target": "/page-path"}
- analyze: {"type": "analyze", "symbol": "EUR/USD", "timeframe": "4h"}
- logout: {"type": "logout"}
- settings: {"type": "settings", "field": "displayName", "value": "..."}
- watchlist_add: {"type": "watchlist_add", "symbol": "EUR/USD"}
- watchlist_remove: {"type": "watchlist_remove", "symbol": "EUR/USD"}

After the action block, continue your natural response to the user.

BE CONVERSATIONAL. BE SMART. BE HELPFUL. BE FUN.
"""


class AIAssistant:
    """Real AI-powered assistant using Z.ai API."""

    def __init__(self):
        api_key = os.environ.get("ZAI_API_KEY")
        base_url = os.environ.get("ZAI_BASE_URL", "https://api.z.ai/api/paas/v4")
        model = os.environ.get("ZAI_MODEL", "glm-4.5-flash")

        if not api_key:
            raise RuntimeError("ZAI_API_KEY not set")

        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    async def chat(
        self,
        user_message: str,
        chat_history: list[dict[str, str]],
        context: dict[str, Any] = None,
    ) -> dict[str, Any]:
        """Process a chat message and return a response with optional action.

        Returns:
            {
                "response": "The AI's text response",
                "action": {"type": "navigate", "target": "/workspace"} or null
            }
        """
        # Build messages array
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add context about current state
        if context:
            context_text = self._build_context(context)
            messages.append({"role": "system", "content": f"Current user context:\n{context_text}"})

        # Add chat history (last 20 messages)
        for msg in chat_history[-20:]:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("text", msg.get("content", "")),
            })

        # Add current message
        messages.append({"role": "user", "content": user_message})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )

            raw_response = response.choices[0].message.content

            # Parse action from response
            action = self._extract_action(raw_response)
            clean_response = self._remove_action_block(raw_response)

            return {
                "response": clean_response,
                "action": action,
            }

        except Exception as e:
            logger.error(f"AI Assistant error: {e}")
            return {
                "response": f"I'm having trouble connecting right now. Please try again in a moment. ({str(e)[:50]})",
                "action": None,
            }

    def _build_context(self, context: dict[str, Any]) -> str:
        """Build context string for the AI."""
        parts = []

        if context.get("symbol"):
            parts.append(f"Current symbol: {context['symbol']}")
        if context.get("timeframe"):
            parts.append(f"Current timeframe: {context['timeframe']}")
        if context.get("user_name"):
            parts.append(f"User name: {context['user_name']}")
        if context.get("current_page"):
            parts.append(f"Current page: {context['current_page']}")
        if context.get("analysis_result"):
            result = context["analysis_result"]
            parts.append(f"Latest analysis: {result.get('symbol', 'N/A')} - {result.get('recommendation', 'N/A')} ({result.get('confidence', 0)}% confidence)")

        return "\n".join(parts) if parts else "No specific context available."

    def _extract_action(self, response: str) -> Optional[dict]:
        """Extract action block from AI response."""
        import re
        match = re.search(r'```action\s*\n?(.*?)\n?```', response, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                pass
        return None

    def _remove_action_block(self, response: str) -> str:
        """Remove the action block from the response text."""
        import re
        return re.sub(r'```action\s*\n?.*?\n?```\s*', '', response, flags=re.DOTALL).strip()
