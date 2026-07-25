'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { getQuotes } from '@/features/market/api';
import type { Quote } from '@/features/market/types';
import AppLayout from '@/components/layout/AppLayout';

const WATCHLIST_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'];

export default function DashboardPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();
  const [prices, setPrices] = useState<Record<string, Quote | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  // Fetch real prices
  useEffect(() => {
    if (!token) return;
    getQuotes(token, WATCHLIST_PAIRS).then(q => {
      setPrices(q);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      getQuotes(token, WATCHLIST_PAIRS).then(setPrices).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  const recentAnalyses = ai.journal.slice(0, 5);

  return (
    <AppLayout>
      <div style={{ maxWidth: 900 }}>
        <h1 style={{ marginBottom: 16 }}>Intelligence Dashboard</h1>

        {/* Live Market Prices */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          {WATCHLIST_PAIRS.map(pair => {
            const q = prices[pair];
            return (
              <div key={pair} className="mavyx-card" style={{ cursor: 'pointer' }}
                onClick={() => { ai.setSymbol(pair); router.push('/workspace'); }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{pair}</div>
                <div className="text-number" style={{ fontSize: 16, fontWeight: 700 }}>
                  {loading ? '...' : q?.price?.toString() ?? '—'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mavyx-card" style={{ marginBottom: 12 }}>
          <div className="text-label" style={{ marginBottom: 8 }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mavyx-btn mavyx-btn-primary" onClick={() => router.push('/workspace')}>Open Workspace</button>
            <button className="mavyx-btn mavyx-btn-secondary" onClick={() => router.push('/markets')}>View Markets</button>
            <button className="mavyx-btn mavyx-btn-secondary" onClick={() => router.push('/watchlist')}>Watchlist</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          <div className="mavyx-card">
            <div className="text-label" style={{ marginBottom: 4 }}>Total Analyses</div>
            <div className="text-number" style={{ fontSize: 20, fontWeight: 700 }}>{ai.totalAnalyses}</div>
          </div>
          <div className="mavyx-card">
            <div className="text-label" style={{ marginBottom: 4 }}>Buy Signals</div>
            <div className="text-number" style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{ai.recommendationCounts.buy || 0}</div>
          </div>
          <div className="mavyx-card">
            <div className="text-label" style={{ marginBottom: 4 }}>Sell Signals</div>
            <div className="text-number" style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>{ai.recommendationCounts.sell || 0}</div>
          </div>
          <div className="mavyx-card">
            <div className="text-label" style={{ marginBottom: 4 }}>Wait/No Trade</div>
            <div className="text-number" style={{ fontSize: 20, fontWeight: 700, color: 'var(--orange)' }}>{(ai.recommendationCounts.wait || 0) + (ai.recommendationCounts.no_trade || 0)}</div>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="mavyx-card">
          <div className="text-label" style={{ marginBottom: 8 }}>Recent Analyses</div>
          {recentAnalyses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No analyses yet</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Run an analysis from the Workspace to see it here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentAnalyses.map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: 4, border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                  onClick={() => { ai.setSymbol(entry.symbol); router.push('/workspace'); }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{entry.symbol}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>{entry.timeframe}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`signal signal-${entry.recommendation === 'buy' ? 'bullish' : entry.recommendation === 'sell' ? 'bearish' : 'neutral'}`}>
                      {entry.recommendation?.toUpperCase()}
                    </span>
                    <span className="text-number" style={{ fontSize: 12, color: 'var(--gold)' }}>{entry.confidence}%</span>
                    <span style={{ fontSize: 10, color: 'var(--text-ghost)' }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
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
