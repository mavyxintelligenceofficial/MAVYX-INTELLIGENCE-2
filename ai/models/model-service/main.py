from dotenv import load_dotenv

# Load .env explicitly, first thing - same lesson learned the hard way in
# the NestJS services (see PROJECT_REPORT.md Phase 2 Step 2): never rely
# on a library loading it as a side effect, load it ourselves so behavior
# is identical and predictable across every service.
load_dotenv()

import os
import sys

# Add the ai/ directory to Python's import path so we can import
# orchestration, agents, and decision_engine from sibling folders.
# Without this, Python only looks in ai/models/model-service/ and
# can't find modules in ai/orchestration/, ai/agents/, etc.
_ai_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _ai_root not in sys.path:
    sys.path.insert(0, _ai_root)

from typing import Optional
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel

from auth import require_auth
from model_provider import ModelProvider
from providers.zai_provider import ZaiProvider
# Other providers available as fallbacks:
# from providers.cerebras_provider import CerebrasProvider
# from providers.anthropic_provider import AnthropicProvider
# from providers.gemini_provider import GeminiProvider

app = FastAPI(title="Mavyx Model Service")

# Bound to the interface, not the concrete class - swapping/adding
# providers means changing only this one line, same principle as
# MARKET_DATA_PROVIDER in market-service.
# Current primary: Z.ai (GLM-4.5-Flash, free, 128K context).
_provider: ModelProvider = ZaiProvider()


class GenerateRequest(BaseModel):
    system_prompt: str
    user_prompt: str
    # Optional - lets a caller (a specialist agent) request a specific
    # underlying model for its task, per Implementation Guide Vol. V
    # Section 5.5's "required knowledge" varying per agent. Falls back
    # to the provider's own default if omitted.
    model: Optional[str] = None


class GenerateResponse(BaseModel):
    response: str


class AnalyzeRequest(BaseModel):
    symbol: str
    timeframe: str = "4h"
    model: Optional[str] = None


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "model-service",
        "ai_provider": "zai",
        "model": os.environ.get("ZAI_MODEL", "glm-4.5-flash"),
        "version": "1.0.0",
    }


@app.get("/health/system")
async def system_health():
    """Check health of all Mavyx services (Vol. V Ch.7 §7.13)."""
    from health_check import HealthChecker
    checker = HealthChecker()
    return await checker.check_all()


@app.post("/generate", response_model=GenerateResponse)
async def generate(body: GenerateRequest, _user: dict = Depends(require_auth)):
    try:
        text = await _provider.generate(body.system_prompt, body.user_prompt, body.model)
    except RuntimeError as exc:
        # Missing/invalid API key, etc - a clear config error, not a 500.
        raise HTTPException(status_code=503, detail=str(exc))
    return GenerateResponse(response=text)


@app.post("/analyze")
async def analyze(body: AnalyzeRequest, user: dict = Depends(require_auth)):
    """Run the full AI analysis pipeline for a symbol.

    This endpoint:
    1. Fetches market data from market-service
    2. Runs all specialist agents in parallel
    3. Synthesizes results through the Executive Decision Engine
    4. Saves the result for history (Vol. IV §3.12: Decision Logging)
    5. Returns a complete recommendation

    Per Volume IV §2.8: AI Task Lifecycle (12 stages).
    """
    from orchestration.orchestrator import AIOrchestrator
    from agents.specialists.technical_analysis import TechnicalAnalysisAgent
    from agents.specialists.market_structure import MarketStructureAgent
    from agents.specialists.sentiment import SentimentAgent
    from agents.specialists.risk_assessment import RiskAssessmentAgent
    from agents.specialists.fundamentals import FundamentalsAgent
    from agents.specialists.market_behavior import MarketBehaviorAgent
    from agents.specialists.recommendation import RecommendationAgent
    from agents.specialists.liquidity import LiquidityAgent
    from agents.specialists.historical import HistoricalAgent
    from agents.specialists.psychology import PsychologyAgent
    from agents.specialists.devils_advocate import DevilsAdvocateAgent
    from market_data_fetcher import fetch_market_data
    from analysis_store import AnalysisStore
    from memory.memory_manager import MemoryManager
    from knowledge.knowledge_base import KnowledgeBase

    # Per MEIDS Chapter 3: 9 specialist agents
    agents = [
        TechnicalAnalysisAgent(),
        MarketStructureAgent(),
        FundamentalsAgent(),
        SentimentAgent(),
        LiquidityAgent(),
        HistoricalAgent(),
        RiskAssessmentAgent(),
        PsychologyAgent(),
        DevilsAdvocateAgent(),
        MarketBehaviorAgent(),
        RecommendationAgent(),
    ]

    # Initialize Phase 5 systems (Vol. IV §4.4-4.5)
    memory_manager = MemoryManager(store=AnalysisStore())
    knowledge_base = KnowledgeBase()

    orchestrator = AIOrchestrator(
        provider=_provider,
        agents=agents,
        market_fetcher=fetch_market_data,
        memory_manager=memory_manager,
        knowledge_base=knowledge_base,
    )

    try:
        result = await orchestrator.analyze(
            symbol=body.symbol,
            timeframe=body.timeframe,
            model=body.model,
        )

        # Save to analysis history (Vol. IV §3.12: Decision Logging)
        user_id = user.get("sub", "unknown")
        store = AnalysisStore()
        analysis_id = store.save(user_id, result)
        if analysis_id:
            result["analysis_id"] = analysis_id

        return result
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")


@app.get("/analyze/history")
async def analysis_history(user: dict = Depends(require_auth)):
    """Retrieve the user's analysis history."""
    from analysis_store import AnalysisStore

    user_id = user.get("sub", "unknown")
    store = AnalysisStore()
    return store.get_history(user_id)


@app.get("/analyze/{analysis_id}")
async def get_analysis(analysis_id: str, user: dict = Depends(require_auth)):
    """Retrieve a specific analysis by ID."""
    from analysis_store import AnalysisStore

    store = AnalysisStore()
    result = store.get_by_id(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return result


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 4004))
    uvicorn.run(app, host="0.0.0.0", port=port)
