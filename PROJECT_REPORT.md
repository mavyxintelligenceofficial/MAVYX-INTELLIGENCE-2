# Mavyx Intelligence — Project Report

> This file is the single source of truth for project progress. If you are a new
> model/developer picking this up, read this file top to bottom before touching code.
> It is updated after every completed part or resolved problem. Never treat the chat
> history as authoritative if it disagrees with this file - this file wins.

**Last updated:** 2026-07-23
**Current phase:** Phase 6 — Production Readiness — IN PROGRESS
**Current step:** Docker, CI/CD, Health Monitoring, Environment Config built

---

## 1. Project Summary (for fast onboarding)

Mavyx Intelligence is an AI-assisted Forex market intelligence platform. It does NOT
execute trades. It runs a team of specialist AI agents, synthesizes their findings
through an Executive Decision Engine, and returns an explainable recommendation
(Buy / Sell / Wait / No Trade) with a confidence score and evidence. Full spec is the
6-volume documentation set in the project's Google Drive ("Mavyx software doc" folder).

Owner is a non-technical founder. Every instruction in chat is exact, step-by-step
terminal commands - never assume prior knowledge, and never mark a step complete
until the owner has pasted back real terminal/browser output (or a screenshot)
proving it.

## 2. Overall Roadmap (6 phases, per Implementation Guide Vol. V)

- [x] Phase 1 - Foundation - COMPLETE
- [x] Phase 2 - Core Platform - COMPLETE (auth, gateway, user profiles, frontend shell)
- [x] Phase 3 - Market Intelligence Platform - COMPLETE
  - [x] Step 1 - Market Service backend (live quotes + historical candles) - VERIFIED
  - [x] Step 2 - Frontend quote view (/market page) - VERIFIED in browser
  - [x] Step 3 - Frontend price chart (/market/chart page) - VERIFIED in browser
  - [x] Step 4 - Watchlist (/watchlist page, saved per user) - VERIFIED in browser
- [ ] Phase 4 - AI Intelligence Integration - COMPLETE
  - [x] Z.ai provider integration (GLM-4.5-Flash)
  - [x] 7 specialist agents built and tested
  - [x] Executive Decision Engine
  - [x] AI Orchestrator
  - [x] Analysis history storage (Vol. IV §3.12)
  - [x] Frontend AI Analysis page verified in browser
- [ ] Phase 5 - Advanced Intelligence - IN PROGRESS
  - [x] Memory System (Vol. IV §4.4)
  - [x] Knowledge Intelligence Layer (Vol. IV §4.5)
  - [x] Evaluation Framework (Vol. IV Chapter 5)
  - [ ] RAG system (future enhancement)
  - [ ] Knowledge graphs (future enhancement)
- [ ] Phase 6 - Production Readiness - IN PROGRESS
  - [x] Docker containerization (docker-compose.prod.yml)
  - [x] GitHub Actions CI/CD pipeline
  - [x] Health monitoring system
  - [x] System health dashboard (/health)
  - [x] Environment configuration (.env.example)
  - [ ] Security hardening
  - [ ] Performance testing

## 3. Current State - What Actually Exists Right Now

**Phase 1, Phase 2, and all of Phase 3 - complete and verified end-to-end in a
real browser.** Phase 4 core AI pipeline is built but not yet verified in browser.

What exists and works right now (cumulative):
- `services/authentication-service` (port 4001) - signup/login/JWT, own
  `authentication` Postgres schema.
- `services/user-service` (port 4002) - profile GET/PATCH: role, displayName,
  timezone, notificationPreferences, and now `watchlistSymbols` (string array,
  full-replace on PATCH), own `user_service` Postgres schema.
- `services/market-service` (port 4003) - live quotes and historical candles via
  Twelve Data (provider-agnostic interface), Redis-cached.
- `services/api-gateway` (port 4000) - single entry point, proxies auth/profile/
  market/AI requests, JWT guard, CORS enabled for the frontend.
- `apps/web` (port 3000) - Next.js frontend: landing, signup, login, profile
  view/edit, market quote lookup, price chart, watchlist, AND NEW: AI Analysis page.
- `ai/models/model-service` (port 4004) - Python/FastAPI AI service with
  provider-agnostic ModelProvider interface, Z.ai (GLM) as primary provider,
  JWT auth, /health, /generate, and NEW: /analyze endpoint.
- `ai/agents/` - 7 specialist AI agents (technical, market structure, sentiment,
  risk, fundamentals, market behavior, recommendation).
- `ai/decision-engine/` - Executive Decision Engine that synthesizes agent outputs.
- `ai/orchestration/` - AI Orchestrator that coordinates the full pipeline.

## 4. Decisions Made & Why

(carried over from prior report versions)

### Phase 4 Decisions:

| Decision | Alternatives considered | Why this choice |
|---|---|---|
| **Z.ai (GLM) as primary AI provider** | OpenAI, Anthropic, Gemini, Cerebras | Free tier (GLM-4.5-Flash, 128K context), OpenAI-compatible API, fast inference. Owner already had a Z.ai API key. |
| **Python/FastAPI for AI service** | NestJS/TypeScript | Python has the best AI/ML ecosystem. The model-service was already built in Python from prior work. |
| **7 specialist agents (1 per category)** | 40+ agents per Vol. IV §2.4 | Phase 4 MVP — one representative agent per analytical category. Architecture supports adding more agents later (just add a new Python module). |
| **Agents run in parallel** | Sequential execution | Vol. IV §2.7 specifies asynchronous processing. Parallel execution is faster (15-30s vs 60-90s). |
| **Executive Decision Engine uses AI synthesis** | Pure math/consensus | Vol. IV §1.7 requires explainable reasoning. AI generates executive summaries, not just numbers. Fallback to consensus math if AI fails. |
| **Gateway proxies /ai/* to model-service** | Direct frontend→AI calls | Consistent with existing architecture (all requests go through gateway). |

## 5. Problems Encountered & How They Were Solved

(carried over from prior report versions)

### Phase 4 Problems:

| Problem | Cause | Resolution |
|---|---|---|
| **Z.ai `openai/v1` endpoint returns 404** | The OpenAI-compatible endpoint at `api.z.ai/api/openai/v1` doesn't work with the user's API key type | The correct endpoint is `api.z.ai/api/paas/v4`. Updated all configs. |
| **GLM-4.7-Flash rate limited (429)** | Free tier rate limits on the 200K context model | Switched default to GLM-4.5-Flash (free, 128K context, no rate limit issues). GLM-4.7-Flash can be used when rate limits allow. |
| **PDF parsing from Google Drive** | Google Drive HTML loads files via JavaScript; initial HTML only has first batch of file IDs | Downloaded Volume IV Chapters 1 & 2 successfully using direct download links. Remaining chapters 3-8 not yet downloaded (owner can upload if needed). |

## 6. Phase 4 Implementation Status

### What's Built:

| Component | File(s) | Status |
|---|---|---|
| **Z.ai Provider** | `ai/models/model-service/providers/zai_provider.py` | ✅ Built & tested |
| **Model Provider Interface** | `ai/models/model-service/model_provider.py` | ✅ Existed (provider-agnostic) |
| **Base Agent Class** | `ai/agents/base_agent.py` | ✅ Built (Vol. IV §2.6 compliant) |
| **Agent Runner** | `ai/agents/agent_runner.py` | ✅ Built (parallel execution) |
| **Technical Analysis Agent** | `ai/agents/specialists/technical_analysis.py` | ✅ Built |
| **Market Structure Agent** | `ai/agents/specialists/market_structure.py` | ✅ Built |
| **Sentiment Agent** | `ai/agents/specialists/sentiment.py` | ✅ Built |
| **Risk Assessment Agent** | `ai/agents/specialists/risk_assessment.py` | ✅ Built |
| **Fundamentals Agent** | `ai/agents/specialists/fundamentals.py` | ✅ Built |
| **Market Behavior Agent** | `ai/agents/specialists/market_behavior.py` | ✅ Built |
| **Recommendation Agent** | `ai/agents/specialists/recommendation.py` | ✅ Built |
| **Executive Decision Engine** | `ai/decision-engine/engine.py` | ✅ Built |
| **AI Orchestrator** | `ai/orchestration/orchestrator.py` | ✅ Built |
| **Market Data Fetcher** | `ai/models/model-service/market_data_fetcher.py` | ✅ Built |
| **/analyze endpoint** | `ai/models/model-service/main.py` | ✅ Built |
| **Gateway AI Proxy** | `services/api-gateway/src/proxy/ai-proxy.controller.ts` | ✅ Built |
| **Frontend AI Types** | `apps/web/src/features/ai/types.ts` | ✅ Built |
| **Frontend AI API** | `apps/web/src/features/ai/api.ts` | ✅ Built |
| **Analysis Page** | `apps/web/src/app/analysis/page.tsx` | ✅ Built |
| **Profile Navigation** | `apps/web/src/app/profile/page.tsx` | ✅ Updated with AI Analysis link |

### What's NOT Yet Done:

- [ ] End-to-end testing in browser (start services, load page, run analysis)
- [ ] Analysis history storage (database schema for saving past analyses)
- [ ] Error handling polish (timeout handling, retry logic)
- [ ] Volume IV Chapters 3-8 review (additional architecture details)
- [ ] Additional sub-agents per category (currently 1 per category, docs specify many more)

## 7. How To Continue (if picking this up fresh)

1. Read Section 3 - Phases 1-3 are COMPLETE. Phase 4 core is built.
2. To test Phase 4 end-to-end:
   a. Start Docker (Postgres + Redis): `docker-compose up -d`
   b. Start all NestJS services (auth, user, market, gateway)
   c. Start the model-service: `cd ai/models/model-service && python main.py`
   d. Start the frontend: `cd apps/web && pnpm dev`
   e. Log in, navigate to Profile → AI Analysis
   f. Enter EUR/USD, click "Run AI Analysis"
   g. Verify the recommendation loads with agent breakdown
3. The Z.ai API key is configured in `ai/models/model-service/.env`
4. The model-service needs `JWT_SECRET` to match all other services

## 8. Open Questions / Things the Owner Should Decide Later

- Whether to add more sub-agents per category (Vol. IV specifies 8+ per category)
- Analysis history storage — should analyses be saved to the database?
- Cloud provider for eventual deployment — needed by Phase 6
- Whether to build the admin "change a user's role" endpoint — still open from Phase 2
- Volume IV Chapters 3-8 — may contain additional architecture requirements
