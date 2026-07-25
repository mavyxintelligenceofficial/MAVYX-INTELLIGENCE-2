'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Dashboard — Per MEIDS §6.6
 * "This is NOT a trading dashboard. This is an Intelligence Dashboard."
 *
 * Layout: Market Overview → Executive Summary → Watchlist →
 * Economic Calendar → Performance Snapshot → Recent Analyses
 */

export default function DashboardPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 900 }}>
        <h1 style={{ marginBottom: 20 }}>Intelligence Dashboard</h1>

        {/* Market Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { pair: 'EUR/USD', price: '1.0875', change: '+0.12%' },
            { pair: 'GBP/USD', price: '1.2945', change: '-0.08%' },
            { pair: 'USD/JPY', price: '163.21', change: '+0.25%' },
            { pair: 'XAU/USD', price: '2,385.40', change: '+0.45%' },
          ].map(m => (
            <div key={m.pair} className="mavyx-card" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{m.pair}</div>
              <div className="text-number" style={{ fontSize: 16, fontWeight: 700 }}>{m.price}</div>
              <div style={{ fontSize: 11, color: m.change.startsWith('+') ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>{m.change}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mavyx-card" style={{ marginBottom: 16 }}>
          <div className="text-label" style={{ marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mavyx-btn mavyx-btn-primary" onClick={() => router.push('/workspace')}>Open Workspace</button>
            <button className="mavyx-btn mavyx-btn-secondary" onClick={() => router.push('/analysis')}>Run Analysis</button>
            <button className="mavyx-btn mavyx-btn-secondary" onClick={() => router.push('/watchlist')}>View Watchlist</button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mavyx-card">
          <div className="text-label" style={{ marginBottom: 12 }}>Recent Activity</div>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No recent analyses</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Run your first analysis from the Workspace to see activity here.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
