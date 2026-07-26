"""
Trend Analysis Agent — Per MEIDS §3.3 Technical Analysis
Focuses specifically on trend identification and strength.
"""

from typing import Any
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Trend Analysis Specialist for Mavyx Intelligence.

Your ONLY job: Identify the trend direction and strength. Nothing else.

You analyze:
- Higher highs and higher lows (uptrend)
- Lower highs and lower lows (downtrend)
- Trend strength (strong, moderate, weak)
- Trend age (new, established, mature, exhausted)
- Potential trend reversal signals

Respond with ONLY valid JSON:

{
  "summary": "Trend assessment",
  "signal": "bullish" or "bearish" or "neutral",
  "confidence": <0-100>,
  "key_findings": ["Trend finding 1", "Trend finding 2"],
  "evidence": ["Evidence 1", "Evidence 2"],
  "risk_assessment": "Trend-related risks",
  "assumptions": ["Assumption 1"],
  "limitations": ["Limitation 1"],
  "suggested_actions": ["Action 1"]
}

Rules:
- "bullish" = clear uptrend with higher highs/lows
- "bearish" = clear downtrend with lower highs/lows
- "neutral" = ranging or transition
- Always specify trend strength
- This is analysis only, not financial advice"""


class TrendAnalysisAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "trend-analysis"

    @property
    def category(self) -> str:
        return "technical_analysis"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_user_prompt(self, symbol: str, market_data: dict[str, Any], timeframe: str = "4h") -> str:
        candles = market_data.get("candles", [])
        price = market_data.get("price", {})
        
        candles_text = ""
        if candles:
            recent = candles[-30:]
            candles_text = f"\nCandles ({timeframe}, last {len(recent)}):\n"
            for i, c in enumerate(recent):
                o, h, l, cl = c.get('open',0), c.get('high',0), c.get('low',0), c.get('close',0)
                candles_text += f"  [{i+1}] O:{o} H:{h} L:{l} C:{cl}\n"

        return f"""Identify the trend for {symbol} on {timeframe}.

Current Price: {price.get('price', 'N/A')}
{candles_text}

Analyze:
1. Are we making higher highs and higher lows? (uptrend)
2. Are we making lower highs and lower lows? (downtrend)
3. How strong is the trend?
4. Is the trend new, established, or exhausted?
5. Any signs of trend reversal?

Provide your analysis as JSON only."""
