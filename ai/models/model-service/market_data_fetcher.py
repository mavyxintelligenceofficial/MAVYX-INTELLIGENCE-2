"""
Market Data Fetcher — bridges the AI pipeline to the existing market-service.

This module fetches live quotes and historical candles from the NestJS
market-service (port 4003) and formats them for the specialist agents.

The market-service already has:
- GET /market/quote?symbol=EUR/USD → live price
- GET /market/candles?symbol=EUR/USD&interval=4h → historical candles

This fetcher calls those endpoints and returns the data in the format
the agents expect: {"price": {...}, "candles": [...]}
"""

import os
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

MARKET_SERVICE_URL = os.environ.get(
    "MARKET_SERVICE_URL", "http://localhost:4003"
)


async def fetch_market_data(
    symbol: str, timeframe: str = "4h"
) -> dict[str, Any]:
    """Fetch market data from the market-service.

    Args:
        symbol: Currency pair (e.g. "EUR/USD")
        timeframe: Candle interval (e.g. "4h", "1h", "1d")

    Returns:
        {"price": Quote, "candles": [Candle, ...]}
    """
    price = {}
    candles = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Fetch live quote
        try:
            resp = await client.get(
                f"{MARKET_SERVICE_URL}/market/quote",
                params={"symbol": symbol},
            )
            if resp.status_code == 200:
                price = resp.json()
                logger.info(f"Fetched quote: {symbol} = {price.get('price')}")
            else:
                logger.warning(
                    f"Quote fetch failed: {resp.status_code} {resp.text[:100]}"
                )
        except Exception as e:
            logger.error(f"Quote fetch error: {e}")

        # Fetch historical candles
        try:
            resp = await client.get(
                f"{MARKET_SERVICE_URL}/market/candles",
                params={"symbol": symbol, "interval": timeframe},
            )
            if resp.status_code == 200:
                data = resp.json()
                candles = data.get("candles", [])
                logger.info(
                    f"Fetched candles: {symbol} {timeframe} = {len(candles)} candles"
                )
            else:
                logger.warning(
                    f"Candles fetch failed: {resp.status_code} {resp.text[:100]}"
                )
        except Exception as e:
            logger.error(f"Candles fetch error: {e}")

    return {"price": price, "candles": candles}
