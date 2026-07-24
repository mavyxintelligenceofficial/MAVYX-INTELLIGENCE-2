'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeSymbol } from '@/features/ai/api';
import { AnalysisResult } from '@/features/ai/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';
import AppLayout from '@/components/layout/AppLayout';

/**
 * AI Analysis Page — Per MEIDS §5.8, §5.11
 * Executive Intelligence Brief with Evidence Cards
 */

export default function AnalysisPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const [symbol, setSymbol] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState('4h');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true); setError(null); setResult(null);
    try {
      const data = await analyzeSymbol(token, symbol, timeframe);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analysis failed.');
    } finally { setIsLoading(false); }
  }

  if (!isHydrated || !token) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 700 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1>AI Analysis</h1>
            <p className="text-caption">Multi-agent intelligence analysis</p>
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleAnalyze} className="mavyx-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Currency Pair</label>
              <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="EUR/USD" className="mavyx-input" />
            </div>
            <div style={{ width: 120 }}>
              <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Timeframe</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="mavyx-input">
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hour</option>
                <option value="1d">Daily</option>
              </select>
            </div>
            <button type="submit" disabled={isLoading} className="mavyx-btn mavyx-btn-primary" style={{ whiteSpace: 'nowrap' }}>
              {isLoading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
          {isLoading && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.3, animation: `fadeIn 1s ease ${i * 0.15}s infinite alternate` }} />
                ))}
              </div>
              <span className="text-caption">Deploying specialist agents...</span>
            </div>
          )}
        </form>

        {error && (
          <div className="mavyx-card" style={{ marginBottom: 16, borderColor: 'rgba(255,59,48,0.2)', color: 'var(--red)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Recommendation */}
            <div className="mavyx-card" style={{ textAlign: 'center', padding: 24 }}>
              <div className="text-label" style={{ marginBottom: 8 }}>{result.symbol}</div>
              <div className={`mavyx-rec-badge rec-${result.recommendation === 'buy' ? 'strong' : result.recommendation === 'sell' ? 'high-risk' : result.recommendation === 'wait' ? 'wait' : 'avoid'}`}
                style={{ fontSize: 18, padding: '8px 24px', marginBottom: 8 }}>
                {result.recommendation === 'buy' ? 'STRONG CANDIDATE' : result.recommendation === 'sell' ? 'HIGH RISK' : result.recommendation === 'wait' ? 'WAIT FOR CONFIRMATION' : 'AVOID'}
              </div>
              <div className="text-caption">Confidence: <span className="text-gold text-number" style={{ fontWeight: 700 }}>{result.confidence}%</span></div>
            </div>

            {/* Confidence Ring + Consensus */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Confidence Ring */}
              <div className="mavyx-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
                <div className="text-label" style={{ marginBottom: 12 }}>Confidence</div>
                <ConfidenceRing value={result.confidence} />
              </div>

              {/* Agent Consensus */}
              <div className="mavyx-card" style={{ padding: 20 }}>
                <div className="text-label" style={{ marginBottom: 12 }}>Agent Consensus</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <ConsensusBar label="Bullish" count={result.agent_consensus.bullish} total={result.agent_consensus.bullish + result.agent_consensus.bearish + result.agent_consensus.neutral} color="var(--green)" />
                  <ConsensusBar label="Bearish" count={result.agent_consensus.bearish} total={result.agent_consensus.bullish + result.agent_consensus.bearish + result.agent_consensus.neutral} color="var(--red)" />
                  <ConsensusBar label="Neutral" count={result.agent_consensus.neutral} total={result.agent_consensus.bullish + result.agent_consensus.bearish + result.agent_consensus.neutral} color="var(--text-tertiary)" />
                </div>
              </div>
            </div>

            {/* Suggested Action */}
            {result.suggested_action?.direction && result.suggested_action.direction !== 'none' && (
              <div className="mavyx-card" style={{ borderColor: 'var(--gold-border)' }}>
                <div className="text-label text-gold" style={{ marginBottom: 12 }}>Suggested Action</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Entry Zone', value: result.suggested_action.entry_zone },
                    { label: 'Stop Loss', value: result.suggested_action.stop_loss },
                    { label: 'Take Profit 1', value: result.suggested_action.take_profit_1 },
                    { label: 'Take Profit 2', value: result.suggested_action.take_profit_2 },
                  ].filter(i => i.value && i.value !== 'N/A').map(item => (
                    <div key={item.label} style={{ padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div className="text-label" style={{ fontSize: 9, marginBottom: 2 }}>{item.label}</div>
                      <div className="text-number" style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Evidence */}
            {result.key_evidence.length > 0 && (
              <div className="mavyx-card">
                <div className="text-label" style={{ marginBottom: 10 }}>Key Evidence</div>
                {result.key_evidence.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < result.key_evidence.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span className="text-gold" style={{ fontSize: 11 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Risk Warnings */}
            {result.risk_warnings.length > 0 && (
              <div className="mavyx-card" style={{ borderColor: 'rgba(255,149,0,0.2)' }}>
                <div className="text-label text-orange" style={{ marginBottom: 10 }}>Risk Warnings</div>
                {result.risk_warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--orange)', padding: '4px 0' }}>• {w}</div>
                ))}
              </div>
            )}

            {/* Agent Breakdown */}
            <div className="mavyx-card">
              <div className="text-label" style={{ marginBottom: 10 }}>Agent Breakdown ({result.agent_breakdown.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.agent_breakdown.map((agent) => (
                  <div key={agent.agent_id}
                    className="mavyx-evidence-card"
                    onClick={() => setExpandedAgent(expandedAgent === agent.agent_id ? null : agent.agent_id)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="agent-name">{formatAgentName(agent.agent_id)}</span>
                      <span className={`signal signal-${agent.signal}`}>{agent.signal} {agent.confidence}%</span>
                    </div>
                    {expandedAgent === agent.agent_id && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{agent.summary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mavyx-card">
              <div className="text-label" style={{ marginBottom: 10 }}>Executive Summary</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {result.executive_summary}
              </p>
            </div>

            {/* Metadata */}
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <span className="text-ghost" style={{ fontSize: 11 }}>
                {result.successful_agents}/{result.total_agents} agents · {result.processing_time_ms}ms · {new Date(result.timestamp).toLocaleString()}
              </span>
            </div>

            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: 11, color: 'var(--text-ghost)' }}>
                AI-generated analysis only · Not financial advice · Always manage your own risk
              </span>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* ─── Sub-components ───────────────────────────────────────────── */

function ConfidenceRing({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="mavyx-confidence-ring">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle className="track" cx="50" cy="50" r={radius} />
        <circle className="fill" cx="50" cy="50" r={radius}
          strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="center-text">
        <span className="percentage">{value}</span>
        <span className="label">Confidence</span>
      </div>
    </div>
  );
}

function ConsensusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 50, fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--bg-primary)', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
      </div>
      <span className="text-number" style={{ width: 16, textAlign: 'right', fontSize: 12, fontWeight: 700, color }}>{count}</span>
    </div>
  );
}

function formatAgentName(id: string): string {
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
