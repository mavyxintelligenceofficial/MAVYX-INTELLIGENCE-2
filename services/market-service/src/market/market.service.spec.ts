import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketService } from './market.service';

describe('MarketService', () => {
  let provider: any;
  let cache: any;
  let marketService: MarketService;

  beforeEach(() => {
    provider = {
      getQuote: vi.fn().mockResolvedValue({ symbol: 'EUR/USD', price: 1.085, timestamp: '2026-07-18T00:00:00.000Z' }),
      getCandles: vi.fn().mockResolvedValue({ symbol: 'EUR/USD', interval: '1h', candles: [] }),
    };
    cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };
    marketService = new MarketService(provider, cache);
  });

  it('fetches a quote from the provider and caches it when not already cached', async () => {
    const quote = await marketService.getQuote('EUR/USD');

    expect(provider.getQuote).toHaveBeenCalledWith('EUR/USD');
    expect(cache.set).toHaveBeenCalledWith('quote:EUR/USD', quote, 30);
    expect(quote.price).toBe(1.085);
  });

  it('returns the cached quote and never calls the provider when already cached', async () => {
    const cachedQuote = { symbol: 'EUR/USD', price: 1.09, timestamp: '2026-07-18T00:00:00.000Z' };
    cache.get.mockResolvedValue(cachedQuote);

    const quote = await marketService.getQuote('EUR/USD');

    expect(provider.getQuote).not.toHaveBeenCalled();
    expect(quote).toEqual(cachedQuote);
  });

  it('fetches candles from the provider and caches them when not already cached', async () => {
    const result = await marketService.getCandles('EUR/USD', '1h');

    expect(provider.getCandles).toHaveBeenCalledWith('EUR/USD', '1h');
    expect(cache.set).toHaveBeenCalledWith('candles:EUR/USD:1h', result, 300);
  });
});
