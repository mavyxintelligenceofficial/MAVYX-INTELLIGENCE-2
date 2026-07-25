'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Analytics Dashboard — Per MEIDS Chapter 14
 * "Every number shown inside Mavyx must answer:
 *  How does this help the trader make better decisions?"
 *
 * Sections: Performance, Decision Quality, AI Performance,
 * Market Analytics, Learning Progress
 */

export default function AnalyticsPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  const { totalAnalyses, recommendationCounts, journal } = ai;

  // Calculate real metrics from journal data
  const avgConfidence = journal.length > 0
    ? Math.round(journal.reduce((sum, e) => sum + e.confidence, 0) / journal.length)
    : 0;

  // Symbol analysis counts
  const symbolCounts: Record<string, number> = {};
  journal.forEach(e => { symbolCounts[e.symbol] = (symbolCounts[e.symbol] || 0) + 1; });
  const topSymbols = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Agent average confidence
  const agentAvg: Record<string, { total: number; count: number; signals: Record<string, number> }> = {};
  journal.forEach(e => {
    e.agentBreakdown?.forEach((a: any) => {
      if (!agentAvg[a.agent_id]) agentAvg[a.agent_id] = { total: 0, count: 0, signals: {} };
      agentAvg[a.agent_id].total += a.confidence;
      agentAvg[a.agent_id].count += 1;
      agentAvg[a.agent_id].signals[a.signal] = (agentAvg[a.agent_id].signals[a.signal] || 0) + 1;
    });
  });

  // Confidence distribution
  const confidenceBuckets = { 'high (70+)': 0, 'medium (50-69)': 0, 'low (<50)': 0 };
  journal.forEach(e => {
    if (e.confidence >= 70) confidenceBuckets['high (70+)']++;
    else if (e.confidence >= 50) confidenceBuckets['medium (50-69)']++;
    else confidenceBuckets['low (<50)']++;
  });

  // Recent trend (last 5 vs previous 5)
  const recent5 = journal.slice(0, 5);
  const prev5 = journal.slice(5, 10);
  const recentAvgConf = recent5.length > 0 ? Math.round(recent5.reduce((s, e) => s + e.confidence, 0) / recent5.length) : 0;
  const prevAvgConf = prev5.length > 0 ? Math.round(prev5.reduce((s, e) => s + e.confidence, 0) / prev5.length) : 0;
  const confidenceTrend = recentAvgConf - prevAvgConf;

  return (
    <AppLayout>
      <div style={{ maxWidth: 900 }}>
        <h1 style={{ marginBottom: 16 }}>Analytics</h1>

        {/* ─── KPI Cards ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          <KPICard label="Total Analyses" value={totalAnalyses.toString()} />
          <KPICard label="Avg Confidence" value={`${avgConfidence}%`} color="var(--gold)" />
          <KPICard label="Confidence Trend"
            value={confidenceTrend > 0 ? `+${confidenceTrend}%` : confidenceTrend === 0 ? '—' : `${confidenceTrend}%`}
            color={confidenceTrend > 0 ? 'var(--green)' : confidenceTrend < 0 ? 'var(--red)' : undefined} />
          <KPICard label="Journal Entries" value={journal.length.toString()} />
        </div>

        {/* ─── Recommendation Distribution ──────────────────────── */}
        <div className="mavyx-card" style={{ marginBottom: 12 }}>
          <div className="text-label" style={{ marginBottom: 10 }}>Recommendation Distribution</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Buy', count: recommendationCounts.buy || 0, color: 'var(--green)' },
              { label: 'Sell', count: recommendationCounts.sell || 0, color: 'var(--red)' },
              { label: 'Wait', count: recommendationCounts.wait || 0, color: 'var(--orange)' },
              { label: 'No Trade', count: recommendationCounts.no_trade || 0, color: 'var(--text-tertiary)' },
            ].map(item => {
              const total = totalAnalyses || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.label} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.label}</span>
                    <span className="text-number" style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-primary)', borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Confidence Distribution ──────────────────────────── */}
        <div className="mavyx-card" style={{ marginBottom: 12 }}>
          <div className="text-label" style={{ marginBottom: 10 }}>Confidence Distribution</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'High (70+)', count: confidenceBuckets['high (70+)'], color: 'var(--green)' },
              { label: 'Medium (50-69)', count: confidenceBuckets['medium (50-69)'], color: 'var(--gold)' },
              { label: 'Low (<50)', count: confidenceBuckets['low (<50)'], color: 'var(--red)' },
            ].map(item => {
              const total = totalAnalyses || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.label} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.label}</span>
                    <span className="text-number" style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.count}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-primary)', borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Agent Performance ────────────────────────────────── */}
        {Object.keys(agentAvg).length > 0 && (
          <div className="mavyx-card" style={{ marginBottom: 12 }}>
            <div className="text-label" style={{ marginBottom: 10 }}>Agent Performance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(agentAvg)
                .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
                .map(([id, data]) => {
                  const avg = Math.round(data.total / data.count);
                  const name = id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
                  const dominant = Object.entries(data.signals).sort((a, b) => b[1] - a[1])[0];
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 130, fontSize: 11, fontWeight: 500 }}>{name}</span>
                      <div style={{ flex: 1, height: 3, background: 'var(--bg-primary)', borderRadius: 2 }}>
                        <div style={{ width: `${avg}%`, height: '100%', background: 'var(--gold)', borderRadius: 2 }} />
                      </div>
                      <span className="text-number" style={{ width: 28, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--gold)' }}>{avg}%</span>
                      <span style={{ fontSize: 9, color: 'var(--text-ghost)', width: 50 }}>
                        {dominant ? `${dominant[0]} ${dominant[1]}x` : ''}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ─── Top Analyzed Symbols ─────────────────────────────── */}
        {topSymbols.length > 0 && (
          <div className="mavyx-card" style={{ marginBottom: 12 }}>
            <div className="text-label" style={{ marginBottom: 10 }}>Most Analyzed Pairs</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {topSymbols.map(([sym, count]) => (
                <div key={sym} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg-primary)', borderRadius: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{sym}</div>
                  <div className="text-number" style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Recent Activity Timeline ─────────────────────────── */}
        {journal.length > 0 && (
          <div className="mavyx-card">
            <div className="text-label" style={{ marginBottom: 10 }}>Recent Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {journal.slice(0, 8).map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: 4,
                  cursor: 'pointer',
                }} onClick={() => { ai.setSymbol(entry.symbol); router.push('/workspace'); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{entry.symbol}</span>
                    <span className={`signal signal-${entry.recommendation === 'buy' ? 'bullish' : entry.recommendation === 'sell' ? 'bearish' : 'neutral'}`} style={{ fontSize: 9 }}>
                      {entry.recommendation?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="text-number" style={{ fontSize: 11, color: 'var(--gold)' }}>{entry.confidence}%</span>
                    <span style={{ fontSize: 9, color: 'var(--text-ghost)' }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Empty State ──────────────────────────────────────── */}
        {totalAnalyses === 0 && (
          <div className="mavyx-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: 28, color: 'var(--text-ghost)', marginBottom: 12 }}>◬</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Analytics populate as you use the platform</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Run analyses from the Workspace to see your performance intelligence here.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function KPICard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="mavyx-card">
      <div className="text-label" style={{ marginBottom: 4, fontSize: 9 }}>{label}</div>
      <div className="text-number" style={{ fontSize: 20, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
