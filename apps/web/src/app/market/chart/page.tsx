'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Button } from '@/components/Button';
import { getCandles } from '@/features/market/api';
import { CandlesResult } from '@/features/market/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const INTERVALS = ['1h', '4h', '1day'];

export default function ChartPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  const [symbol, setSymbol] = useState('EUR/USD');
  const [interval, setInterval] = useState('1h');
  const [result, setResult] = useState<CandlesResult | null>(null);
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

  async function handleLoad(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getCandles(token, symbol, interval);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load chart data.');
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

  // Twelve Data returns most-recent-first - reverse so the chart reads
  // left (oldest) to right (most recent), the way a price chart normally does.
  const chronological = result ? [...result.candles].reverse() : [];

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Price chart</h1>
          <Link href="/market" className="text-sm text-slate-500 underline">
            Back
          </Link>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleLoad} className="flex gap-3">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="EUR/USD"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {INTERVALS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <Button type="submit" isLoading={isLoading} className="w-auto px-4">
            Load
          </Button>
        </form>

        {result && chronological.length > 0 && (
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm text-slate-500">
              {result.symbol} - {result.interval}
            </p>
            <Line
              data={{
                labels: chronological.map((c) =>
                  new Date(c.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }),
                ),
                datasets: [
                  {
                    label: 'Close price',
                    data: chronological.map((c) => c.close),
                    borderColor: '#0f172a',
                    backgroundColor: '#0f172a',
                    pointRadius: 0,
                    borderWidth: 2,
                    tension: 0.1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { maxTicksLimit: 6 } },
                },
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
