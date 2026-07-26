"""
Retrieval-Augmented Generation (RAG) Engine
Per MEIDS Chapter 16: AI Knowledge Base, RAG & Institutional Research

"An intelligent system is not one that knows everything.
It is one that knows where to find trustworthy knowledge,
how to verify it, and when not to answer."

This engine:
- Stores institutional trading knowledge
- Retrieves relevant knowledge for each analysis
- Provides context to agents for better reasoning
- Supports knowledge versioning and verification
"""

import json
import logging
from typing import Any
from openai import AsyncOpenAI
import os

logger = logging.getLogger(__name__)


class KnowledgeDocument:
    """A single piece of institutional knowledge."""

    def __init__(self, title: str, content: str, category: str, source: str = "internal"):
        self.title = title
        self.content = content
        self.category = category
        self.source = source
        self.reliability = self._assess_reliability(source)

    def _assess_reliability(self, source: str) -> str:
        if source == "internal":
            return "verified"
        elif source == "institutional":
            return "high"
        elif source == "research":
            return "moderate"
        return "unverified"


# Institutional Knowledge Base — verified trading knowledge
KNOWLEDGE_BASE = {
    "market_structure": [
        KnowledgeDocument(
            "Break of Structure (BOS)",
            "A Break of Structure occurs when price breaks past a previous swing high (in an uptrend) or swing low (in a downtrend). BOS signals trend continuation. In an uptrend, a BOS above the previous high confirms buyers are still in control. In a downtrend, a BOS below the previous low confirms sellers are in control.",
            "technical", "institutional"
        ),
        KnowledgeDocument(
            "Change of Character (CHoCH)",
            "A Change of Character occurs when price breaks the most recent swing low in an uptrend or swing high in a downtrend. CHoCH signals a potential trend reversal. It is the first sign that the current trend may be ending. CHoCH is more significant on higher timeframes.",
            "technical", "institutional"
        ),
        KnowledgeDocument(
            "Order Blocks",
            "An Order Block is the last opposing candle before a strong price move. In an uptrend, the last bearish candle before a strong bullish move is a bullish Order Block. Institutional orders are often placed at these levels. When price returns to an Order Block, it often reacts. Order Blocks that have been tested multiple times (mitigated) become weaker.",
            "smart_money", "institutional"
        ),
        KnowledgeDocument(
            "Fair Value Gaps (FVG)",
            "A Fair Value Gap is an imbalance in price where the market moved too quickly, leaving a gap between candle wicks. Bullish FVG: the low of candle 3 is above the high of candle 1. Bearish FVG: the high of candle 3 is below the low of candle 1. Price tends to return to fill these gaps before continuing. FVGs act as magnets for price.",
            "smart_money", "institutional"
        ),
    ],
    "liquidity": [
        KnowledgeDocument(
            "Liquidity Pools",
            "Liquidity pools are areas where stop losses cluster. Equal highs form buy-side liquidity (stops above). Equal lows form sell-side liquidity (stops below). Smart money targets these pools to fill large orders. When a liquidity pool is swept (price takes out the level and reverses), it's called a liquidity grab or stop hunt.",
            "smart_money", "institutional"
        ),
        KnowledgeDocument(
            "Stop Hunts",
            "A stop hunt occurs when price is engineered to trigger stop losses before reversing. Smart money creates liquidity by pushing price to obvious levels where retail stops are placed. After taking the liquidity, price reverses in the intended direction. Stop hunts are more common during low-liquidity sessions (Asian session for major pairs).",
            "smart_money", "institutional"
        ),
    ],
    "risk_management": [
        KnowledgeDocument(
            "Risk Per Trade Rule",
            "Never risk more than 1-2% of your account on a single trade. If your account is $10,000, maximum risk per trade is $100-$200. This ensures you can survive losing streaks without significant drawdown. A 10-trade losing streak with 2% risk only loses 18% of account (recoverable), while 10% risk would lose 65% (catastrophic).",
            "risk", "institutional"
        ),
        KnowledgeDocument(
            "Risk/Reward Ratio",
            "Always aim for a minimum 1:2 risk/reward ratio. If you risk 20 pips, your target should be at least 40 pips. With a 1:2 R:R, you only need to be right 34% of the time to break even. With 1:3 R:R, you only need 25% win rate. Higher R:R ratios give you more margin for error.",
            "risk", "institutional"
        ),
    ],
    "sessions": [
        KnowledgeDocument(
            "Trading Sessions",
            "Asian Session (00:00-09:00 UTC): Lower volatility, range-bound. JPY/AUD/NZD active. London Session (07:00-16:00 UTC): High volatility, trend initiation. EUR/GBP active. New York Session (12:00-21:00 UTC): High volatility, USD active. London-NY Overlap (12:00-16:00 UTC): Highest volatility and liquidity. Best time for breakouts and trend trades.",
            "market_behavior", "institutional"
        ),
    ],
    "central_banks": [
        KnowledgeDocument(
            "Federal Reserve (Fed)",
            "The Federal Reserve is the central bank of the United States. It controls the federal funds rate, which influences the US dollar. Hawkish policy (rate hikes) strengthens USD. Dovish policy (rate cuts) weakens USD. FOMC meetings 8 times per year. Powell's speeches move markets significantly.",
            "fundamental", "institutional"
        ),
        KnowledgeDocument(
            "European Central Bank (ECB)",
            "The ECB manages the Euro. Main refinancing rate is the key rate. Lagarde's press conferences after rate decisions move EUR pairs significantly. ECB tends to be more cautious than the Fed.",
            "fundamental", "institutional"
        ),
    ],
}


class RAGEngine:
    """Retrieval-Augmented Generation engine for institutional knowledge.

    Per MEIDS §16.10: "When a question arrives, the Retrieval Engine:
    determines intent, identifies relevant domains, searches vectors,
    searches structured databases, searches memory, ranks results,
    filters duplicates, returns the highest-quality evidence."
    """

    def __init__(self):
        api_key = os.environ.get("ZAI_API_KEY")
        base_url = os.environ.get("ZAI_BASE_URL", "https://api.z.ai/api/paas/v4")
        if api_key:
            self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        else:
            self.client = None
        self.model = os.environ.get("ZAI_MODEL", "glm-4.5-flash")

    def retrieve(self, query: str, categories: list[str] = None, top_k: int = 3) -> list[dict]:
        """Retrieve relevant knowledge documents.

        Per MEIDS §16.10: Retrieval with relevance ranking.
        """
        results = []
        search_categories = categories or list(KNOWLEDGE_BASE.keys())

        for category in search_categories:
            docs = KNOWLEDGE_BASE.get(category, [])
            for doc in docs:
                relevance = self._calculate_relevance(query, doc)
                if relevance > 0.1:  # Minimum relevance threshold
                    results.append({
                        "title": doc.title,
                        "content": doc.content,
                        "category": doc.category,
                        "source": doc.source,
                        "reliability": doc.reliability,
                        "relevance": relevance,
                    })

        # Sort by relevance, return top_k
        results.sort(key=lambda x: x["relevance"], reverse=True)
        return results[:top_k]

    def get_agent_context(self, agent_category: str, symbol: str = "") -> str:
        """Get knowledge context for a specific agent category.

        Per MEIDS §16.2: Knowledge Architecture — agents receive
        relevant knowledge before reasoning begins.
        """
        category_map = {
            "technical_analysis": ["market_structure"],
            "smart_money": ["market_structure", "liquidity"],
            "liquidity": ["liquidity", "market_structure"],
            "sentiment": ["sessions", "central_banks"],
            "risk": ["risk_management"],
            "fundamental": ["central_banks"],
            "market_behavior": ["sessions", "market_structure"],
            "recommendation": ["risk_management"],
            "psychology": ["risk_management"],
            "devils_advocate": ["market_structure", "liquidity", "risk_management"],
            "historical": ["market_structure"],
        }

        categories = category_map.get(agent_category, [])
        docs = self.retrieve(f"{symbol} analysis", categories, top_k=2)

        if not docs:
            return ""

        context_parts = ["Relevant institutional knowledge:"]
        for doc in docs:
            context_parts.append(f"• {doc['title']}: {doc['content'][:200]}...")

        return "\n".join(context_parts)

    def _calculate_relevance(self, query: str, doc: KnowledgeDocument) -> float:
        """Simple keyword-based relevance scoring.

        In production, this would use vector embeddings for semantic search.
        For now, we use keyword matching.
        """
        query_lower = query.lower()
        doc_text = f"{doc.title} {doc.content}".lower()

        # Count keyword matches
        query_words = set(query_lower.split())
        doc_words = set(doc_text.split())
        common = query_words.intersection(doc_words)

        if not query_words:
            return 0

        # Basic relevance score
        keyword_score = len(common) / len(query_words)

        # Boost for category match
        category_boost = 0.2 if doc.category in query_lower else 0

        return min(1.0, keyword_score + category_boost)

    def get_all_categories(self) -> list[str]:
        """List all knowledge categories."""
        return list(KNOWLEDGE_BASE.keys())

    def get_document_count(self) -> int:
        """Get total number of documents."""
        return sum(len(docs) for docs in KNOWLEDGE_BASE.values())
