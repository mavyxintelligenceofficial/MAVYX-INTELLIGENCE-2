import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '../common/cache.service';
import { CandlesResult, MarketDataProvider, MARKET_DATA_PROVIDER, Quote } from './providers/market-data-provider.interface';

const QUOTE_CACHE_TTL_SECONDS = 120;  // 2 minutes (was 30s - too aggressive for free tier)
const CANDLES_CACHE_TTL_SECONDS = 600; // 10 minutes (was 5 min)

@Injectable()
export class MarketService {
  constructor(
    @Inject(MARKET_DATA_PROVIDER) private readonly provider: MarketDataProvider,
    private readonly cache: CacheService,
  ) {}

  async getQuote(symbol: string): Promise<Quote> {
    const cacheKey = `quote:${symbol}`;
    const cached = await this.cache.get<Quote>(cacheKey);
    if (cached) return cached;

    const quote = await this.provider.getQuote(symbol);
    await this.cache.set(cacheKey, quote, QUOTE_CACHE_TTL_SECONDS);
    return quote;
  }

  async getCandles(symbol: string, interval: string): Promise<CandlesResult> {
    const cacheKey = `candles:${symbol}:${interval}`;
    const cached = await this.cache.get<CandlesResult>(cacheKey);
    if (cached) return cached;

    const result = await this.provider.getCandles(symbol, interval);
    await this.cache.set(cacheKey, result, CANDLES_CACHE_TTL_SECONDS);
    return result;
  }
}
