'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { analyzeSymbol } from '@/features/ai/api';
import { AnalysisResult } from '@/features/ai/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

/**
 * AI Analysis page — the main interface for Mavyx Intelligence.
 *
 * Users enter a currency pair, click "Analyze", and the platform runs
 * 7 specialist AI agents in parallel, then synthesizes their findings
 * through the Executive Decision Engine into a single recommendation.
 */
export default function AnalysisPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  const [symbol, setSymbol] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState('4h');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showAgents, setShowAgents] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [isHydrated, token, router]);

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeSymbol(token, symbol, timeframe);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Analysis failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!isHydrated || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              AI Analysis
            </h1>
            <p className="text-sm text-slate-500">
              Multi-agent intelligence for {symbol}
            </p>
          </div>
          <Link
            href="/profile"
            className="text-sm text-slate-500 underline"
          >
            Back to profile
          </Link>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="symbol" className="mb-1 block text-sm font-medium text-slate-700">
                Currency pair
              </label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="EUR/USD"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="timeframe" className="mb-1 block text-sm font-medium text-slate-700">
                Timeframe
              </label>
              <select
                id="timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hour</option>
                <option value="1d">Daily</option>
              </select>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading}>
            {isLoading ? 'Analyzing...' : 'Run AI Analysis'}
          </Button>

          {isLoading && (
            <p className="text-xs text-slate-500 text-center">
              Running 7 specialist agents in parallel... This may take 15-30 seconds.
            </p>
          )}
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Recommendation Card */}
            <RecommendationCard result={result} />

            {/* Confidence Meter */}
            <ConfidenceMeter confidence={result.confidence} />

            {/* Agent Consensus */}
            <ConsensusCard consensus={result.agent_consensus} />

            {/* Suggested Action */}
            {result.suggested_action?.direction && result.suggested_action.direction !== 'none' && (
              <SuggestedActionCard action={result.suggested_action} />
            )}

            {/* Key Evidence */}
            {result.key_evidence.length > 0 && (
              <Accordion
                title="Key Evidence"
                count={result.key_evidence.length}
                isOpen={showEvidence}
                onToggle={() => setShowEvidence(!showEvidence)}
              >
                <ul className="space-y-2">
                  {result.key_evidence.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </Accordion>
            )}

            {/* Risk Warnings */}
            {result.risk_warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-medium text-amber-800 mb-2">⚠️ Risk Warnings</h3>
                <ul className="space-y-1">
                  {result.risk_warnings.map((w, i) => (
                    <li key={i} className="text-sm text-amber-700">• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Agent Breakdown */}
            <Accordion
              title="Agent Breakdown"
              count={result.agent_breakdown.length}
              isOpen={showAgents}
              onToggle={() => setShowAgents(!showAgents)}
            >
              <div className="space-y-3">
                {result.agent_breakdown.map((agent) => (
                  <AgentCard key={agent.agent_id} agent={agent} />
                ))}
              </div>
            </Accordion>

            {/* Executive Summary */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Executive Summary</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {result.executive_summary}
              </p>
            </div>

            {/* Metadata */}
            <p className="text-xs text-slate-400 text-center">
              {result.successful_agents}/{result.total_agents} agents completed
              in {result.processing_time_ms}ms •{' '}
              {new Date(result.timestamp).toLocaleString()}
            </p>

            {/* Disclaimer */}
            <p className="text-xs text-slate-400 text-center italic">
              This is AI-generated analysis only — not financial advice.
              Always do your own research and manage risk appropriately.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

/* ─── Sub-components ───────────────────────────────────────────── */

function RecommendationCard({ result }: { result: AnalysisResult }) {
  const config = {
    buy: { label: 'BUY', color: 'bg-green-500', textColor: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    sell: { label: 'SELL', color: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    wait: { label: 'WAIT', color: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    no_trade: { label: 'NO TRADE', color: 'bg-slate-500', textColor: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
  };

  const c = config[result.recommendation];

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-6 text-center`}>
      <p className="text-sm text-slate-500 mb-1">{result.symbol}</p>
      <div className={`inline-block rounded-full px-6 py-2 ${c.color} text-white text-xl font-bold`}>
        {c.label}
      </div>
      <p className={`mt-2 text-sm ${c.textColor}`}>
        Confidence: {result.confidence}%
      </p>
    </div>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const getColor = (c: number) => {
    if (c >= 70) return 'bg-green-500';
    if (c >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">Confidence</span>
        <span className="text-sm font-bold text-slate-900">{confidence}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(confidence)} rounded-full transition-all duration-500`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

function ConsensusCard({ consensus }: { consensus: AnalysisResult['agent_consensus'] }) {
  const total = consensus.bullish + consensus.bearish + consensus.neutral;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-medium text-slate-700 mb-3">Agent Consensus</h3>
      <div className="flex gap-2">
        <ConsensusBar label="Bullish" count={consensus.bullish} total={total} color="bg-green-500" />
        <ConsensusBar label="Bearish" count={consensus.bearish} total={total} color="bg-red-500" />
        <ConsensusBar label="Neutral" count={consensus.neutral} total={total} color="bg-slate-400" />
      </div>
    </div>
  );
}

function ConsensusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex-1 text-center">
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-900">{count}</p>
    </div>
  );
}

function SuggestedActionCard({ action }: { action: AnalysisResult['suggested_action'] }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="text-sm font-medium text-blue-800 mb-3">Suggested Action</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {action.entry_zone && (
          <div>
            <span className="text-blue-600">Entry:</span>{' '}
            <span className="text-blue-900 font-medium">{action.entry_zone}</span>
          </div>
        )}
        {action.stop_loss && (
          <div>
            <span className="text-blue-600">Stop Loss:</span>{' '}
            <span className="text-blue-900 font-medium">{action.stop_loss}</span>
          </div>
        )}
        {action.take_profit_1 && (
          <div>
            <span className="text-blue-600">TP1:</span>{' '}
            <span className="text-blue-900 font-medium">{action.take_profit_1}</span>
          </div>
        )}
        {action.take_profit_2 && (
          <div>
            <span className="text-blue-600">TP2:</span>{' '}
            <span className="text-blue-900 font-medium">{action.take_profit_2}</span>
          </div>
        )}
      </div>
      {action.risk_note && (
        <p className="mt-2 text-xs text-blue-600">{action.risk_note}</p>
      )}
    </div>
  );
}

function AgentCard({ agent }: { agent: AnalysisResult['agent_breakdown'][0] }) {
  const signalColors = {
    bullish: 'text-green-600 bg-green-50',
    bearish: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50',
  };

  const color = signalColors[agent.signal] || signalColors.neutral;

  return (
    <div className="rounded-md border border-slate-100 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">
          {formatAgentName(agent.agent_id)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
          {agent.signal.toUpperCase()} ({agent.confidence}%)
        </span>
      </div>
      <p className="text-xs text-slate-500">{agent.summary}</p>
    </div>
  );
}

function Accordion({
  title,
  count,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50"
      >
        <span className="text-sm font-medium text-slate-700">
          {title} ({count})
        </span>
        <span className="text-slate-400">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function formatAgentName(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
