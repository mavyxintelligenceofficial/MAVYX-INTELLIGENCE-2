'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Analytics — Per MEIDS Chapter 14
 * "Every number shown inside Mavyx must answer: How does this help the trader make better decisions?"
 */

export default function AnalyticsPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  const metrics = [
    { label: 'Win Rate', value: '—', desc: 'Requires trade journal data' },
    { label: 'Decision Quality', value: '—', desc: 'Requires completed analyses' },
    { label: 'Risk Discipline', value: '—', desc: 'Requires trade history' },
    { label: 'AI Accuracy', value: '—', desc: 'Requires outcome tracking' },
    { label: 'Confidence Calibration', value: '—', desc: 'Requires historical validation' },
    { label: 'Journal Completion', value: '—', desc: 'Requires journal entries' },
  ];

  return (
    <AppLayout>
      <div style={{ maxWidth: 800 }}>
        <h1 style={{ marginBottom: 20 }}>Analytics</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {metrics.map(m => (
            <div key={m.label} className="mavyx-card">
              <div className="text-label" style={{ marginBottom: 8 }}>{m.label}</div>
              <div className="text-number" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-ghost)' }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-ghost)', marginTop: 4 }}>{m.desc}</div>
            </div>
          ))}
        </div>

        <div className="mavyx-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 28, color: 'var(--text-ghost)', marginBottom: 12 }}>◬</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Analytics populate as you use the platform</p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, maxWidth: 400, margin: '4px auto 0', lineHeight: 1.6 }}>
            Run analyses, complete journal entries, and track trade outcomes to see your performance intelligence here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
