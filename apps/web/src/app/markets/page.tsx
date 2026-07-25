'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { getQuotes } from '@/features/market/api';
import type { Quote } from '@/features/market/types';
import AppLayout from '@/components/layout/AppLayout';

const PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/AUD',
  'XAU/USD', 'XAG/USD',
];

export default function MarketsPage() {
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
    getQuotes(token, PAIRS).then(q => {
      setPrices(q);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      getQuotes(token, PAIRS).then(setPrices).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  function handleAnalyze(pair: string) {
    ai.setSymbol(pair);
    router.push('/workspace');
  }

  function handleRowClick(pair: string) {
    ai.setSymbol(pair);
    router.push('/workspace');
  }

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 700 }}>
        <h1 style={{ marginBottom: 16 }}>Markets</h1>
        <div className="mavyx-card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pair</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.map(pair => (
                <tr key={pair} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => handleAnalyze(pair)}>{pair}</td>
                  <td className="text-number" style={{ textAlign: 'right', padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>
                    {loading ? '...' : prices[pair]?.price?.toString() ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px' }}>
                    <button onClick={() => handleAnalyze(pair)} className="mavyx-btn mavyx-btn-primary" style={{ fontSize: 11, padding: '5px 12px' }}>
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
