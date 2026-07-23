/**
 * TypeScript types for the AI Analysis feature.
 * Matches the response format from the Executive Decision Engine.
 */

export interface AgentBreakdown {
  agent_id: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary: string;
}

export interface SuggestedAction {
  direction?: string;
  entry_zone?: string;
  stop_loss?: string;
  take_profit_1?: string;
  take_profit_2?: string;
  risk_note?: string;
}

export interface AnalysisResult {
  symbol: string;
  timeframe: string;
  timestamp: string;
  recommendation: 'buy' | 'sell' | 'wait' | 'no_trade';
  confidence: number;
  executive_summary: string;
  agent_consensus: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  agent_breakdown: AgentBreakdown[];
  key_evidence: string[];
  risk_warnings: string[];
  suggested_action: SuggestedAction;
  processing_time_ms: number;
  total_agents: number;
  successful_agents: number;
}
