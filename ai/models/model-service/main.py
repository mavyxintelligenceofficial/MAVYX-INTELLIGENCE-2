from dotenv import load_dotenv, find_dotenv

# Load .env explicitly, first thing - same lesson learned the hard way in
# the NestJS services (see PROJECT_REPORT.md Phase 2 Step 2): never rely
# on a library loading it as a side effect, load it ourselves so behavior
# is identical and predictable across every service.
load_dotenv()

_DOTENV_PATH = find_dotenv() or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")


def persist_env_var(key: str, value: str) -> None:
    """Write/update a single KEY=value line in the .env file on disk, so a
    key set via Settings actually persists across restarts - not just in
    os.environ for the current process, which is lost the moment this
    service reloads (uvicorn --reload restarts on every source change)."""
    lines: list[str] = []
    if os.path.exists(_DOTENV_PATH):
        with open(_DOTENV_PATH, "r", encoding="utf-8") as f:
            lines = f.read().split("\n")
    new_line = f"{key}={value}"
    found = False
    for i, line in enumerate(lines):
        if line.startswith(f"{key}="):
            lines[i] = new_line
            found = True
            break
    if not found:
        if lines and lines[-1].strip() != "":
            lines.append("")
        lines.append(new_line)
    with open(_DOTENV_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

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
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
import queue
import threading

from auth import require_auth
from model_provider import ModelProvider
from providers.zai_provider import ZaiProvider
# Other providers available as fallbacks:
# from providers.cerebras_provider import CerebrasProvider
# from providers.anthropic_provider import AnthropicProvider
# from providers.gemini_provider import GeminiProvider

app = FastAPI(title="Mavyx Model Service")

from knowledge.knowledge_base import seed_if_empty
seed_if_empty()

# CORS — allow frontend (port 3000) and gateway (port 4000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


class ApiKeyUpdateRequest(BaseModel):
    api_key: str


@app.get("/settings/zai-key/status")
async def zai_key_status(_user: dict = Depends(require_auth)):
    """Report whether a Z.AI key is currently configured, without ever
    exposing the key value itself."""
    key = os.environ.get("ZAI_API_KEY", "")
    configured = bool(key) and key != "paste_your_zai_api_key_here"
    return {
        "configured": configured,
        "key_preview": ("…" + key[-4:]) if configured and len(key) >= 4 else None,
    }


@app.post("/settings/zai-key")
async def update_zai_key(body: ApiKeyUpdateRequest, _user: dict = Depends(require_auth)):
    """Update the Z.AI API key at runtime (Settings > Integrations).

    Per Rebuild Spec: previously there was no way to do this at all - the
    key could only be set via .env before the service started, and even
    if it had been settable, ZaiProvider cached its client at __init__
    time so a later change would never have taken effect anyway (fixed
    separately in zai_provider.py - it now builds its client fresh on
    every call, reading os.environ each time).
    """
    if not body.api_key or not body.api_key.strip():
        raise HTTPException(status_code=400, detail="api_key is required")
    key = body.api_key.strip()
    os.environ["ZAI_API_KEY"] = key
    try:
        persist_env_var("ZAI_API_KEY", key)
    except Exception as e:
        return {"success": True, "message": f"Z.AI API key updated for this session, but could not be saved to .env on disk: {e}"}
    return {"success": True, "message": "Z.AI API key updated and saved to .env"}


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


class AssistantRequest(BaseModel):
    message: str
    chat_history: list = []
    context: dict = {}


@app.post("/assistant")
async def assistant(body: AssistantRequest, user: dict = Depends(require_auth)):
    """AI Assistant — real conversational AI powered by Z.ai."""
    from assistant import AIAssistant
    try:
        ai = AIAssistant()
        result = await ai.chat(
            user_message=body.message,
            chat_history=body.chat_history,
            context=body.context,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


class JournalReviewRequest(BaseModel):
    analysis: dict


@app.post("/journal/review")
async def journal_review(body: JournalReviewRequest, user: dict = Depends(require_auth)):
    """AI review of a completed analysis — Per MEIDS Ch.13 §13.4"""
    from journal_engine import JournalEngine
    try:
        engine = JournalEngine()
        review = await engine.review_analysis(body.analysis)
        return review
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


class WeeklyReviewRequest(BaseModel):
    journal_entries: list


@app.post("/journal/weekly-review")
async def weekly_review(body: WeeklyReviewRequest, user: dict = Depends(require_auth)):
    """Weekly intelligence review — Per MEIDS Ch.13 §13.15"""
    from journal_engine import JournalEngine
    try:
        engine = JournalEngine()
        review = await engine.generate_weekly_review(body.journal_entries)
        return review
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


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
    
    Uses the rebuilt 12-agent system (v2) with:
    - Sequential execution with rate limiting
    - Quorum gate (7/10 minimum)
    - Schema validation on every response
    - Output caching
    """
    from orchestration.orchestrator_v2 import AIOrchestratorV2
    from market_data_fetcher import fetch_market_data
    from analysis_store import AnalysisStore
    
    try:
        market_data = await fetch_market_data(body.symbol, body.timeframe)
    except Exception:
        market_data = {"candles": []}
    
    orchestrator = AIOrchestratorV2(provider=_provider)
    
    try:
        result = await orchestrator.analyze(
            symbol=body.symbol,
            timeframe=body.timeframe,
            market_data=market_data,
            model=body.model,
        )
        
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


# ─── Live Agent Activity Feed (SSE) ────────────────────────────

_active_feeds: dict = {}
_feed_lock = threading.Lock()


@app.post("/analyze/stream")
async def analyze_stream(body: AnalyzeRequest, user: dict = Depends(require_auth)):
    """Run analysis with SSE for Live Activity Feed (Section 8)."""
    from orchestration.orchestrator_v2 import AIOrchestratorV2
    from market_data_fetcher import fetch_market_data
    from analysis_store import AnalysisStore
    
    feed_id = f"{user.get('sub', 'anon')}_{body.symbol}_{int(time.time())}"
    event_queue = queue.Queue()
    
    with _feed_lock:
        _active_feeds[feed_id] = event_queue
    
    def status_callback(status):
        try:
            event_queue.put({
                "event": "agent_status",
                "agent": status.agent,
                "status": status.status,
                "timestamp": status.timestamp,
                "duration_ms": status.duration_ms,
                "output_preview": status.output_preview,
                "error": status.error,
                "detail": status.detail,
            })
        except Exception:
            pass
    
    async def run_analysis():
        try:
            market_data = await fetch_market_data(body.symbol, body.timeframe)
        except:
            market_data = {"candles": []}
        
        orchestrator = AIOrchestratorV2(provider=_provider)
        orchestrator.on_status_change(status_callback)
        
        try:
            result = await orchestrator.analyze(
                symbol=body.symbol,
                timeframe=body.timeframe,
                market_data=market_data,
                model=body.model,
            )
            user_id = user.get("sub", "unknown")
            store = AnalysisStore()
            analysis_id = store.save(user_id, result)
            if analysis_id:
                result["analysis_id"] = analysis_id
            event_queue.put({"event": "analysis_complete", "result": result})
        except Exception as e:
            event_queue.put({"event": "analysis_error", "error": str(e)})
        finally:
            event_queue.put({"event": "stream_end"})
            with _feed_lock:
                _active_feeds.pop(feed_id, None)
    
    asyncio.create_task(run_analysis())
    
    async def event_generator():
        while True:
            try:
                event = event_queue.get(timeout=60)
                if event.get("event") == "stream_end":
                    yield f"data: {json.dumps(event)}\n\n"
                    break
                yield f"data: {json.dumps(event)}\n\n"
            except queue.Empty:
                yield f"data: {json.dumps({'event': 'keepalive'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


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
