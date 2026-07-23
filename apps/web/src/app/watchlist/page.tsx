'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { getQuotes } from '@/features/market/api';
import { Quote } from '@/features/market/types';
import { getProfile, updateProfile } from '@/features/profile/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

export default function WatchlistPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  const [symbols, setSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      router.replace('/login');
      return;
    }

    loadWatchlist(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, token, router]);

  async function loadWatchlist(currentToken: string) {
    setIsLoading(true);
    setError(null);

    try {
      const profile = await getProfile(currentToken);
      setSymbols(profile.watchlistSymbols);

      if (profile.watchlistSymbols.length > 0) {
        const results = await getQuotes(currentToken, profile.watchlistSymbols);
        setQuotes(results);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your watchlist.');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSymbols(updated: string[]) {
    if (!token) return;

    setSymbols(updated);
    try {
      await updateProfile(token, { watchlistSymbols: updated });
      if (updated.length > 0) {
        const results = await getQuotes(token, updated);
        setQuotes(results);
      } else {
        setQuotes({});
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your watchlist.');
    }
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol || symbols.includes(symbol)) {
      setNewSymbol('');
      return;
    }
    setNewSymbol('');
    saveSymbols([...symbols, symbol]);
  }

  function handleRemove(symbol: string) {
    saveSymbols(symbols.filter((s) => s !== symbol));
  }

  if (!isHydrated || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-slate-600">Loading your watchlist...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Watchlist</h1>
          <Link href="/profile" className="text-sm text-slate-500 underline">
            Back to profile
          </Link>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. GBP/USD"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <Button type="submit" className="w-auto px-4">
            Add
          </Button>
        </form>

        {symbols.length === 0 && (
          <p className="text-sm text-slate-500">
            No symbols yet - add one above (format: BASE/QUOTE, e.g. EUR/USD).
          </p>
        )}

        <div className="space-y-3">
          {symbols.map((symbol) => {
            const quote = quotes[symbol];
            return (
              <div
                key={symbol}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{symbol}</p>
                  {quote ? (
                    <p className="text-lg font-semibold text-slate-900">{quote.price}</p>
                  ) : (
                    <p className="text-sm text-slate-400">Unavailable</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(symbol)}
                  className="text-sm text-red-600 underline"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
