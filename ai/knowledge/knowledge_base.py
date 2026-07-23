"""
Knowledge Intelligence Layer — domain expertise for AI agents.

Per Volume IV §4.5: Knowledge Intelligence Layer
"Provides domain expertise to AI agents. Knowledge sources include:
Financial market theory, Technical analysis principles, Smart Money
Concepts, ICT methodologies, Macroeconomic concepts, Risk management
frameworks."

Per Volume IV §4.4: Long-Term Memory
"Stores persistent information used across multiple analytical sessions:
Financial concepts, Trading methodologies, Institutional trading
principles, Historical market behaviors, Best practices."

Knowledge is version-controlled and reviewed for accuracy.
"""

from typing import Any


class KnowledgeBase:
    """Provides domain knowledge to specialist agents.

    Per Vol. IV §4.5, knowledge shall be version-controlled
    and reviewed to ensure accuracy and consistency.

    This initial implementation provides core financial knowledge
    that agents can reference in their prompts. Future versions
    will support RAG (Retrieval-Augmented Generation) for
    dynamic knowledge retrieval.
    """

    VERSION = "1.0.0"

    # Core financial knowledge organized by domain
    KNOWLEDGE = {
        "technical_analysis": {
            "concepts": [
                "Support and Resistance: Price levels where buying or selling pressure historically emerges. Support acts as a floor, resistance as a ceiling.",
                "Trend Analysis: Uptrends make higher highs and higher lows. Downtrends make lower highs and lower lows. Ranging markets move sideways.",
                "Moving Averages: SMA gives equal weight to all periods. EMA gives more weight to recent prices. Common periods: 20, 50, 100, 200.",
                "RSI (Relative Strength Index): Momentum oscillator (0-100). Above 70 = overbought. Below 30 = oversold. Divergence signals potential reversals.",
                "MACD: Trend-following momentum indicator. Signal line crossovers indicate potential entry/exit points. Histogram shows momentum strength.",
                "Candlestick Patterns: Doji (indecision), hammer (reversal), engulfing (strong reversal), pin bar (rejection of price level).",
                "Chart Patterns: Head and shoulders (reversal), double top/bottom, triangles (continuation), flags and pennants.",
            ],
            "timeframe_hierarchy": {
                "1m": "Scalping",
                "5m": "Scalping/Day trading",
                "15m": "Day trading",
                "1h": "Intraday swing",
                "4h": "Swing trading (primary)",
                "1d": "Position trading",
                "1w": "Long-term analysis",
            },
        },
        "smart_money_concepts": {
            "concepts": [
                "Market Structure: The sequence of swing highs and swing lows. Break of Structure (BOS) signals trend continuation. Change of Character (CHoCH) signals potential reversal.",
                "Order Blocks: The last opposing candle before a strong price move. Institutional orders are often placed at these levels.",
                "Fair Value Gaps (FVG): Imbalances where price moved too fast, leaving gaps between candle wicks. Price tends to return to fill these gaps.",
                "Liquidity Pools: Areas where stop losses cluster (equal highs/lows). Smart money targets these areas before reversing.",
                "Premium/Discount Zones: Above 50% of a range = premium (sell zone). Below 50% = discount (buy zone).",
                "Institutional Candle: Large-body candle with small wicks, indicating strong institutional participation.",
                "Mitigation Block: An order block that has been revisited and 'mitigated' — its effectiveness is reduced.",
            ],
        },
        "risk_management": {
            "principles": [
                "Never risk more than 1-2% of account on a single trade.",
                "Always use a stop loss — no trade should have unlimited downside.",
                "Risk/Reward ratio should be at least 1:2 (risk 1 unit to gain 2).",
                "Position size = (Account Risk % × Account Balance) / (Entry - Stop Loss).",
                "Avoid trading during major news events unless specifically designed for it.",
                "Don't revenge trade — accept losses as part of the process.",
                "Diversify across uncorrelated pairs to reduce portfolio risk.",
            ],
        },
        "macroeconomic": {
            "high_impact_events": [
                "Non-Farm Payrolls (NFP) — First Friday of each month. Major USD impact.",
                "Federal Reserve Interest Rate Decisions — 8 times per year. Major USD impact.",
                "ECB Interest Rate Decisions — 8 times per year. Major EUR impact.",
                "GDP Reports — Quarterly. Measures economic growth.",
                "CPI/Inflation Data — Monthly. Influences central bank policy.",
                "Employment Data — Monthly. Key economic health indicator.",
                "Central Bank Press Conferences — Forward guidance impacts markets.",
            ],
            "interest_rate_impact": {
                "rate_hike": "Generally strengthens the currency",
                "rate_cut": "Generally weakens the currency",
                "hawkish_rhetoric": "Expectations of future rate hikes — strengthens currency",
                "dovish_rhetoric": "Expectations of rate cuts — weakens currency",
            },
        },
        "forex_basics": {
            "major_pairs": [
                "EUR/USD — Euro vs US Dollar (most liquid)",
                "GBP/USD — British Pound vs US Dollar",
                "USD/JPY — US Dollar vs Japanese Yen",
                "USD/CHF — US Dollar vs Swiss Franc",
                "AUD/USD — Australian Dollar vs US Dollar",
                "USD/CAD — US Dollar vs Canadian Dollar",
                "NZD/USD — New Zealand Dollar vs US Dollar",
            ],
            "sessions": {
                "asian": "00:00-09:00 UTC — Lower volatility, JPY/AUD/NZD active",
                "london": "07:00-16:00 UTC — High volatility, EUR/GBP active",
                "new_york": "12:00-21:00 UTC — High volatility, USD active",
                "overlap_london_ny": "12:00-16:00 UTC — Highest volatility and liquidity",
            },
        },
    }

    def get_knowledge(self, domain: str) -> dict[str, Any]:
        """Retrieve knowledge for a specific domain."""
        return self.KNOWLEDGE.get(domain, {})

    def get_agent_knowledge(self, agent_category: str) -> str:
        """Get formatted knowledge context for a specific agent category.

        This is injected into agent prompts to provide domain expertise.
        Per Vol. IV §4.6: Prompt Architecture — Knowledge Context section.
        """
        knowledge_map = {
            "technical_analysis": ["technical_analysis", "forex_basics"],
            "smart_money": ["smart_money_concepts", "technical_analysis", "forex_basics"],
            "sentiment": ["macroeconomic", "forex_basics"],
            "risk": ["risk_management", "technical_analysis", "forex_basics"],
            "fundamental": ["macroeconomic", "forex_basics"],
            "market_behavior": ["technical_analysis", "smart_money_concepts", "forex_basics"],
            "recommendation": ["risk_management", "technical_analysis"],
        }

        domains = knowledge_map.get(agent_category, ["forex_basics"])
        context_parts = []

        for domain in domains:
            knowledge = self.KNOWLEDGE.get(domain, {})
            if knowledge:
                context_parts.append(f"--- {domain.upper().replace('_', ' ')} ---")
                for key, value in knowledge.items():
                    if isinstance(value, list):
                        for item in value:
                            context_parts.append(f"• {item}")
                    elif isinstance(value, dict):
                        for k, v in value.items():
                            context_parts.append(f"• {k}: {v}")

        return "\n".join(context_parts)

    def get_all_domains(self) -> list[str]:
        """List all available knowledge domains."""
        return list(self.KNOWLEDGE.keys())
