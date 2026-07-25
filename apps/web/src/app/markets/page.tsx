'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { getQuote } from '@/features/market/api';
import AppLayout from '@/components/layout/AppLayout';

const PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/AUD',
  'XAU/USD', 'XAG/USD',
];

export default function MarketsPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  useEffect(() => {
    if (!token) return;
    Promise.all(PAIRS.map(async p => {
      try {
        const q = await getQuote(token, p);
        return [p, q.price] as const;
      } catch { return [p, null] as const; }
    })).then(results => {
      const map: Record<string, number | null> = {};
      results.forEach(([p, v]) => map[p] = v);
      setPrices(map);
      setLoading(false);
    });
  }, [token]);

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 700 }}>
        <h1 style={{ marginBottom: 20 }}>Markets</h1>
        <div className="mavyx-card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pair</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.map(pair => (
                <tr key={pair} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => router.push(`/workspace?symbol=${encodeURIComponent(pair)}`)}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>{pair}</td>
                  <td className="text-number" style={{ textAlign: 'right', padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>
                    {loading ? <span className="mavyx-skeleton" style={{ display: 'inline-block', width: 60, height: 16 }} /> : prices[pair] ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px' }}>
                    <button className="mavyx-btn mavyx-btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>Analyze</button>
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
