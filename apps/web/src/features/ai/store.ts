import { create } from 'zustand';
import type { AnalysisResult } from './types';

/**
 * Global AI Analysis Store
 * Persists analysis results AND chat history across page navigation.
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface JournalEntry {
  id: string;
  timestamp: string;
  symbol: string;
  timeframe: string;
  recommendation: string;
  confidence: number;
  executiveSummary: string;
  keyEvidence: string[];
  riskWarnings: string[];
  agentBreakdown: any[];
  outcome?: string; // pending, win, loss, breakeven
  notes?: string;
}

interface AIState {
  // Analysis
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  symbol: string;
  timeframe: string;

  // Chat
  chatMessages: ChatMessage[];

  // Journal
  journal: JournalEntry[];

  // Analytics
  totalAnalyses: number;
  recommendationCounts: Record<string, number>;

  // Actions
  setResult: (result: AnalysisResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  addToJournal: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  clear: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  result: null,
  isLoading: false,
  error: null,
  symbol: 'EUR/USD',
  timeframe: '4h',
  chatMessages: [],
  journal: [],
  totalAnalyses: 0,
  recommendationCounts: { buy: 0, sell: 0, wait: 0, no_trade: 0 },

  setResult: (result) => {
    const rec = result.recommendation || 'wait';
    const counts = { ...get().recommendationCounts };
    counts[rec] = (counts[rec] || 0) + 1;

    // Auto-create journal entry
    const entry: JournalEntry = {
      id: `analysis-${Date.now()}`,
      timestamp: result.timestamp || new Date().toISOString(),
      symbol: result.symbol,
      timeframe: result.timeframe,
      recommendation: result.recommendation,
      confidence: result.confidence,
      executiveSummary: result.executive_summary || '',
      keyEvidence: result.key_evidence || [],
      riskWarnings: result.risk_warnings || [],
      agentBreakdown: result.agent_breakdown || [],
      outcome: 'pending',
    };

    set(state => ({
      result,
      isLoading: false,
      error: null,
      totalAnalyses: state.totalAnalyses + 1,
      recommendationCounts: counts,
      journal: [entry, ...state.journal],
      chatMessages: [
        { role: 'assistant' as const, text: `Analysis complete for ${result.symbol}: ${result.recommendation?.toUpperCase()} with ${result.confidence}% confidence. Ask me anything about this analysis.` }
      ],
    }));
  },

  setLoading: (isLoading) => set({ isLoading, error: null }),
  setError: (error) => set({ error, isLoading: false }),
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),

  addChatMessage: (msg) => set(state => ({
    chatMessages: [...state.chatMessages, msg],
  })),

  clearChat: () => set({ chatMessages: [] }),

  addToJournal: (entry) => set(state => ({
    journal: [entry, ...state.journal],
  })),

  updateJournalEntry: (id, updates) => set(state => ({
    journal: state.journal.map(e => e.id === id ? { ...e, ...updates } : e),
  })),

  clear: () => set({
    result: null,
    isLoading: false,
    error: null,
    chatMessages: [],
  }),
}));
