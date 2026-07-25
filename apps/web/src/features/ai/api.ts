/**
 * API client for the AI features.
 * Calls the gateway's /ai/* endpoints.
 */

import { apiRequest } from '@/services/api-client';
import { AnalysisResult } from './types';

/**
 * Request a full AI analysis for a currency pair.
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

/**
 * Send a message to the AI Assistant.
 */
export async function chatWithAssistant(
  token: string,
  message: string,
  chatHistory: Array<{ role: string; text: string }>,
  context: Record<string, any>,
): Promise<{ response: string; action: any }> {
  return apiRequest<{ response: string; action: any }>('/ai/assistant', {
    method: 'POST',
    token,
    body: {
      message,
      chat_history: chatHistory.map(m => ({ role: m.role, text: m.text })),
      context,
    },
  });
}

/**
 * Request AI review of a journal entry.
 * Per MEIDS Ch.13 §13.4: AI Trade Review
 */
export async function reviewJournalEntry(
  token: string,
  analysis: any,
): Promise<any> {
  return apiRequest<any>('/ai/journal/review', {
    method: 'POST',
    token,
    body: { analysis },
  });
}

/**
 * Generate weekly intelligence review.
 * Per MEIDS Ch.13 §13.15: Weekly Intelligence Review
 */
export async function generateWeeklyReview(
  token: string,
  journalEntries: any[],
): Promise<any> {
  return apiRequest<any>('/ai/journal/weekly-review', {
    method: 'POST',
    token,
    body: { journal_entries: journalEntries },
  });
}
