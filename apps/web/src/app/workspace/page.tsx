'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { getQuote, getCandles } from '@/features/market/api';
import { analyzeSymbol } from '@/features/ai/api';
import type { AnalysisResult } from '@/features/ai/types';
import type { Quote } from '@/features/market/types';
import AppLayout from '@/components/layout/AppLayout';
import dynamic from 'next/dynamic';

// Dynamic import for chart (no SSR)
const CandlestickChart = dynamic(() => import('@/components/CandlestickChart'), { ssr: false });

const TIMEFRAMES = [
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
];

export default function WorkspacePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  const [symbol, setSymbol] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState('4h');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  // Fetch market data when symbol/timeframe changes
  useEffect(() => {
    if (!token) return;
    getQuote(token, symbol).then(setQuote).catch(() => {});
    getCandles(token, symbol, timeframe).then(d => setCandles(d.candles || [])).catch(() => {});
  }, [token, symbol, timeframe]);

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true); setError(null);
    try {
      const data = await analyzeSymbol(token, symbol, timeframe);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Analysis failed');
    } finally { setIsLoading(false); }
  }

  if (!isHydrated || !token) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;
  }

  return (
    <AppLayout>
      {/* ─── Top Controls ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="text" value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="mavyx-input" style={{ width: 120, fontSize: 13, fontWeight: 600 }}
            placeholder="EUR/USD"
          />
          <div style={{ display: 'flex', gap: 2 }}>
            {TIMEFRAMES.map(tf => (
              <button key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className="mavyx-btn mavyx-btn-ghost"
                style={{
                  padding: '6px 12px', fontSize: 11, fontWeight: 700,
                  background: timeframe === tf.value ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: timeframe === tf.value ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  borderBottom: timeframe === tf.value ? '2px solid var(--gold)' : '2px solid transparent',
                  borderRadius: 0,
                }}>
                {tf.label}
              </button>
            ))}
          </div>
          {quote && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginLeft: 8 }}>
              <span className="text-number" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{quote.price}</span>
              <span className="text-caption">{symbol}</span>
            </div>
          )}
        </div>
        <button onClick={handleAnalyze} disabled={isLoading} className="mavyx-btn mavyx-btn-primary">
          {isLoading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 8, padding: '6px 10px', background: 'var(--red-dim)', borderRadius: 4, fontSize: 12, color: 'var(--red)' }}>{error}</div>
      )}

      {/* ─── Main Content: Chart + AI Panel ────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        {/* ─── Chart Area (Left - 60%) ─────────────────────────── */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="mavyx-card" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: 400 }}>
            {candles.length > 0 ? (
              <CandlestickChart candles={candles} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, color: 'var(--text-ghost)', marginBottom: 8 }}>◈</div>
                  <p className="text-caption">Loading chart data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Info Cards */}
          <div style={{ display: 'flex', gap: 8 }}>
            <MiniCard label="Price" value={quote?.price?.toString() || '—'} />
            <MiniCard label="Timeframe" value={timeframe.toUpperCase()} />
            <MiniCard label="Candles" value={candles.length.toString()} />
            <MiniCard label="Last Analysis" value={result?.recommendation?.toUpperCase() || 'None'} valueColor={result ? (result.recommendation === 'buy' ? 'var(--green)' : result.recommendation === 'sell' ? 'var(--red)' : 'var(--orange)') : undefined} />
          </div>
        </div>

        {/* ─── AI Intelligence Panel (Right - 40%) ─────────────── */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 320, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          {isLoading && (
            <div className="mavyx-card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 12 }}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.3, animation: `fadeIn 1s ease ${i * 0.1}s infinite alternate` }} />
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Deploying 11 specialist agents...</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>This may take 30-60 seconds</p>
            </div>
          )}

          {result && !isLoading && (
            <>
              {/* Executive Summary */}
              <div className="mavyx-card" style={{ borderColor: 'var(--gold-border)' }}>
                <div className="text-label text-gold" style={{ marginBottom: 8 }}>Executive Intelligence Brief</div>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div className={`mavyx-rec-badge rec-${result.recommendation === 'buy' ? 'strong' : result.recommendation === 'sell' ? 'high-risk' : result.recommendation === 'wait' ? 'wait' : 'avoid'}`}>
                    {result.recommendation === 'buy' ? 'STRONG CANDIDATE' : result.recommendation === 'sell' ? 'HIGH RISK' : result.recommendation === 'wait' ? 'WAIT' : 'AVOID'}
                  </div>
                </div>

                {/* Confidence Ring */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <ConfidenceRing value={result.confidence} />
                </div>

                {/* Agent Consensus */}
                <div style={{ marginBottom: 12 }}>
                  <div className="text-label" style={{ marginBottom: 6 }}>Agent Consensus</div>
                  <ConsensusRow label="Bullish" count={result.agent_consensus?.bullish || 0} total={(result.agent_consensus?.bullish || 0) + (result.agent_consensus?.bearish || 0) + (result.agent_consensus?.neutral || 0)} color="var(--green)" />
                  <ConsensusRow label="Bearish" count={result.agent_consensus?.bearish || 0} total={(result.agent_consensus?.bullish || 0) + (result.agent_consensus?.bearish || 0) + (result.agent_consensus?.neutral || 0)} color="var(--red)" />
                  <ConsensusRow label="Neutral" count={result.agent_consensus?.neutral || 0} total={(result.agent_consensus?.bullish || 0) + (result.agent_consensus?.bearish || 0) + (result.agent_consensus?.neutral || 0)} color="var(--text-tertiary)" />
                </div>
              </div>

              {/* Evidence Cards */}
              <div className="mavyx-card">
                <div className="text-label" style={{ marginBottom: 8 }}>Evidence Cards</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {result.agent_breakdown?.map(agent => (
                    <div key={agent.agent_id}
                      className="mavyx-evidence-card"
                      onClick={() => setExpandedAgent(expandedAgent === agent.agent_id ? null : agent.agent_id)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="agent-name">{formatAgent(agent.agent_id)}</span>
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

              {/* Key Evidence */}
              {result.key_evidence?.length > 0 && (
                <div className="mavyx-card">
                  <div className="text-label" style={{ marginBottom: 8 }}>Key Evidence</div>
                  {result.key_evidence.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, padding: '4px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span className="text-gold">✓</span> {e}
                    </div>
                  ))}
                </div>
              )}

              {/* Risk Warnings */}
              {result.risk_warnings?.length > 0 && (
                <div className="mavyx-card" style={{ borderColor: 'rgba(255,149,0,0.2)' }}>
                  <div className="text-label text-orange" style={{ marginBottom: 8 }}>Risk Warnings</div>
                  {result.risk_warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--orange)', padding: '3px 0' }}>• {w}</div>
                  ))}
                </div>
              )}

              {/* Suggested Action */}
              {result.suggested_action?.direction && result.suggested_action.direction !== 'none' && (
                <div className="mavyx-card" style={{ borderColor: 'var(--gold-border)' }}>
                  <div className="text-label text-gold" style={{ marginBottom: 8 }}>Suggested Action</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { l: 'Entry', v: result.suggested_action.entry_zone },
                      { l: 'Stop Loss', v: result.suggested_action.stop_loss },
                      { l: 'TP1', v: result.suggested_action.take_profit_1 },
                      { l: 'TP2', v: result.suggested_action.take_profit_2 },
                    ].filter(i => i.v && i.v !== 'N/A').map(i => (
                      <div key={i.l} style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: 3, border: '1px solid var(--border)' }}>
                        <div className="text-label" style={{ fontSize: 9 }}>{i.l}</div>
                        <div className="text-number" style={{ fontSize: 13, fontWeight: 600 }}>{i.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Executive Summary Text */}
              <div className="mavyx-card">
                <div className="text-label" style={{ marginBottom: 8 }}>Executive Summary</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{result.executive_summary}</p>
              </div>

              {/* Metadata */}
              <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <span className="text-ghost" style={{ fontSize: 10 }}>
                  {result.successful_agents}/{result.total_agents} agents · {result.processing_time_ms}ms
                </span>
              </div>

              {/* Disclaimer */}
              <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: 10, color: 'var(--text-ghost)' }}>AI-generated analysis only · Not financial advice</span>
              </div>
            </>
          )}

          {!result && !isLoading && (
            <div className="mavyx-card" style={{ textAlign: 'center', padding: '40px 16px' }}>
              <div style={{ fontSize: 28, color: 'var(--text-ghost)', marginBottom: 12 }}>⬡</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No active analysis</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Click "Run Analysis" to deploy specialist agents</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function MiniCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="mavyx-card" style={{ flex: 1, padding: '6px 10px' }}>
      <div className="text-label" style={{ fontSize: 9, marginBottom: 1 }}>{label}</div>
      <div className="text-number" style={{ fontSize: 13, fontWeight: 600, color: valueColor || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 36, c = 2 * Math.PI * r, offset = c - (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: 88, height: 88 }}>
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--bg-primary)" strokeWidth="5" />
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--gold)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: 2 }}>Confidence</span>
      </div>
    </div>
  );
}

function ConsensusRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ width: 48, fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: 'var(--bg-primary)', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
      </div>
      <span className="text-number" style={{ width: 14, textAlign: 'right', fontSize: 11, fontWeight: 700, color }}>{count}</span>
    </div>
  );
}

function formatAgent(id: string): string {
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
