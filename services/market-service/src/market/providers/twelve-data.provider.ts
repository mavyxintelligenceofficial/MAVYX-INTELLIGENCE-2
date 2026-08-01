import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Candle, CandlesResult, MarketDataProvider, Quote } from './market-data-provider.interface';

const BASE_URL = 'https://api.twelvedata.com';

/**
 * Twelve Data implementation of MarketDataProvider (see that file for why
 * this is behind an interface). Docs: https://twelvedata.com/docs
 *
 * Twelve Data uses symbols like "EUR/USD" (with the slash) - callers of
 * this service should pass symbols in that format.
 */
@Injectable()
export class TwelveDataProvider implements MarketDataProvider {
  constructor(private readonly httpService: HttpService) {}

  private get apiKey(): string {
    // Read fresh every time, not cached at construction - the
    // POST /market/api-key endpoint updates process.env at runtime
    // specifically so a key can be swapped without restarting the
    // service, which only works if we actually re-read it here.
    return process.env.MARKET_DATA_API_KEY || '';
  }

  async getQuote(symbol: string): Promise<Quote> {
    const response = await this.request<{ price: string; code?: number; message?: string }>('/price', {
      symbol,
    });

    if (response.code) {
      throw new ServiceUnavailableException(response.message || 'Market data provider error');
    }

    return {
      symbol,
      price: Number(response.price),
      timestamp: new Date().toISOString(),
    };
  }

  async getCandles(symbol: string, interval: string): Promise<CandlesResult> {
    const response = await this.request<{
      values?: Array<{ datetime: string; open: string; high: string; low: string; close: string }>;
      code?: number;
      message?: string;
    }>('/time_series', { symbol, interval, outputsize: '30' });

    if (response.code || !response.values) {
      throw new ServiceUnavailableException(response.message || 'Market data provider error');
    }

    const candles: Candle[] = response.values.map((v) => ({
      timestamp: v.datetime,
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
    }));

    return { symbol, interval, candles };
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'MARKET_DATA_API_KEY is not set - sign up at https://twelvedata.com/pricing and add your key to .env',
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(`${BASE_URL}${path}`, {
          params: { ...params, apikey: this.apiKey },
        }),
      );
      return response.data;
    } catch (err) {
      // Twelve Data returns some errors as a 200 with {code, message} in the
      // body (handled by the caller's own `if (response.code)` check), but
      // for an unsupported/unrecognized symbol (e.g. an index or a bond
      // yield not available on this plan) it can return a non-2xx HTTP
      // status directly, which makes axios throw. That was previously
      // uncaught here, so it surfaced as an opaque 500 with no message
      // instead of a clear, honest error.
      const axiosErr = err as { response?: { status?: number; data?: any } };
      const upstreamMessage =
        axiosErr?.response?.data?.message || axiosErr?.response?.data?.error || null;
      throw new ServiceUnavailableException(
        upstreamMessage ||
          `Twelve Data request failed for ${params.symbol || 'unknown symbol'}` +
            (axiosErr?.response?.status ? ` (upstream status ${axiosErr.response.status})` : ''),
      );
    }
  }
}
