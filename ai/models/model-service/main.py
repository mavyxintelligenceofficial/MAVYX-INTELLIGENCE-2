from dotenv import load_dotenv

# Load .env explicitly, first thing - same lesson learned the hard way in
# the NestJS services (see PROJECT_REPORT.md Phase 2 Step 2): never rely
# on a library loading it as a side effect, load it ourselves so behavior
# is identical and predictable across every service.
load_dotenv()

import os
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
    return {"status": "ok", "service": "model-service"}


@app.post("/generate", response_model=GenerateResponse)
async def generate(body: GenerateRequest, _user: dict = Depends(require_auth)):
    try:
        text = await _provider.generate(body.system_prompt, body.user_prompt, body.model)
    except RuntimeError as exc:
        # Missing/invalid API key, etc - a clear config error, not a 500.
        raise HTTPException(status_code=503, detail=str(exc))
    return GenerateResponse(response=text)


@app.post("/analyze")
async def analyze(body: AnalyzeRequest, _user: dict = Depends(require_auth)):
    """Run the full AI analysis pipeline for a symbol.

    This endpoint:
    1. Fetches market data from market-service
    2. Runs all specialist agents in parallel
    3. Synthesizes results through the Executive Decision Engine
    4. Returns a complete recommendation

    Per Volume IV §2.8: AI Task Lifecycle (12 stages).
    """
    # Import here to avoid circular imports and lazy-load heavy modules
    from orchestration.orchestrator import AIOrchestrator
    from agents.specialists.technical_analysis import TechnicalAnalysisAgent
    from agents.specialists.market_structure import MarketStructureAgent
    from agents.specialists.sentiment import SentimentAgent
    from agents.specialists.risk_assessment import RiskAssessmentAgent
    from agents.specialists.fundamentals import FundamentalsAgent
    from agents.specialists.market_behavior import MarketBehaviorAgent
    from agents.specialists.recommendation import RecommendationAgent
    from market_data_fetcher import fetch_market_data

    # Instantiate all specialist agents
    agents = [
        TechnicalAnalysisAgent(),
        MarketStructureAgent(),
        SentimentAgent(),
        RiskAssessmentAgent(),
        FundamentalsAgent(),
        MarketBehaviorAgent(),
        RecommendationAgent(),
    ]

    # Create orchestrator with market data fetcher
    orchestrator = AIOrchestrator(
        provider=_provider,
        agents=agents,
        market_fetcher=fetch_market_data,
    )

    try:
        result = await orchestrator.analyze(
            symbol=body.symbol,
            timeframe=body.timeframe,
            model=body.model,
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 4004))
    uvicorn.run(app, host="0.0.0.0", port=port)
