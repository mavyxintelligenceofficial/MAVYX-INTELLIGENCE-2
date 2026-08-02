"""
Knowledge Base — per-domain document store for specialist agents.

Rebuilt fresh per user instruction (previous version was former-AI work,
never wired into the live v2 pipeline, removed).

Per the user's own architecture note (agent knowledge levels 1-4):
"Instead of one giant knowledge base, give each agent its own specialized
RAG knowledge base... The Technical Agent only searches technical trading
documents. The Fundamental Agent only searches macroeconomic documents..."

Per Volume IV §4.5 (Knowledge Intelligence Layer), where the user's note
is silent: knowledge shall be version-controlled and reviewed for
accuracy and consistency.

Each domain is stored as its own JSON file under ai/knowledge/data/ -
this keeps domains genuinely isolated (an agent can only ever load its
own file, so there's no accidental cross-domain leakage) and needs no
external database or vector store to get started. Documents are plain
text with light metadata; ai/knowledge/rag_engine.py does the retrieval.

This ships with a small seed set of core concepts per domain so agents
have *something* to retrieve from day one, written fresh for this
rebuild - not copied from any prior version. Real growth is meant to
come from the user's own books, notes, and journal via add_document().
"""

import json
import os
import time
import uuid
from typing import Any, Optional

_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

VALID_DOMAINS = ["technical", "fundamental", "sentiment", "risk", "quant"]


def _domain_path(domain: str) -> str:
    if domain not in VALID_DOMAINS:
        raise ValueError(f"Unknown knowledge domain '{domain}' - must be one of {VALID_DOMAINS}")
    return os.path.join(_DATA_DIR, f"{domain}.json")


def _load_domain(domain: str) -> list[dict[str, Any]]:
    path = _domain_path(domain)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_domain(domain: str, documents: list[dict[str, Any]]) -> None:
    os.makedirs(_DATA_DIR, exist_ok=True)
    with open(_domain_path(domain), "w", encoding="utf-8") as f:
        json.dump(documents, f, indent=2)


def add_document(
    domain: str,
    title: str,
    content: str,
    source: str = "user",
) -> dict[str, Any]:
    """Add a document to a domain's knowledge base.

    source: 'user' (their notes/books/journal), 'seed' (built-in starter
    knowledge shipped with this rebuild), or 'institutional' (a named
    external reference). Reliability is derived from source, not
    asserted - a user's own verified trading rule is exactly as
    trustworthy as institutional reference material, an unlabeled
    scrape is not.
    """
    documents = _load_domain(domain)
    doc = {
        "id": str(uuid.uuid4())[:8],
        "title": title,
        "content": content,
        "source": source,
        "added_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    documents.append(doc)
    _save_domain(domain, documents)
    return doc


def list_documents(domain: str) -> list[dict[str, Any]]:
    return _load_domain(domain)


def delete_document(domain: str, doc_id: str) -> bool:
    documents = _load_domain(domain)
    filtered = [d for d in documents if d["id"] != doc_id]
    if len(filtered) == len(documents):
        return False
    _save_domain(domain, filtered)
    return True


def seed_if_empty() -> None:
    """Populate each domain with starter knowledge if it has none yet.
    Safe to call on every startup - only acts on genuinely empty domains,
    never overwrites or duplicates what's already there."""
    for domain, docs in _SEED_KNOWLEDGE.items():
        if not _load_domain(domain):
            for title, content in docs:
                add_document(domain, title, content, source="seed")


_SEED_KNOWLEDGE: dict[str, list[tuple[str, str]]] = {
    "technical": [
        ("Market Structure & Break of Structure",
         "Market structure is the sequence of swing highs and swing lows. "
         "An uptrend prints higher highs and higher lows; a downtrend prints "
         "lower highs and lower lows. A Break of Structure (BOS) is when "
         "price closes beyond the most recent swing in the direction of the "
         "prevailing trend - it confirms trend continuation, not reversal."),
        ("Change of Character (CHoCH)",
         "A Change of Character is when price breaks the most recent swing "
         "against the prevailing trend - the first swing low broken in an "
         "uptrend, or swing high broken in a downtrend. It is the earliest "
         "structural signal that the trend may be turning, and carries more "
         "weight on higher timeframes than lower ones."),
        ("Order Blocks",
         "An Order Block is the last opposing candle before a strong "
         "directional move - the last bearish candle before a strong "
         "bullish push is a bullish order block. The theory is that "
         "institutional orders cluster there, so price often reacts when it "
         "revisits the zone. An order block that has been retested multiple "
         "times is considered progressively weaker (mitigated)."),
        ("Fair Value Gaps (FVG)",
         "A Fair Value Gap is a three-candle imbalance where price moved so "
         "fast it left a gap between the first candle's wick and the "
         "third's. Bullish FVG: candle 3's low sits above candle 1's high. "
         "Bearish FVG: candle 3's high sits below candle 1's low. Price "
         "frequently returns to partially or fully fill this gap before "
         "continuing in the original direction."),
        ("Liquidity Pools & Stop Hunts",
         "Liquidity pools form where retail stop losses cluster - equal "
         "highs (buy-side liquidity, stops sit above) and equal lows "
         "(sell-side liquidity, stops sit below). Price is frequently "
         "engineered toward these obvious levels to trigger stops before "
         "reversing - a liquidity grab or stop hunt. These are more common "
         "in lower-liquidity sessions such as the Asian session for major "
         "pairs."),
        ("Premium & Discount Zones",
         "Within any defined price range, the area above the midpoint (50%) "
         "is the premium zone - a relatively expensive place to buy, more "
         "favorable for selling. The area below the midpoint is the "
         "discount zone - more favorable for buying. This framework is used "
         "to judge whether an entry sits in a statistically favorable part "
         "of the current range."),
        ("Classical Technical Analysis Baseline",
         "Alongside Smart Money Concepts, classical technical analysis "
         "still applies: support/resistance as prior reaction zones, "
         "trendlines connecting swing points, moving averages (20/50/200) "
         "as dynamic support/resistance, and candlestick patterns "
         "(engulfing, pin bar, doji) as short-term reversal or indecision "
         "signals. These often align with or reinforce SMC-based levels."),
    ],
    "fundamental": [
        ("Interest Rates & Currency Strength",
         "Higher interest rates generally attract foreign capital seeking "
         "yield, strengthening a currency; rate cuts generally weaken it. "
         "Markets react as much to the expectation and forward guidance "
         "around a rate decision (hawkish vs. dovish tone) as to the "
         "decision itself - a 'hawkish cut' can strengthen a currency and "
         "a 'dovish hike' can weaken one."),
        ("CPI & Inflation Data",
         "Consumer Price Index measures inflation. Higher-than-expected CPI "
         "typically raises expectations of tighter monetary policy (rate "
         "hikes or delayed cuts), which tends to strengthen the currency; "
         "lower-than-expected CPI does the reverse. Core CPI (excluding "
         "volatile food/energy) is often weighted more heavily by central "
         "banks than headline CPI."),
        ("Non-Farm Payrolls & Employment Data",
         "NFP is released the first Friday of most months and is one of "
         "the highest-impact USD events - it measures net job creation "
         "and heavily informs Fed policy expectations. Strong job growth "
         "with rising wages tends to support a stronger USD (fewer/later "
         "cuts expected); weak prints tend to weaken it."),
        ("GDP & Economic Growth",
         "GDP measures the total value of goods and services produced, "
         "reported quarterly. Above-forecast GDP growth generally supports "
         "a currency (signals a healthier economy, room for tighter "
         "policy); a contraction or recessionary print generally weighs on "
         "it."),
        ("Central Bank Communication",
         "Central bank press conferences and meeting minutes often move "
         "markets more than the headline rate decision itself, through "
         "forward guidance about future policy path. Markets price in "
         "expectations ahead of the event, so the actual market reaction "
         "is driven by the surprise relative to expectations, not the "
         "absolute number."),
    ],
    "sentiment": [
        ("Risk-On / Risk-Off Regimes",
         "In risk-on regimes, capital flows toward higher-yielding and "
         "growth-sensitive assets (equities, commodity currencies like AUD "
         "and NZD); safe havens (JPY, CHF, gold) tend to underperform. In "
         "risk-off regimes, this reverses - safe havens strengthen as "
         "capital seeks shelter from uncertainty."),
        ("Positioning & Crowded Trades",
         "Extreme one-sided speculative positioning (e.g. from COT reports "
         "or broker sentiment data) can signal an overcrowded trade at risk "
         "of a sharp reversal if a catalyst triggers unwinding. Sentiment "
         "extremes are contrarian signals more often than trend-confirming "
         "ones."),
        ("News Sentiment vs. Price Action",
         "News sentiment should be weighed against how price actually "
         "reacts to it. If ostensibly bullish news fails to push price "
         "higher (or price falls despite it), that divergence itself is "
         "informative - it can indicate the news was already priced in, or "
         "that underlying positioning is heavier on the other side than "
         "headlines suggest."),
    ],
    "risk": [
        ("Position Sizing & Risk Per Trade",
         "A widely used institutional guideline is risking no more than "
         "1-2% of account equity on a single trade. Position size follows "
         "from (Account Equity x Risk%) / (Entry Price - Stop Loss Price). "
         "This keeps a losing streak survivable: ten straight 2%-risk "
         "losses cost about 18% of the account; ten straight 10%-risk "
         "losses cost roughly 65%, which is far harder to recover from."),
        ("Risk/Reward Ratio",
         "A minimum 1:2 risk/reward ratio is a common baseline - risking 1 "
         "unit to target 2. At 1:2, a trader only needs roughly a 34% win "
         "rate to break even before costs; at 1:3, roughly 25%. Favorable "
         "R:R ratios create margin for being wrong more often than right "
         "and still being profitable over time."),
        ("Drawdown Management",
         "Drawdown is the decline from an equity peak to a subsequent "
         "trough. Recovering from drawdown gets disproportionately harder "
         "the deeper it goes - a 20% drawdown needs a 25% gain to recover, "
         "a 50% drawdown needs a 100% gain. Risk management exists "
         "primarily to keep drawdowns in the easily-recoverable range."),
        ("Correlation Risk",
         "Trading multiple positions in correlated instruments (e.g. "
         "several USD pairs in the same direction) multiplies effective "
         "exposure to a single underlying driver, even though it looks "
         "like diversification on paper. True risk reduction requires "
         "genuinely uncorrelated or offsetting exposure."),
    ],
    "quant": [
        ("Statistical Significance in Backtesting",
         "A backtest's win rate or edge is only meaningful with a large "
         "enough sample size - a handful of trades can look like a strong "
         "edge purely from noise. Results should be evaluated across "
         "enough trades and market regimes to distinguish a genuine "
         "statistical edge from random variance."),
        ("Correlation vs. Causation",
         "Two instruments or indicators moving together (correlation) does "
         "not establish that one causes the other, and historical "
         "correlations between instruments can and do break down, "
         "especially across different volatility or macro regimes."),
        ("Overfitting",
         "A strategy tuned to perform extremely well on historical data "
         "specifically often fails to generalize to new, unseen market "
         "conditions - this is overfitting. Simpler rules that perform "
         "reasonably across varied historical periods tend to be more "
         "robust than complex rules that perform perfectly on one."),
        ("Sample Size & Regime Dependence",
         "Market behavior differs meaningfully across regimes (trending "
         "vs. ranging, high vs. low volatility). A pattern's historical hit "
         "rate calculated across a single regime may not hold in a "
         "different one - the regime the data was drawn from matters as "
         "much as the raw sample size."),
    ],
}
