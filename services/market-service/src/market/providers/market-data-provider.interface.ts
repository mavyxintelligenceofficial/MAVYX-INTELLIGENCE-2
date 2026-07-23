/**
 * Provider-agnostic market data contract (mirrors the TAD/AI System
 * Design Blueprint's "provider-agnostic" pattern already used for AI
 * providers). Any future data source (a different API, a broker feed,
 * etc.) implements this same interface - nothing else in this service
 * needs to change if the provider is swapped later.
 */

export interface Quote {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlesResult {
  symbol: string;
  interval: string;
  candles: Candle[];
}

export const MARKET_DATA_PROVIDER = 'MARKET_DATA_PROVIDER';

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getCandles(symbol: string, interval: string): Promise<CandlesResult>;
}
