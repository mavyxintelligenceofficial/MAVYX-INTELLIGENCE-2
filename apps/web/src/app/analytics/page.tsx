'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import AppLayout from '@/components/AppLayout';

export default function AnalyticsPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  if (!isHydrated || !token) return null;

  const { totalAnalyses, recommendationCounts, journal } = ai;
  const avgConfidence = journal.length > 0 ? Math.round(journal.reduce((s, e) => s + e.confidence, 0) / journal.length) : 0;
  const symbolCounts: Record<string, number> = {};
  journal.forEach(e => { symbolCounts[e.symbol] = (symbolCounts[e.symbol] || 0) + 1; });
  const topSymbols = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const agentAvg: Record<string, { total: number; count: number }> = {};
  journal.forEach(e => {
    e.agentBreakdown?.forEach((a: any) => {
      if (!agentAvg[a.agent_id]) agentAvg[a.agent_id] = { total: 0, count: 0 };
      agentAvg[a.agent_id].total += a.confidence;
      agentAvg[a.agent_id].count += 1;
    });
  });

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Analytics</h1>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Analyses', value: totalAnalyses.toString() },
            { label: 'Avg Confidence', value: `${avgConfidence}%` },
            { label: 'Most Analyzed', value: topSymbols[0]?.[0] || '—' },
            { label: 'Journal Entries', value: journal.length.toString() },
          ].map(kpi => (
            <div key={kpi.label} className="tc-card">
              <div className="tc-label">{kpi.label}</div>
              <div className="tc-value rr">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Recommendation Distribution */}
        <div className="tc-card" style={{ marginBottom: 16, padding: 16 }}>
          <div className="tc-label" style={{ marginBottom: 12 }}>Recommendation Distribution</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Buy', count: recommendationCounts.buy || 0, color: 'var(--green)' },
              { label: 'Sell', count: recommendationCounts.sell || 0, color: 'var(--red)' },
              { label: 'Wait', count: recommendationCounts.wait || 0, color: 'var(--orange)' },
              { label: 'No Trade', count: recommendationCounts.no_trade || 0, color: 'var(--gray)' },
            ].map(item => {
              const pct = totalAnalyses > 0 ? Math.round((item.count / totalAnalyses) * 100) : 0;
              return (
                <div key={item.label} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Performance */}
        {Object.keys(agentAvg).length > 0 && (
          <div className="tc-card" style={{ marginBottom: 16, padding: 16 }}>
            <div className="tc-label" style={{ marginBottom: 12 }}>Agent Performance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(agentAvg)
                .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
                .map(([id, data]) => {
                  const avg = Math.round(data.total / data.count);
                  const name = id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 130, fontSize: 12, fontWeight: 600 }}>{name}</span>
                      <div style={{ flex: 1, height: 3, background: 'var(--bg)', borderRadius: 2 }}>
                        <div style={{ width: `${avg}%`, height: '100%', background: 'var(--gold)', borderRadius: 2 }} />
                      </div>
                      <span style={{ width: 30, textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>{avg}%</span>
                      <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>({data.count}x)</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Top Symbols */}
        {topSymbols.length > 0 && (
          <div className="tc-card" style={{ marginBottom: 16, padding: 16 }}>
            <div className="tc-label" style={{ marginBottom: 12 }}>Most Analyzed Pairs</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {topSymbols.map(([sym, count]) => (
                <div key={sym} style={{ flex: 1, textAlign: 'center', padding: 10, background: 'var(--bg)', borderRadius: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{sym}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalAnalyses === 0 && (
          <div className="tc-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <p style={{ fontSize: 12, color: 'var(--text-mute)' }}>Analytics populate as you run analyses</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
