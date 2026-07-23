/**
 * API client for the AI Analysis feature.
 * Calls the gateway's /ai/* endpoints (which proxy to the model-service).
 */

import { apiRequest } from '@/services/api-client';
import { AnalysisResult } from './types';

/**
 * Request a full AI analysis for a currency pair.
 * This runs all 7 specialist agents + the Executive Decision Engine.
 * Typically takes 15-30 seconds.
 */
export async function analyzeSymbol(
  token: string,
  symbol: string,
  timeframe: string = '4h',
): Promise<AnalysisResult> {
  return apiRequest<AnalysisResult>('/ai/analyze', {
    method: 'POST',
    token,
    body: { symbol, timeframe },
  });
}

/**
 * Check if the AI service is healthy.
 */
export async function checkAiHealth(): Promise<{ status: string; service: string }> {
  return apiRequest<{ status: string; service: string }>('/ai/health');
}
