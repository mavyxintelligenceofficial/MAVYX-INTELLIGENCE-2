import { apiRequest } from '@/services/api-client';
import { CandlesResult, Quote } from './types';

export async function getQuote(token: string, symbol: string): Promise<Quote> {
  return apiRequest<Quote>(`/market/quote?symbol=${encodeURIComponent(symbol)}`, { token });
}

export async function getCandles(
  token: string,
  symbol: string,
  interval: string,
): Promise<CandlesResult> {
  return apiRequest<CandlesResult>(
    `/market/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`,
    { token },
  );
}

/**
 * Fetches a quote for every symbol in a watchlist. Runs in parallel and
 * tolerates individual failures (e.g. a mistyped symbol) - one bad
 * symbol shouldn't blank out the rest of the user's watchlist.
 */
export async function getQuotes(token: string, symbols: string[]): Promise<Record<string, Quote | null>> {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        return [symbol, await getQuote(token, symbol)] as const;
      } catch {
        return [symbol, null] as const;
      }
    }),
  );

  return Object.fromEntries(results);
}
