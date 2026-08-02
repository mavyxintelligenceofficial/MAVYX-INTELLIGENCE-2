"""
RAG Engine — retrieves domain-scoped knowledge for each specialist agent.

Rebuilt fresh per user instruction (previous version was former-AI work,
never wired into the live v2 pipeline, removed).

Per the user's own architecture note: each agent should only ever
retrieve from its own domain's knowledge base - the Technical Agent
never sees Fundamental documents and vice versa. That isolation is
enforced by knowledge_base.py storing each domain as a completely
separate file; this module just scores and ranks within whichever
single domain it's asked to search.

Retrieval strategy - honest about current scope:
This ships with simple keyword/term-overlap scoring, not semantic
embeddings. Volume V §6.11 lists proper vector-database options
(Pinecone, Weaviate, Qdrant, pgvector) for when the knowledge base
grows large enough that keyword matching stops being good enough -
none of those are provisioned in this stack yet, and standing one up
for a handful of seed documents would be premature infrastructure
before there's real content (books, journal entries, notes) to
justify it. The retrieve() interface below is intentionally the only
thing agents call, so swapping in real embeddings later is a change
to this file alone - nothing calling retrieve() needs to change.
"""

import re
from typing import Optional

from knowledge.knowledge_base import list_documents, VALID_DOMAINS

_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "to", "of", "in", "on", "at", "for", "with", "and", "or", "but",
    "this", "that", "these", "those", "it", "its", "as", "by", "from",
}


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    return {w for w in words if w not in _STOPWORDS and len(w) > 2}


def retrieve(domain: str, query: str, top_k: int = 3) -> list[dict]:
    """Return up to top_k documents from `domain` most relevant to `query`,
    ranked by term overlap. Returns [] if the domain has no documents or
    nothing scores above zero overlap - callers must treat empty results
    as "no relevant knowledge found," not an error.
    """
    if domain not in VALID_DOMAINS:
        return []
    documents = list_documents(domain)
    if not documents:
        return []

    query_terms = _tokenize(query)
    if not query_terms:
        return []

    scored = []
    for doc in documents:
        doc_terms = _tokenize(doc["title"] + " " + doc["content"])
        overlap = len(query_terms & doc_terms)
        if overlap > 0:
            scored.append((overlap, doc))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [doc for _, doc in scored[:top_k]]


def format_for_prompt(documents: list[dict]) -> str:
    """Format retrieved documents as a prompt section per Volume IV §4.6
    (Knowledge Context section of the standard prompt template)."""
    if not documents:
        return ""
    lines = ["KNOWLEDGE CONTEXT (retrieved reference material for this domain):"]
    for doc in documents:
        lines.append(f"- {doc['title']}: {doc['content']}")
    return "\n".join(lines)


def retrieve_for_prompt(domain: str, query: str, top_k: int = 3) -> str:
    """Convenience wrapper: retrieve + format in one call, which is what
    every specialist agent actually uses when building its prompt."""
    return format_for_prompt(retrieve(domain, query, top_k))
