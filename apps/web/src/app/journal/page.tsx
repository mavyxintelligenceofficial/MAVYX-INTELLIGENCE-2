'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Trade Journal — Per MEIDS Chapter 13
 * "The journal is not a diary. It is an AI research database."
 */

export default function JournalPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 800 }}>
        <h1 style={{ marginBottom: 20 }}>Trade Journal</h1>

        <div className="mavyx-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 32, color: 'var(--text-ghost)', marginBottom: 16 }}>◫</div>
          <h2 style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>No journal entries yet</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Complete your first reviewed trade to begin building your institutional trading history.
            Every trade becomes a research case with AI review, lessons learned, and improvement suggestions.
          </p>
          <button className="mavyx-btn mavyx-btn-primary" style={{ marginTop: 20 }} onClick={() => router.push('/workspace')}>
            Open Workspace
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
