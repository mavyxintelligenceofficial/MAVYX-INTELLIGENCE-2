from dotenv import load_dotenv

# Load .env explicitly, first thing - same lesson learned the hard way in
# the NestJS services (see PROJECT_REPORT.md Phase 2 Step 2): never rely
# on a library loading it as a side effect, load it ourselves so behavior
# is identical and predictable across every service.
load_dotenv()

import os
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel

from auth import require_auth
from model_provider import ModelProvider
from providers.anthropic_provider import AnthropicProvider

app = FastAPI(title="Mavyx Model Service")

# Bound to the interface, not the concrete class - swapping providers
# later means changing only this one line, same principle as
# MARKET_DATA_PROVIDER in market-service.
_provider: ModelProvider = AnthropicProvider()


class GenerateRequest(BaseModel):
    system_prompt: str
    user_prompt: str


class GenerateResponse(BaseModel):
    response: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "model-service"}


@app.post("/generate", response_model=GenerateResponse)
async def generate(body: GenerateRequest, _user: dict = Depends(require_auth)):
    try:
        text = await _provider.generate(body.system_prompt, body.user_prompt)
    except RuntimeError as exc:
        # Missing/invalid API key, etc - a clear config error, not a 500.
        raise HTTPException(status_code=503, detail=str(exc))
    return GenerateResponse(response=text)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 4004))
    uvicorn.run(app, host="0.0.0.0", port=port)
