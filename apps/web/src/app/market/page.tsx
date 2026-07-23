'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { getQuote } from '@/features/market/api';
import { Quote } from '@/features/market/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

export default function MarketPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  const [symbol, setSymbol] = useState('EUR/USD');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [isHydrated, token, router]);

  async function handleGetQuote(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getQuote(token, symbol);
      setQuote(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load that quote.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isHydrated || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Market quote</h1>
          <Link href="/profile" className="text-sm text-slate-500 underline">
            Back to profile
          </Link>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleGetQuote} className="space-y-4">
          <div>
            <label htmlFor="symbol" className="mb-1 block text-sm font-medium text-slate-700">
              Currency pair
            </label>
            <input
              id="symbol"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="EUR/USD"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">Format: BASE/QUOTE, e.g. GBP/USD.</p>
          </div>

          <Button type="submit" isLoading={isLoading}>
            Get quote
          </Button>
        </form>

        {quote && (
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{quote.symbol}</p>
            <p className="text-3xl font-semibold text-slate-900">{quote.price}</p>
            <p className="mt-1 text-xs text-slate-400">
              {new Date(quote.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        <Link href="/market/chart" className="block text-center text-sm text-slate-600 underline">
          View price chart
        </Link>
      </div>
    </main>
  );
}
