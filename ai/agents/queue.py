"""
Agent Queue — Sequential, rate-limit-aware execution for z.ai free tier.

Per Rebuild Spec Section 4:
- ~0.8 req/sec to stay under the ~1/sec cap
- Cache aggressively (reuse outputs if candle hasn't closed)
- Retry policy: 1 retry with exponential backoff (2s then 5s)
- Timeout per agent: 15s hard ceiling
- Request ID for idempotency
- Quorum gate before Executive Synthesis
"""

import asyncio
import hashlib
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from agents.schema import (
    validate_specialist_output,
    validate_executive_output,
    create_fallback_output,
    create_insufficient_data_output,
)

logger = logging.getLogger(__name__)

# Rate limit: ~0.8 req/sec = 1.25s between requests
MIN_DELAY_BETWEEN_REQUESTS = 1.25  # seconds
AGENT_TIMEOUT = 15  # seconds per agent call
MAX_RETRIES = 1
RETRY_DELAYS = [2, 5]  # exponential backoff delays

# Quorum: minimum agents that must report successfully before synthesis
MIN_QUORUM = 7  # out of 12 total agents (11 specialists incl. devils_advocate + news_fundamental)


@dataclass
class AgentStatus:
    """Track agent execution status for the Live Activity Feed."""
    agent: str
    status: str  # queued | running | completed | failed | retrying
    timestamp: str
    duration_ms: Optional[int] = None
    output_preview: Optional[dict] = None
    error: Optional[str] = None
    attempt: int = 0
    detail: Optional[str] = None


@dataclass
class PipelineResult:
    """Result of the full pipeline execution."""
    specialists: list[dict]
    executive: Optional[dict] = None
    quorum_met: bool = False
    agents_reporting: int = 0
    agents_data_sufficient: int = 0
    total_duration_ms: int = 0
    agent_statuses: list[AgentStatus] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


class OutputCache:
    """Cache agent outputs to avoid redundant API calls.
    
    Cache key: hash of (agent_name, symbol, timeframe, candle_hash)
    If the candle data hasn't changed, reuse the last output.
    """
    
    def __init__(self, ttl_seconds: int = 900):  # 15 min default
        self._cache: dict[str, tuple[float, dict]] = {}
        self._ttl = ttl_seconds
    
    def _make_key(self, agent_name: str, symbol: str, timeframe: str, candle_data: list) -> str:
        """Create a cache key from agent inputs."""
        # Hash just the last candle + count for efficiency
        candle_hash = ""
        if candle_data:
            last = candle_data[-1] if candle_data else {}
            candle_hash = hashlib.md5(
                json.dumps(last, sort_keys=True).encode()
            ).hexdigest()[:8]
        raw = f"{agent_name}:{symbol}:{timeframe}:{candle_hash}:{len(candle_data)}"
        return hashlib.md5(raw.encode()).hexdigest()
    
    def get(self, agent_name: str, symbol: str, timeframe: str, candle_data: list) -> Optional[dict]:
        """Get cached output if still valid."""
        key = self._make_key(agent_name, symbol, timeframe, candle_data)
        if key in self._cache:
            ts, output = self._cache[key]
            if time.time() - ts < self._ttl:
                logger.info(f"[Cache] HIT for {agent_name} ({symbol}/{timeframe})")
                return output
            else:
                del self._cache[key]
        return None
    
    def put(self, agent_name: str, symbol: str, timeframe: str, candle_data: list, output: dict):
        """Cache an agent output."""
        key = self._make_key(agent_name, symbol, timeframe, candle_data)
        self._cache[key] = (time.time(), output)
    
    def clear(self):
        self._cache.clear()


class AgentQueue:
    """Sequential, rate-limited agent execution queue.
    
    Per spec: FIFO queue, rate-limited to ~0.8 req/sec.
    Agents run in dependency order, not in parallel.
    """
    
    def __init__(self, provider, cache: Optional[OutputCache] = None):
        self.provider = provider
        self.cache = cache or OutputCache()
        self._last_request_time = 0
        self._status_callbacks: list[Callable] = []
    
    def on_status_change(self, callback: Callable):
        """Register a callback for agent status changes (for Live Activity Feed)."""
        self._status_callbacks.append(callback)
    
    def _emit_status(self, status: AgentStatus):
        """Emit a status change event to all registered callbacks."""
        for cb in self._status_callbacks:
            try:
                cb(status)
            except Exception as e:
                logger.error(f"Status callback error: {e}")
    
    async def _rate_limit_wait(self):
        """Wait if needed to respect rate limits."""
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < MIN_DELAY_BETWEEN_REQUESTS:
            wait = MIN_DELAY_BETWEEN_REQUESTS - elapsed
            logger.debug(f"[Queue] Rate limit wait: {wait:.2f}s")
            await asyncio.sleep(wait)
        self._last_request_time = time.time()
    
    async def run_agent(
        self,
        agent_name: str,
        agent_func: Callable,
        symbol: str,
        timeframe: str,
        candle_data: list,
        context: Optional[dict] = None,
        request_id: Optional[str] = None,
        min_candles: int = 20,
        detail: Optional[str] = None,
    ) -> dict:
        """Run a single agent with retries, timeout, caching, and schema validation.
        
        Returns the validated output dict, or a fallback on failure.

        If candle_data has fewer than min_candles entries, this skips the
        API call entirely (saves a rate-limited request) and returns a
        deterministic insufficient-data output — this was previously only
        checked inside SpecialistAgent.analyze(), which was dead code never
        called by the real pipeline, so the check never actually ran.
        """
        request_id = request_id or str(uuid.uuid4())[:8]

        if not candle_data or len(candle_data) < min_candles:
            reason = f"need {min_candles} candles, got {len(candle_data) if candle_data else 0}"
            logger.info(f"[{request_id}] {agent_name} SKIPPED (insufficient candles: {reason})")
            output = create_insufficient_data_output(agent_name, reason)
            self._emit_status(AgentStatus(
                agent=agent_name,
                status="completed",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                duration_ms=0,
                output_preview={"bias": "neutral", "confidence": 0.0, "key_levels": []},
                error=reason,
            ))
            return output
        
        # Check cache first
        cached = self.cache.get(agent_name, symbol, timeframe, candle_data)
        if cached is not None:
            status = AgentStatus(
                agent=agent_name,
                status="completed",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                duration_ms=0,
                output_preview={
                    "bias": cached.get("bias"),
                    "confidence": cached.get("confidence"),
                    "key_levels": cached.get("key_levels", [])[:1],
                    "reasoning": (cached.get("reasoning") or "")[:160],
                    "cached": True,
                },
            )
            self._emit_status(status)
            return cached
        
        # Run with retries
        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            attempt_str = f"[{request_id}] {agent_name} attempt {attempt+1}/{MAX_RETRIES+1}"
            
            # Emit queued/running status
            self._emit_status(AgentStatus(
                agent=agent_name,
                status="running" if attempt == 0 else "retrying",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                attempt=attempt,
                detail=detail,
            ))
            
            try:
                # Rate limit
                await self._rate_limit_wait()
                
                # Run with timeout
                start = time.time()
                raw_output = await asyncio.wait_for(
                    agent_func(symbol, candle_data, timeframe, context),
                    timeout=AGENT_TIMEOUT,
                )
                duration_ms = int((time.time() - start) * 1000)
                
                # Parse if string
                if isinstance(raw_output, str):
                    raw_output = self._parse_json(raw_output)
                
                # Validate schema
                is_valid, errors = validate_specialist_output(raw_output, agent_name)
                if not is_valid:
                    logger.warning(f"{attempt_str} SCHEMA INVALID: {errors}")
                    last_error = f"schema_invalid: {'; '.join(errors)}"
                    if attempt < MAX_RETRIES:
                        await asyncio.sleep(RETRY_DELAYS[attempt])
                        continue
                    # Final attempt failed — return fallback
                    fallback = create_fallback_output(agent_name, last_error)
                    self._emit_status(AgentStatus(
                        agent=agent_name,
                        status="failed",
                        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        duration_ms=duration_ms,
                        error=last_error,
                    ))
                    return fallback
                
                # Success — cache and return
                self.cache.put(agent_name, symbol, timeframe, candle_data, raw_output)
                
                self._emit_status(AgentStatus(
                    agent=agent_name,
                    status="completed",
                    timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    duration_ms=duration_ms,
                    output_preview={
                        "bias": raw_output.get("bias"),
                        "confidence": raw_output.get("confidence"),
                        "key_levels": raw_output.get("key_levels", [])[:1],
                        "reasoning": (raw_output.get("reasoning") or "")[:160],
                    },
                ))
                
                logger.info(f"{attempt_str} OK ({duration_ms}ms) bias={raw_output.get('bias')} conf={raw_output.get('confidence')}")
                return raw_output
                
            except asyncio.TimeoutError:
                last_error = "timeout"
                logger.warning(f"{attempt_str} TIMEOUT after {AGENT_TIMEOUT}s")
            except Exception as e:
                last_error = str(e)[:200]
                logger.error(f"{attempt_str} ERROR: {last_error}")
            
            # Retry delay
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAYS[attempt])
        
        # All retries exhausted
        fallback = create_fallback_output(agent_name, f"All retries failed: {last_error}")
        self._emit_status(AgentStatus(
            agent=agent_name,
            status="failed",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            error=last_error,
        ))
        return fallback
    
    async def run_specialists(
        self,
        specialists: list[tuple[str, Callable]],  # (name, func) pairs
        symbol: str,
        timeframe: str,
        candle_data: list,
        context: Optional[dict] = None,
    ) -> tuple[list[dict], list[AgentStatus]]:
        """Run all specialist agents in sequence with dependency ordering.
        
        Returns (outputs, statuses).
        """
        request_id = str(uuid.uuid4())[:8]
        outputs = []
        statuses = []
        prior_outputs = {}
        
        for agent_name, agent_func in specialists:
            # Pass prior agent outputs as context for dependent agents
            ctx = {**(context or {}), "prior_agent_outputs": prior_outputs}
            
            output = await self.run_agent(
                agent_name=agent_name,
                agent_func=agent_func,
                symbol=symbol,
                timeframe=timeframe,
                candle_data=candle_data,
                context=ctx,
                request_id=request_id,
            )
            
            outputs.append(output)
            prior_outputs[agent_name] = output
            
            # Track status
            statuses.append(AgentStatus(
                agent=agent_name,
                status="completed" if output.get("data_sufficient") else "failed",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                output_preview={
                    "bias": output.get("bias"),
                    "confidence": output.get("confidence"),
                } if output.get("data_sufficient") else None,
                error=output.get("reasoning") if not output.get("data_sufficient") else None,
            ))
        
        return outputs, statuses
    
    def check_quorum(self, specialist_outputs: list[dict]) -> tuple[bool, int, int]:
        """Check if enough specialists reported successfully.
        
        Per spec Section 3: minimum 7/10 must have data_sufficient=true.
        Returns (quorum_met, agents_reporting, agents_data_sufficient).
        """
        agents_reporting = len(specialist_outputs)
        agents_data_sufficient = sum(
            1 for o in specialist_outputs if o.get("data_sufficient", False)
        )
        quorum_met = agents_data_sufficient >= MIN_QUORUM
        
        logger.info(
            f"[Quorum] {agents_data_sufficient}/{agents_reporting} sufficient "
            f"(need {MIN_QUORUM}) — {'MET' if quorum_met else 'NOT MET'}"
        )
        
        return quorum_met, agents_reporting, agents_data_sufficient
    
    def _parse_json(self, raw: str) -> dict:
        """Parse JSON from raw string, handling markdown code blocks."""
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
        
        import re
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        
        return {"agent": "unknown", "bias": "neutral", "confidence": 0, "key_levels": [], "reasoning": raw[:200], "data_sufficient": False}
