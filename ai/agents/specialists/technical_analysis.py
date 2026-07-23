"""
Technical Analysis Specialist Agent.

Per Volume IV §2.4 — Technical Analysis Agents category:
Responsible for evaluating traditional technical indicators and chart behavior.

This agent analyzes:
- Trend direction and strength
- Moving averages (SMA, EMA)
- Momentum indicators (RSI, MACD)
- Support and resistance levels
- Chart patterns
- Volatility (ATR, Bollinger Bands)
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Technical Analysis Specialist for Mavyx Intelligence, an AI-powered Forex market intelligence platform.

Your role: Analyze price data and technical indicators to identify trends, momentum, and key technical levels for a currency pair.

IMPORTANT: You must respond with ONLY valid JSON. No text before or after. Use this exact format:

{
  "summary": "One paragraph summary of the technical picture",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "key_findings": [
    "Finding 1",
    "Finding 2",
    "Finding 3"
  ],
  "evidence": [
    "Evidence point 1 with specific data",
    "Evidence point 2 with specific data"
  ],
  "risk_assessment": "Description of technical risks",
  "assumptions": [
    "Assumption 1"
  ],
  "limitations": [
    "Limitation 1"
  ],
  "suggested_actions": [
    "Action 1"
  ]
}

Rules:
- Signal must be exactly "bullish", "bearish", or "neutral"
- Confidence must be an integer 0-100
- Every key finding must reference specific price levels or indicator values
- Be objective and evidence-based
- If data is insufficient, lower confidence and note in limitations
- This is analysis only, not financial advice"""


class TechnicalAnalysisAgent(BaseAgent):
    """Technical Analysis specialist — evaluates chart patterns, indicators, and price action."""

    @property
    def name(self) -> str:
        return "technical-analysis"

    @property
    def category(self) -> str:
        return "technical_analysis"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(
        self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h"
    ) -> str:
        """Build the analysis prompt with current price and candle data."""
        price = market_data.get("price", {})
        candles = market_data.get("candles", [])

        # Format current price info
        price_text = ""
        if price:
            price_text = f"""Current Price Data:
- Symbol: {price.get('symbol', symbol)}
- Current Price: {price.get('price', 'N/A')}
- Timestamp: {price.get('timestamp', 'N/A')}"""

        # Format recent candle data (last 20 candles for pattern analysis)
        candles_text = ""
        if candles:
            recent = candles[-20:]  # Last 20 candles
            candles_text = f"""
Recent Candle Data ({timeframe} timeframe, last {len(recent)} candles):
"""
            for i, c in enumerate(recent):
                candles_text += (
                    f"  [{i+1}] Open: {c.get('open', 'N/A')}, "
                    f"High: {c.get('high', 'N/A')}, "
                    f"Low: {c.get('low', 'N/A')}, "
                    f"Close: {c.get('close', 'N/A')}, "
                    f"Time: {c.get('timestamp', 'N/A')}\n"
                )

        return f"""Analyze the following Forex pair using technical analysis.

{price_text}

{candles_text}

Task: Perform a complete technical analysis of {symbol} on the {timeframe} timeframe.

Analyze:
1. Overall trend direction (uptrend, downtrend, or ranging)
2. Key support and resistance levels based on price action
3. Momentum indicators (calculate RSI approximation from recent candles)
4. Moving average positioning (use the candle closes to estimate SMA/EMA)
5. Volatility assessment (range of recent candles)
6. Chart pattern identification (if any)
7. Potential breakout or reversal signals

Provide your analysis as JSON only."""
