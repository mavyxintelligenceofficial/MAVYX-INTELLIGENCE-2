'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/features/auth/store';

export default function WelcomePage() {
  const router = useRouter();
  const { user, token, isHydrated, hydrate } = useAuthStore();
  const [show, setShow] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && !token) router.replace('/login');
    if (isHydrated && token) setTimeout(() => setShow(true), 100);
  }, [isHydrated, token, router]);

  if (!isHydrated || !token) return null;

  const name = user?.fullName || user?.email?.split('@')[0] || 'Trader';

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#050508', fontFamily: 'Inter, sans-serif', padding: 24,
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 480,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={100} height={40} priority style={{ marginBottom: 24 }} />

        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E0E0E8', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Welcome back, {name}
        </h1>
        <p style={{ fontSize: 13, color: '#585868', marginBottom: 36 }}>
          Your intelligence workspace is ready.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <button onClick={() => router.push('/workspace')} style={{
            padding: '12px 24px', background: '#C9A84C', border: 'none', borderRadius: 8,
            color: '#050508', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
            cursor: 'pointer', width: '100%', letterSpacing: '0.03em',
          }}>
            ◈ Open Workspace
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { href: '/dashboard', icon: '▦', label: 'Dashboard' },
              { href: '/markets', icon: '◇', label: 'Markets' },
              { href: '/watchlist', icon: '◻', label: 'Watchlist' },
              { href: '/journal', icon: '◫', label: 'Journal' },
            ].map(item => (
              <button key={item.href} onClick={() => router.push(item.href)} style={{
                padding: '10px 16px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
                color: '#B0B0B8', fontSize: 12, fontWeight: 600,
                fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              }}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 10, color: '#383848' }}>
          <span>AI: <span style={{ color: '#34C759' }}>Ready</span></span>
          <span>14 Agents Online</span>
        </div>
      </div>
    </main>
  );
}
