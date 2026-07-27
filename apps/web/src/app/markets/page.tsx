'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { getQuotes } from '@/features/market/api';
import type { Quote } from '@/features/market/types';
import AppLayout from '@/components/AppLayout';

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

  useEffect(() => {
    if (!token) return;
    getQuotes(token, PAIRS).then(q => { setPrices(q); setLoading(false); }).catch(() => setLoading(false));
    const interval = setInterval(() => { getQuotes(token, PAIRS).then(setPrices).catch(() => {}); }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  function handleAnalyze(pair: string) {
    ai.setSymbol(pair);
    router.push('/workspace');
  }

  if (!isHydrated || !token) return null;

  return (
    <AppLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Markets</h1>
        <div className="tc-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Pair</th>
                <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.map(pair => (
                <tr key={pair} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => handleAnalyze(pair)}>{pair}</td>
                  <td className="text-number" style={{ textAlign: 'right', padding: '12px 14px', fontSize: 14, fontWeight: 700 }}>
                    {loading ? '...' : prices[pair]?.price?.toString() ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 14px' }}>
                    <button onClick={() => handleAnalyze(pair)} className="analyze-btn" style={{ padding: '6px 14px', fontSize: 11 }}>
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
