'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Intelligence Workspace — The primary working environment
 * Per MEIDS §5.8 §6.8: "The heart of the application"
 *
 * Contains: Trading Chart, Executive Brief, Evidence Cards,
 * Agent Panel, Trade Controls, Market Information
 */

export default function WorkspacePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  if (!isHydrated || !token) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="text-ghost">Loading...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
        {/* Market Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>EUR/USD</h1>
            <p className="text-caption">Euro vs US Dollar · 4H Timeframe</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mavyx-btn mavyx-btn-primary">Run Analysis</button>
            <button className="mavyx-btn mavyx-btn-secondary">Change Pair</button>
          </div>
        </div>

        {/* Chart Area (Placeholder) */}
        <div className="mavyx-card" style={{ flex: 1, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, color: 'var(--text-ghost)', marginBottom: 16 }}>◈</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Intelligence Chart</p>
            <p className="text-caption" style={{ marginTop: 4 }}>Professional candlestick chart will be rendered here</p>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div style={{ display: 'flex', gap: 12 }}>
          <InfoCard label="Current Price" value="1.08750" />
          <InfoCard label="Session" value="London" />
          <InfoCard label="Spread" value="1.2 pips" />
          <InfoCard label="ATR (14)" value="0.0085" />
          <InfoCard label="Last Analysis" value="None" />
        </div>
      </div>
    </AppLayout>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="mavyx-card" style={{ flex: 1, padding: '8px 12px' }}>
      <div className="text-label" style={{ fontSize: 9, marginBottom: 2 }}>{label}</div>
      <div className="text-number" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
