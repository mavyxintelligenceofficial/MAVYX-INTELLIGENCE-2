'use client';

import { useEffect, useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { getProfile, updateProfile } from '@/features/profile/api';
import { getQuotes } from '@/features/market/api';
import type { Quote } from '@/features/market/types';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Watchlist Page — Per MEIDS §6.6
 * Real-time prices, add/remove, click to analyze
 */

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

  // Fetch watchlist from profile
  useEffect(() => {
    if (!token) return;
    getProfile(token).then(p => {
      const syms = p.watchlistSymbols || [];
      setSymbols(syms);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [token]);

  // Fetch live prices — refresh every 10 seconds
  const fetchPrices = useCallback(() => {
    if (!token || symbols.length === 0) return;
    getQuotes(token, symbols).then(setQuotes).catch(() => {});
  }, [token, symbols]);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);
  useEffect(() => {
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Navigate to workspace with symbol set
  function handleAnalyze(sym: string) {
    ai.setSymbol(sym);
    router.push('/workspace');
  }

  // Add symbol to watchlist
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
      // Fetch price for the new symbol
      const q = await getQuotes(token, [sym]);
      setQuotes(prev => ({ ...prev, ...q }));
    } catch (err) {
      // Revert on error
      setSymbols(symbols);
    }
  }

  // Remove symbol from watchlist
  async function handleRemove(sym: string) {
    if (!token) return;
    const updated = symbols.filter(s => s !== sym);
    setSymbols(updated);
    setQuotes(prev => { const n = { ...prev }; delete n[sym]; return n; });
    try {
      await updateProfile(token, { watchlistSymbols: updated });
    } catch {
      // Revert on error
      setSymbols([...symbols]);
    }
  }

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ marginBottom: 16 }}>Watchlist</h1>

        {/* Add Symbol Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text" value={newSymbol}
            onChange={e => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="EUR/USD" className="mavyx-input" style={{ flex: 1 }}
          />
          <button type="submit" className="mavyx-btn mavyx-btn-primary">Add</button>
        </form>

        {/* Watchlist Table */}
        <div className="mavyx-card" style={{ padding: 0 }}>
          {symbols.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 24, color: 'var(--text-ghost)', marginBottom: 8 }}>◻</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No symbols in watchlist</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Add a currency pair above to start tracking.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pair</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {symbols.map(sym => {
                  const q = quotes[sym];
                  return (
                    <tr key={sym} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td
                        style={{ padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => handleAnalyze(sym)}
                      >
                        {sym}
                      </td>
                      <td className="text-number" style={{ textAlign: 'right', padding: '12px', fontSize: 15, fontWeight: 700 }}>
                        {q?.price?.toString() ?? '...'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleAnalyze(sym)}
                            className="mavyx-btn mavyx-btn-primary"
                            style={{ fontSize: 10, padding: '5px 10px' }}
                          >
                            Analyze
                          </button>
                          <button
                            onClick={() => handleRemove(sym)}
                            className="mavyx-btn mavyx-btn-ghost"
                            style={{ fontSize: 10, padding: '5px 10px', color: 'var(--red)' }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Info */}
        {symbols.length > 0 && (
          <p style={{ fontSize: 10, color: 'var(--text-ghost)', textAlign: 'center', marginTop: 8 }}>
            Prices update every 10 seconds • Click a pair to analyze it
          </p>
        )}
      </div>
    </AppLayout>
  );
}
