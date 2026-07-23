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
