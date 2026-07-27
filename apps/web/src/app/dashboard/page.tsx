'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { getQuotes } from '@/features/market/api';
import type { Quote } from '@/features/market/types';
import AppLayout from '@/components/AppLayout';

const WATCHLIST_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'];

export default function DashboardPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();
  const [prices, setPrices] = useState<Record<string, Quote | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  useEffect(() => {
    if (!token) return;
    getQuotes(token, WATCHLIST_PAIRS).then(q => { setPrices(q); setLoading(false); }).catch(() => setLoading(false));
    const interval = setInterval(() => { getQuotes(token, WATCHLIST_PAIRS).then(setPrices).catch(() => {}); }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  if (!isHydrated || !token) return null;

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.01em' }}>Intelligence Dashboard</h1>

        {/* Live Market Prices */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {WATCHLIST_PAIRS.map(pair => {
            const q = prices[pair];
            return (
              <div key={pair} className="tc-card" style={{ cursor: 'pointer' }}
                onClick={() => { ai.setSymbol(pair); router.push('/workspace'); }}>
                <div className="tc-label">{pair}</div>
                <div className="tc-value entry" style={{ fontSize: 18 }}>
                  {loading ? '...' : q?.price?.toString() ?? '—'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="tc-card" style={{ marginBottom: 16, padding: 16 }}>
          <div className="tc-label" style={{ marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="analyze-btn" onClick={() => router.push('/workspace')}>Open Workspace</button>
            <button className="analyze-btn" onClick={() => router.push('/analysis')} style={{ background: 'var(--bg-panel)', color: 'var(--gold)', border: '1px solid var(--gold-line)', boxShadow: 'none' }}>Run Analysis</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Analyses', value: ai.totalAnalyses.toString() },
            { label: 'Buy Signals', value: (ai.recommendationCounts.buy || 0).toString() },
            { label: 'Sell Signals', value: (ai.recommendationCounts.sell || 0).toString() },
            { label: 'Wait/No Trade', value: ((ai.recommendationCounts.wait || 0) + (ai.recommendationCounts.no_trade || 0)).toString() },
          ].map(stat => (
            <div key={stat.label} className="tc-card">
              <div className="tc-label">{stat.label}</div>
              <div className="tc-value rr">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Recent Analyses */}
        <div className="tc-card">
          <div className="tc-label" style={{ marginBottom: 12 }}>Recent Analyses</div>
          {ai.journal.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-mute)', textAlign: 'center', padding: 16 }}>
              No analyses yet. Run one from the Workspace.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ai.journal.slice(0, 5).map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', background: 'var(--bg-panel)', borderRadius: 6,
                  cursor: 'pointer', border: '1px solid var(--border-soft)',
                }} onClick={() => { ai.setSymbol(entry.symbol); router.push('/workspace'); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{entry.symbol}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: entry.recommendation === 'buy' ? 'var(--green-dim)' : entry.recommendation === 'sell' ? 'var(--red-dim)' : 'var(--orange-dim)',
                      color: entry.recommendation === 'buy' ? 'var(--green)' : entry.recommendation === 'sell' ? 'var(--red)' : 'var(--orange)',
                    }}>
                      {entry.recommendation?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>{entry.confidence}%</span>
                    <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
