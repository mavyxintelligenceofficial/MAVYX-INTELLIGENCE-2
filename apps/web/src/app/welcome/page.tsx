'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/features/auth/store';

/**
 * Welcome Page — Shows after login/signup
 * Per MEIDS §6.5: "Loading Intelligence" experience
 *
 * Shows: Welcome back [name], then navigation options
 */

export default function WelcomePage() {
  const router = useRouter();
  const { user, token, isHydrated, hydrate } = useAuthStore();
  const [show, setShow] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && !token) router.replace('/login');
    if (isHydrated && token) {
      // Animate in
      setTimeout(() => setShow(true), 100);
    }
  }, [isHydrated, token, router]);

  if (!isHydrated || !token) return null;

  const name = user?.fullName || user?.email?.split('@')[0] || 'Trader';

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 24,
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 500,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Logo */}
        <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={120} height={48} priority
          style={{ marginBottom: 32, opacity: 0.9 }} />

        {/* Welcome Message */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.02em',
        }}>
          Welcome back, {name}
        </h1>

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginBottom: 40,
          lineHeight: 1.6,
        }}>
          Your intelligence workspace is ready.
        </p>

        {/* Navigation Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          <button
            onClick={() => router.push('/workspace')}
            className="mavyx-btn mavyx-btn-primary"
            style={{ padding: '14px 24px', fontSize: 14, width: '100%' }}
          >
            ◈ Open Workspace
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => router.push('/dashboard')} className="mavyx-btn mavyx-btn-secondary" style={{ padding: '12px 16px' }}>
              ▦ Dashboard
            </button>
            <button onClick={() => router.push('/markets')} className="mavyx-btn mavyx-btn-secondary" style={{ padding: '12px 16px' }}>
              ◇ Markets
            </button>
            <button onClick={() => router.push('/watchlist')} className="mavyx-btn mavyx-btn-secondary" style={{ padding: '12px 16px' }}>
              ◻ Watchlist
            </button>
            <button onClick={() => router.push('/journal')} className="mavyx-btn mavyx-btn-secondary" style={{ padding: '12px 16px' }}>
              ◫ Journal
            </button>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: 'var(--text-tertiary)' }}>
          <span>AI: <span style={{ color: 'var(--green)' }}>Ready</span></span>
          <span>Market: <span style={{ color: 'var(--green)' }}>Open</span></span>
          <span>11 Agents Online</span>
        </div>
      </div>
    </main>
  );
}
