"""
News/Fundamental Context Agent — Synthesis Agent #11

Summarizes only verified external inputs.
Never invents macro narrative.
"""

import json
from typing import Optional
from agents.specialist_base import SpecialistAgent


class NewsFundamentalAgent(SpecialistAgent):
    @property
    def name(self) -> str: return "news_fundamental"
    @property
    def display_name(self) -> str: return "News/Fundamental Context"
    @property
    def domain_description(self) -> str:
        return "Summarize verified external inputs: economic calendar events, rate decisions, major headlines. This agent NEVER invents macro narrative — it only reports what was explicitly provided in the input data."
    @property
    def level_type_example(self) -> str: return "event_level"
    @property
    def confidence_formula(self) -> str:
        return "based on proximity of scheduled events and their expected market impact."
    @property
    def min_candles(self) -> int: return 1  # Doesn't need candles, but needs calendar data
    
    def build_user_prompt(self, symbol: str, candles: list, timeframe: str, context: Optional[dict] = None) -> str:
        calendar = context.get("economic_calendar", []) if context else []
        headlines = context.get("headlines", []) if context else []
        
        cal_str = "No calendar data provided."
        if calendar:
            cal_str = "\n".join([
                f"- {e.get('title', 'Event')} ({e.get('country', 'USD')}) Impact: {e.get('impact', 'unknown')} Date: {e.get('date', 'unknown')} Forecast: {e.get('forecast', 'N/A')} Previous: {e.get('previous', 'N/A')}"
                for e in calendar[:10]
            ])
        
        headline_str = "No headlines provided."
        if headlines:
            headline_str = "\n".join([f"- {h}" for h in headlines[:5]])
        
        # Provide a few candles for context but the agent should focus on calendar/headlines
        candle_str = ""
        if candles and len(candles) > 0:
            last = candles[-1]
            if isinstance(last, dict):
                candle_str = f"Current price context: O:{last.get('open',0)} H:{last.get('high',0)} L:{last.get('low',0)} C:{last.get('close',0)}"
        
        return f"""Analyze news and fundamental context for {symbol}.

UPCOMING ECONOMIC EVENTS:
{cal_str}

RECENT HEADLINES:
{headline_str}

PRICE CONTEXT:
{candle_str}

Analyze:
1. Upcoming high-impact events and their potential effect on {symbol}
2. Whether any recent headlines materially affect this pair
3. Risk level around scheduled events (high/medium/low)
4. Key timing considerations

IMPORTANT: Only reference events/headlines explicitly listed above. If no data was provided, set data_sufficient=false.

Return your analysis as JSON only."""
