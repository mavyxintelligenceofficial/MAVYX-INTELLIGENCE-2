'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { analyzeSymbol } from '@/features/ai/api';
import { AnalysisResult } from '@/features/ai/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

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

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && !token) router.replace('/login');
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
      setError(err instanceof ApiError ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isHydrated || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="mavyx-spinner" />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6" style={{ background: '#0A0A0F' }}>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={32} height={32} />
            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#E8E8F0' }}>AI Analysis</h1>
              <p className="text-xs" style={{ color: '#8888A0' }}>Multi-agent intelligence for {symbol}</p>
            </div>
          </div>
          <Link href="/profile" className="text-sm transition-colors hover:text-amber-400" style={{ color: '#8888A0' }}>
            Back
          </Link>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="mavyx-card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#8888A0' }}>Currency Pair</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="EUR/USD"
                className="mavyx-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#8888A0' }}>Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="mavyx-input"
              >
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hour</option>
                <option value="1d">Daily</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="mavyx-btn-gold w-full">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="mavyx-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Analyzing...
              </span>
            ) : (
              'Run AI Analysis'
            )}
          </button>
          {isLoading && (
            <p className="text-xs text-center" style={{ color: '#8888A0' }}>
              Running 7 specialist agents in parallel... This may take 15-30 seconds.
            </p>
          )}
        </form>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(255,23,68,0.1)', color: '#FF5252', border: '1px solid rgba(255,23,68,0.2)' }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Recommendation Card */}
            <RecommendationCard result={result} />

            {/* Confidence & Consensus */}
            <div className="grid grid-cols-2 gap-4">
              <ConfidenceCard confidence={result.confidence} />
              <ConsensusCard consensus={result.agent_consensus} />
            </div>

            {/* Suggested Action */}
            {result.suggested_action?.direction && result.suggested_action.direction !== 'none' && (
              <SuggestedActionCard action={result.suggested_action} />
            )}

            {/* Key Evidence */}
            {result.key_evidence.length > 0 && (
              <Accordion title="Key Evidence" count={result.key_evidence.length} isOpen={showEvidence} onToggle={() => setShowEvidence(!showEvidence)}>
                <ul className="space-y-2">
                  {result.key_evidence.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#E8E8F0' }}>
                      <span style={{ color: '#C9A84C' }}>✓</span> {e}
                    </li>
                  ))}
                </ul>
              </Accordion>
            )}

            {/* Risk Warnings */}
            {result.risk_warnings.length > 0 && (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(255,179,0,0.08)', border: '1px solid rgba(255,179,0,0.2)' }}>
                <h3 className="text-sm font-medium mb-2" style={{ color: '#FFB300' }}>⚠️ Risk Warnings</h3>
                <ul className="space-y-1">
                  {result.risk_warnings.map((w, i) => (
                    <li key={i} className="text-sm" style={{ color: '#FFD54F' }}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Agent Breakdown */}
            <Accordion title="Agent Breakdown" count={result.agent_breakdown.length} isOpen={showAgents} onToggle={() => setShowAgents(!showAgents)}>
              <div className="space-y-3">
                {result.agent_breakdown.map((agent) => (
                  <AgentCard key={agent.agent_id} agent={agent} />
                ))}
              </div>
            </Accordion>

            {/* Executive Summary */}
            <div className="mavyx-card">
              <h3 className="text-sm font-medium mb-2" style={{ color: '#C9A84C' }}>Executive Summary</h3>
              <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: '#8888A0' }}>
                {result.executive_summary}
              </p>
            </div>

            {/* Metadata */}
            <p className="text-xs text-center" style={{ color: '#555560' }}>
              {result.successful_agents}/{result.total_agents} agents completed in {result.processing_time_ms}ms •{' '}
              {new Date(result.timestamp).toLocaleString()}
            </p>

            {/* Disclaimer */}
            <p className="text-xs text-center italic" style={{ color: '#444450' }}>
              AI-generated analysis only — not financial advice. Always manage your own risk.
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
    buy: { label: 'BUY', emoji: '🟢', class: 'mavyx-rec-buy', color: '#00C853' },
    sell: { label: 'SELL', emoji: '🔴', class: 'mavyx-rec-sell', color: '#FF1744' },
    wait: { label: 'WAIT', emoji: '🟡', class: 'mavyx-rec-wait', color: '#FFB300' },
    no_trade: { label: 'NO TRADE', emoji: '⚪', class: 'mavyx-rec-no-trade', color: '#8888A0' },
  };
  const c = config[result.recommendation];

  return (
    <div className={`${c.class} p-8 text-center`}>
      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#8888A0' }}>{result.symbol}</p>
      <div className="text-5xl font-bold mb-2" style={{ color: c.color }}>
        {c.emoji} {c.label}
      </div>
      <p className="text-sm" style={{ color: '#8888A0' }}>
        Confidence: <span className="font-bold" style={{ color: '#C9A84C' }}>{result.confidence}%</span>
      </p>
    </div>
  );
}

function ConfidenceCard({ confidence }: { confidence: number }) {
  const getColor = (c: number) => c >= 70 ? 'mavyx-confidence-high' : c >= 50 ? 'mavyx-confidence-medium' : 'mavyx-confidence-low';
  return (
    <div className="mavyx-card">
      <p className="text-xs font-medium mb-3" style={{ color: '#8888A0' }}>Confidence</p>
      <p className="text-3xl font-bold mb-3" style={{ color: '#C9A84C' }}>{confidence}%</p>
      <div className="mavyx-confidence-bar">
        <div className={`mavyx-confidence-fill ${getColor(confidence)}`} style={{ width: `${confidence}%` }} />
      </div>
    </div>
  );
}

function ConsensusCard({ consensus }: { consensus: AnalysisResult['agent_consensus'] }) {
  const total = consensus.bullish + consensus.bearish + consensus.neutral;
  return (
    <div className="mavyx-card">
      <p className="text-xs font-medium mb-3" style={{ color: '#8888A0' }}>Agent Consensus</p>
      <div className="space-y-2">
        {[
          { label: 'Bullish', count: consensus.bullish, color: '#00C853' },
          { label: 'Bearish', count: consensus.bearish, color: '#FF1744' },
          { label: 'Neutral', count: consensus.neutral, color: '#8888A0' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs w-14" style={{ color: '#8888A0' }}>{item.label}</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: '#1A1A25' }}>
              <div className="h-full rounded-full" style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%`, background: item.color }} />
            </div>
            <span className="text-xs font-bold w-4 text-right" style={{ color: item.color }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestedActionCard({ action }: { action: AnalysisResult['suggested_action'] }) {
  return (
    <div className="mavyx-card" style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
      <h3 className="text-sm font-medium mb-3" style={{ color: '#C9A84C' }}>Suggested Action</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          { label: 'Entry', value: action.entry_zone },
          { label: 'Stop Loss', value: action.stop_loss },
          { label: 'TP1', value: action.take_profit_1 },
          { label: 'TP2', value: action.take_profit_2 },
        ].filter(i => i.value && i.value !== 'N/A').map((item) => (
          <div key={item.label}>
            <span style={{ color: '#8888A0' }}>{item.label}: </span>
            <span className="font-medium" style={{ color: '#E8E8F0' }}>{item.value}</span>
          </div>
        ))}
      </div>
      {action.risk_note && <p className="mt-2 text-xs" style={{ color: '#8888A0' }}>{action.risk_note}</p>}
    </div>
  );
}

function AgentCard({ agent }: { agent: AnalysisResult['agent_breakdown'][0] }) {
  const badgeClass = agent.signal === 'bullish' ? 'mavyx-badge-bullish' : agent.signal === 'bearish' ? 'mavyx-badge-bearish' : 'mavyx-badge-neutral';
  return (
    <div className="p-3 rounded-lg" style={{ background: '#1A1A25', border: '1px solid #2A2A3A' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: '#E8E8F0' }}>
          {agent.agent_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </span>
        <span className={badgeClass}>{agent.signal.toUpperCase()} ({agent.confidence}%)</span>
      </div>
      <p className="text-xs" style={{ color: '#8888A0' }}>{agent.summary}</p>
    </div>
  );
}

function Accordion({ title, count, isOpen, onToggle, children }: { title: string; count: number; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="mavyx-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between text-left">
        <span className="text-sm font-medium" style={{ color: '#C9A84C' }}>{title} ({count})</span>
        <span style={{ color: '#8888A0' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}
