import { create } from 'zustand';
import type { AnalysisResult } from './types';

/**
 * Global AI Analysis Store
 * Persists analysis results across page navigation.
 * When user runs an analysis, it stays visible until they run a new one.
 */

interface AIState {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  symbol: string;
  timeframe: string;
  setResult: (result: AnalysisResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;
  clear: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  result: null,
  isLoading: false,
  error: null,
  symbol: 'EUR/USD',
  timeframe: '4h',
  setResult: (result) => set({ result, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading, error: null }),
  setError: (error) => set({ error, isLoading: false }),
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  clear: () => set({ result: null, isLoading: false, error: null }),
}));
