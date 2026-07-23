"""
Health Check System — monitors all service dependencies.

Per Volume V Chapter 7 §7.13: Monitoring Architecture
"System Monitoring Tracks: CPU usage, Memory usage, Storage, Network"
"Application Monitoring Tracks: API response time, Errors, Service health"
"AI Monitoring Tracks: Agent performance, Model response quality, AI latency"
"""

import os
import time
import logging
import httpx
from typing import Any

logger = logging.getLogger(__name__)


class HealthChecker:
    """Checks health of all Mavyx Intelligence services."""

    SERVICES = {
        "api-gateway": {
            "url": os.environ.get("GATEWAY_URL", "http://localhost:4000"),
            "endpoint": "/health",
        },
        "authentication-service": {
            "url": os.environ.get("AUTH_SERVICE_URL", "http://localhost:4001"),
            "endpoint": "/health",
        },
        "user-service": {
            "url": os.environ.get("USER_SERVICE_URL", "http://localhost:4002"),
            "endpoint": "/health",
        },
        "market-service": {
            "url": os.environ.get("MARKET_SERVICE_URL", "http://localhost:4003"),
            "endpoint": "/health",
        },
    }

    async def check_all(self) -> dict[str, Any]:
        """Check health of all services."""
        results = {}
        overall_healthy = True

        for name, config in self.SERVICES.items():
            result = await self._check_service(name, config)
            results[name] = result
            if result["status"] != "healthy":
                overall_healthy = False

        return {
            "status": "healthy" if overall_healthy else "degraded",
            "services": results,
            "timestamp": time.time(),
        }

    async def _check_service(self, name: str, config: dict) -> dict[str, Any]:
        """Check a single service's health."""
        url = f"{config['url']}{config['endpoint']}"
        start = time.time()

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url)
                latency_ms = round((time.time() - start) * 1000)

                if response.status_code == 200:
                    return {
                        "status": "healthy",
                        "latency_ms": latency_ms,
                        "details": response.json() if response.headers.get("content-type", "").startswith("application/json") else None,
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "latency_ms": latency_ms,
                        "error": f"HTTP {response.status_code}",
                    }
        except Exception as e:
            latency_ms = round((time.time() - start) * 1000)
            return {
                "status": "unreachable",
                "latency_ms": latency_ms,
                "error": str(e)[:100],
            }

    async def check_ai_service(self) -> dict[str, Any]:
        """Specifically check the AI service health."""
        return await self._check_service(
            "ai-service",
            {"url": "http://localhost:4004", "endpoint": "/health"}
        )
