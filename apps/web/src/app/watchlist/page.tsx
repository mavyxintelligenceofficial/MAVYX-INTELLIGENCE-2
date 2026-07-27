'use client';

import { useEffect, useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { getProfile, updateProfile } from '@/features/profile/api';
import { getQuotes } from '@/features/market/api';
import type { Quote } from '@/features/market/types';
import AppLayout from '@/components/AppLayout';

export default function WatchlistPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  useEffect(() => {
    if (!token) return;
    getProfile(token).then(p => { setSymbols(p.watchlistSymbols || []); setIsLoading(false); }).catch(() => setIsLoading(false));
  }, [token]);

  const fetchPrices = useCallback(() => {
    if (!token || symbols.length === 0) return;
    getQuotes(token, symbols).then(setQuotes).catch(() => {});
  }, [token, symbols]);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);
  useEffect(() => { const i = setInterval(fetchPrices, 10000); return () => clearInterval(i); }, [fetchPrices]);

  function handleAnalyze(sym: string) { ai.setSymbol(sym); router.push('/workspace'); }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!token || !newSymbol.trim()) return;
    const sym = newSymbol.trim().toUpperCase();
    if (symbols.includes(sym)) return;
    const updated = [...symbols, sym];
    setSymbols(updated); setNewSymbol('');
    try {
      await updateProfile(token, { watchlistSymbols: updated });
      const q = await getQuotes(token, [sym]);
      setQuotes(prev => ({ ...prev, ...q }));
    } catch { setSymbols(symbols); }
  }

  async function handleRemove(sym: string) {
    if (!token) return;
    const updated = symbols.filter(s => s !== sym);
    setSymbols(updated);
    try { await updateProfile(token, { watchlistSymbols: updated }); } catch { setSymbols([...symbols]); }
  }

  if (!isHydrated || !token) return null;

  return (
    <AppLayout>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Watchlist</h1>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="EUR/USD" className="chat-input" style={{ flex: 1 }} />
          <button type="submit" className="analyze-btn" style={{ flexShrink: 0 }}>Add</button>
        </form>

        <div className="tc-card" style={{ padding: 0, overflow: 'hidden' }}>
          {symbols.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>No symbols in watchlist</p>
              <p style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>Add a currency pair above to start tracking.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Pair</th>
                  <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {symbols.map(sym => (
                  <tr key={sym} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => handleAnalyze(sym)}>{sym}</td>
                    <td className="text-number" style={{ textAlign: 'right', padding: '12px 14px', fontSize: 14, fontWeight: 700 }}>
                      {quotes[sym]?.price?.toString() ?? '...'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 14px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => handleAnalyze(sym)} className="analyze-btn" style={{ padding: '5px 12px', fontSize: 10 }}>Analyze</button>
                      <button onClick={() => handleRemove(sym)} style={{ padding: '5px 12px', fontSize: 10, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
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
