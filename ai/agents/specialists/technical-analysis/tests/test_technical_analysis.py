"""
Technical Analysis Agent Tests
Per Volume VI §2.4: Unit Testing Strategy
Per Volume V §5.17: AI Testing Strategy

Tests include:
- Prompt Testing: instruction following, output quality
- Agent Testing: analytical consistency, domain accuracy
- Safety Testing: incorrect outputs, unsupported claims
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
import json

# Add parent paths for imports
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from agents.specialists.technical_analysis import TechnicalAnalysisAgent


@pytest.fixture
def agent():
    return TechnicalAnalysisAgent()


@pytest.fixture
def mock_provider():
    """Mock AI provider that returns a valid response."""
    provider = AsyncMock()
    provider.generate.return_value = json.dumps({
        "summary": "EUR/USD showing bullish momentum on 4H chart",
        "signal": "bullish",
        "confidence": 72,
        "key_findings": [
            "Price broke above 200 SMA",
            "RSI at 58 — not overbought",
            "Ascending triangle forming"
        ],
        "evidence": [
            "Price closed above 1.0850 resistance",
            "Higher lows forming since 1.0820"
        ],
        "risk_assessment": "Moderate — approaching resistance at 1.0920",
        "assumptions": ["Current trend continues"],
        "limitations": ["No volume data available"],
        "suggested_actions": ["Watch for breakout above 1.0900"]
    })
    return provider


@pytest.fixture
def sample_market_data():
    """Sample market data for testing."""
    return {
        "price": {
            "symbol": "EUR/USD",
            "price": 1.0875,
            "timestamp": "2026-07-23T12:00:00Z"
        },
        "candles": [
            {"timestamp": "2026-07-23T08:00:00Z", "open": 1.0850, "high": 1.0880, "low": 1.0840, "close": 1.0870},
            {"timestamp": "2026-07-23T12:00:00Z", "open": 1.0870, "high": 1.0890, "low": 1.0860, "close": 1.0875},
        ]
    }


# ─── Agent Identity Tests ──────────────────────────────────────────

def test_agent_name(agent):
    """Per Vol. V §5.5: Agent must have a name."""
    assert agent.name == "technical-analysis"


def test_agent_category(agent):
    """Per Vol. V §5.5: Agent must have a category."""
    assert agent.category == "technical_analysis"


def test_agent_has_system_prompt(agent):
    """Per Vol. V §5.7: Agent must have a system prompt."""
    assert len(agent.system_prompt) > 100
    assert "Technical Analysis" in agent.system_prompt


# ─── Prompt Tests (§5.17) ──────────────────────────────────────────

def test_system_prompt_requires_json(agent):
    """Per Vol. V §5.17: Prompt must enforce structured output."""
    assert "JSON" in agent.system_prompt or "json" in agent.system_prompt


def test_system_prompt_defines_signal_values(agent):
    """Per Vol. V §5.17: Prompt must define valid signal values."""
    assert "bullish" in agent.system_prompt
    assert "bearish" in agent.system_prompt
    assert "neutral" in agent.system_prompt


def test_system_prompt_requires_confidence_range(agent):
    """Per Vol. V §5.17: Prompt must define confidence range."""
    assert "0-100" in agent.system_prompt or "0 - 100" in agent.system_prompt


def test_system_prompt_includes_disclaimer(agent):
    """Per Vol. IV §1.3: Must include 'not financial advice' disclaimer."""
    assert "not financial advice" in agent.system_prompt.lower()


# ─── Input/Output Tests ────────────────────────────────────────────

def test_build_user_prompt_includes_symbol(agent, sample_market_data):
    """User prompt must include the symbol being analyzed."""
    prompt = agent.build_user_prompt("EUR/USD", sample_market_data, "4h")
    assert "EUR/USD" in prompt


def test_build_user_prompt_includes_price(agent, sample_market_data):
    """User prompt must include current price data."""
    prompt = agent.build_user_prompt("EUR/USD", sample_market_data, "4h")
    assert "1.0875" in prompt


def test_build_user_prompt_includes_candles(agent, sample_market_data):
    """User prompt must include candle data for pattern analysis."""
    prompt = agent.build_user_prompt("EUR/USD", sample_market_data, "4h")
    assert "Open" in prompt or "open" in prompt.lower()


def test_build_user_prompt_includes_timeframe(agent, sample_market_data):
    """User prompt must include the timeframe."""
    prompt = agent.build_user_prompt("EUR/USD", sample_market_data, "4h")
    assert "4h" in prompt


# ─── Analysis Tests (§5.17: Agent Testing) ─────────────────────────

@pytest.mark.asyncio
async def test_analyze_returns_valid_output(agent, mock_provider, sample_market_data):
    """Per Vol. V §5.17: Agent must return valid structured output."""
    result = await agent.analyze(mock_provider, "EUR/USD", sample_market_data, "4h")

    assert result.agent_id == "technical-analysis"
    assert result.signal in ["bullish", "bearish", "neutral"]
    assert 0 <= result.confidence <= 100
    assert len(result.summary) > 0


@pytest.mark.asyncio
async def test_analyze_parses_json_response(agent, mock_provider, sample_market_data):
    """Per Vol. V §5.16: Agent must parse JSON responses correctly."""
    result = await agent.analyze(mock_provider, "EUR/USD", sample_market_data, "4h")

    assert result.signal == "bullish"
    assert result.confidence == 72
    assert len(result.key_findings) > 0


@pytest.mark.asyncio
async def test_analyze_handles_invalid_json(agent, sample_market_data):
    """Per Vol. IV §3.13: Agent must handle invalid outputs gracefully."""
    provider = AsyncMock()
    provider.generate.return_value = "This is not JSON, just a plain text response."

    result = await agent.analyze(provider, "EUR/USD", sample_market_data, "4h")

    # Should still return a valid output, not crash
    assert result.signal in ["bullish", "bearish", "neutral"]
    assert 0 <= result.confidence <= 100


@pytest.mark.asyncio
async def test_analyze_handles_provider_error(agent, sample_market_data):
    """Per Vol. IV §3.13: Agent must handle provider failures gracefully."""
    provider = AsyncMock()
    provider.generate.side_effect = RuntimeError("API key invalid")

    result = await agent.analyze(provider, "EUR/USD", sample_market_data, "4h")

    # Should return error output, not crash
    assert result.confidence == 0
    assert "error" in result.summary.lower() or "failed" in result.summary.lower()


# ─── Safety Tests (§5.17: Safety Testing) ──────────────────────────

def test_agent_does_not_make_financial_promises(agent):
    """Per safety requirements: Agent must not promise profits."""
    prompt = agent.system_prompt.lower()
    assert "guarantee" not in prompt
    assert "promise" not in prompt
    assert "guaranteed profit" not in prompt


def test_agent_requires_evidence(agent):
    """Per Vol. IV §1.3: Evidence Before Confidence."""
    prompt = agent.system_prompt.lower()
    assert "evidence" in prompt
