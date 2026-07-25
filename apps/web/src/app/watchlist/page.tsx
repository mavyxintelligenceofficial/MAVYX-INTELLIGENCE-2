'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { getProfile, updateProfile } from '@/features/profile/api';
import { getQuotes } from '@/features/market/api';
import type { Quote } from '@/features/market/types';
import AppLayout from '@/components/layout/AppLayout';

export default function WatchlistPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  useEffect(() => {
    if (!token) return;
    getProfile(token).then(p => {
      const syms = p.watchlistSymbols || [];
      setSymbols(syms);
      if (syms.length > 0) {
        getQuotes(token, syms).then(setQuotes);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [token]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!token || !newSymbol.trim()) return;
    const sym = newSymbol.trim().toUpperCase();
    if (symbols.includes(sym)) return;
    const updated = [...symbols, sym];
    setSymbols(updated);
    setNewSymbol('');
    try {
      await updateProfile(token, { watchlistSymbols: updated });
      const q = await getQuotes(token, [sym]);
      setQuotes(prev => ({ ...prev, ...q }));
    } catch {}
  }

  async function handleRemove(sym: string) {
    if (!token) return;
    const updated = symbols.filter(s => s !== sym);
    setSymbols(updated);
    setQuotes(prev => { const n = { ...prev }; delete n[sym]; return n; });
    try { await updateProfile(token, { watchlistSymbols: updated }); } catch {}
  }

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ marginBottom: 20 }}>Watchlist</h1>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="EUR/USD" className="mavyx-input" style={{ flex: 1 }} />
          <button type="submit" className="mavyx-btn mavyx-btn-primary">Add</button>
        </form>

        <div className="mavyx-card" style={{ padding: 0 }}>
          {symbols.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No symbols in watchlist</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Add a currency pair above to start tracking.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pair</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {symbols.map(sym => (
                  <tr key={sym} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={() => router.push(`/workspace?symbol=${encodeURIComponent(sym)}`)}>{sym}</td>
                    <td className="text-number" style={{ textAlign: 'right', padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>{quotes[sym]?.price ?? '—'}</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px' }}>
                      <button onClick={() => handleRemove(sym)} className="mavyx-btn mavyx-btn-ghost" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--red)' }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
