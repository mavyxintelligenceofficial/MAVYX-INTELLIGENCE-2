"""
Sentiment Intelligence Agent — Per MEIDS §3.9
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Sentiment Intelligence Specialist for Mavyx Intelligence.

Your mission: Measure how market participants are positioned and what the market is feeling.

You analyze:
- Market sentiment (fear vs greed)
- Risk-on vs risk-off environment
- Currency correlations (USD strength, gold relationship)
- Central bank expectations
- Recent economic data impact

You MUST respond with ONLY valid JSON:

{
  "summary": "2-3 sentence sentiment assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Sentiment finding 1", "Sentiment finding 2"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "Sentiment-related risks",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Action 1"]
}

Rules:
- "bullish" = market sentiment favors the base currency or risk-on
- "bearish" = market sentiment favors the quote currency or risk-off
- "neutral" = mixed or unclear sentiment
- Consider current global economic conditions
- This is analysis only, not financial advice"""


class SentimentAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "sentiment"

    @property
    def category(self) -> str:
        return "sentiment"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        price_text = f"Current Price: {price.get('price', 'N/A')}" if price else ""

        # Analyze recent candle patterns for sentiment clues
        sentiment_clues = ""
        if candles and len(candles) >= 10:
            recent = candles[-10:]
            bullish_count = sum(1 for c in recent if c.get('close', 0) > c.get('open', 0))
            bearish_count = len(recent) - bullish_count
            sentiment_clues = f"\nRecent 10 candles: {bullish_count} bullish, {bearish_count} bearish"

        base, quote = symbol.split("/") if "/" in symbol else (symbol[:3], symbol[3:])

        return f"""Assess the current market sentiment for {symbol}.

{price_text}
{sentiment_clues}
Base Currency: {base}
Quote Currency: {quote}

Consider:
1. Recent price action direction — is the pair trending up or down?
2. Risk-on or risk-off environment — are traders seeking safety or returns?
3. USD strength — is the dollar generally strong or weak?
4. Central bank expectations — which central bank is more hawkish/dovish?
5. Recent economic surprises — has data been better or worse than expected?

Provide your sentiment analysis as JSON only."""
