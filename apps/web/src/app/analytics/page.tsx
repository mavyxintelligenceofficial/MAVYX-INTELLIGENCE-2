'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import AppLayout from '@/components/layout/AppLayout';

export default function AnalyticsPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  const { totalAnalyses, recommendationCounts, journal } = ai;
  const avgConfidence = journal.length > 0
    ? Math.round(journal.reduce((sum, e) => sum + e.confidence, 0) / journal.length)
    : 0;

  // Most analyzed symbol
  const symbolCounts: Record<string, number> = {};
  journal.forEach(e => { symbolCounts[e.symbol] = (symbolCounts[e.symbol] || 0) + 1; });
  const topSymbol = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  // Agent average confidence
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
      <div style={{ maxWidth: 800 }}>
        <h1 style={{ marginBottom: 16 }}>Analytics</h1>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          <div className="mavyx-card">
            <div className="text-label" style={{ marginBottom: 4 }}>Total Analyses</div>
            <div className="text-number" style={{ fontSize: 22, fontWeight: 700 }}>{totalAnalyses}</div>
          </div>
          <div className="mavyx-card">
            <div className="text-label" style={{ marginBottom: 4 }}>Avg Confidence</div>
            <div className="text-number" style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{avgConfidence}%</div>
          </div>
          <div className="mavyx-card">
            <div className="text-label" style={{ marginBottom: 4 }}>Most Analyzed</div>
            <div className="text-number" style={{ fontSize: 22, fontWeight: 700 }}>{topSymbol}</div>
          </div>
          <div className="mavyx-card">
            <div className="text-label" style={{ marginBottom: 4 }}>Journal Entries</div>
            <div className="text-number" style={{ fontSize: 22, fontWeight: 700 }}>{journal.length}</div>
          </div>
        </div>

        {/* Recommendation Distribution */}
        <div className="mavyx-card" style={{ marginBottom: 12 }}>
          <div className="text-label" style={{ marginBottom: 10 }}>Recommendation Distribution</div>
          <div style={{ display: 'flex', gap: 12 }}>
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

        {/* Agent Performance */}
        {Object.keys(agentAvg).length > 0 && (
          <div className="mavyx-card" style={{ marginBottom: 12 }}>
            <div className="text-label" style={{ marginBottom: 10 }}>Agent Performance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(agentAvg)
                .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
                .map(([id, data]) => {
                  const avg = Math.round(data.total / data.count);
                  const name = id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 140, fontSize: 12, fontWeight: 500 }}>{name}</span>
                      <div style={{ flex: 1, height: 3, background: 'var(--bg-primary)', borderRadius: 2 }}>
                        <div style={{ width: `${avg}%`, height: '100%', background: 'var(--gold)', borderRadius: 2 }} />
                      </div>
                      <span className="text-number" style={{ width: 30, textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>{avg}%</span>
                      <span style={{ fontSize: 10, color: 'var(--text-ghost)' }}>({data.count}x)</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalAnalyses === 0 && (
          <div className="mavyx-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Analytics populate as you run analyses</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Go to the Workspace and run your first analysis.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
