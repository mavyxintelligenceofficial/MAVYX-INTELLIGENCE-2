'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';

/**
 * Mavyx Intelligence — Landing Page
 * Per MEIDS §6.2: "Introduce Mavyx. Not sell Mavyx."
 * Professional. Calm. Institutional.
 */

const FEATURES = [
  { icon: '⬡', title: 'Multi-Agent Intelligence', desc: 'Independent specialist agents analyze markets from multiple perspectives' },
  { icon: '◈', title: 'Executive Decision Engine', desc: 'Synthesizes evidence into transparent, explainable recommendations' },
  { icon: '◇', title: 'Evidence-Based Analysis', desc: 'Every conclusion backed by measurable evidence and documented reasoning' },
  { icon: '◻', title: 'Institutional Research', desc: 'Professional-grade market intelligence, not retail signals' },
  { icon: '◫', title: 'Continuous Learning', desc: 'Trade journal, performance analytics, and behavioral coaching' },
  { icon: '◬', title: 'Transparent Reasoning', desc: 'See exactly why every recommendation was made and what evidence supports it' },
];

export default function HomePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && token) router.replace('/welcome'); }, [isHydrated, token, router]);

  return (
    <main style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflow: 'auto' }}>
      {/* Hero */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center' }}>
        <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx Intelligence" width={160} height={64} priority
          style={{ marginBottom: 32, opacity: 0.9 }} />

        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Enterprise Trading Intelligence
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 48px', lineHeight: 1.6 }}>
          Analyze. Understand. Decide.
          <br />
          <span style={{ color: 'var(--text-tertiary)' }}>Not Predict. Gamble. Win.</span>
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 64 }}>
          <Link href="/login" className="mavyx-btn mavyx-btn-primary" style={{ padding: '12px 32px' }}>
            Access Platform
          </Link>
          <Link href="/signup" className="mavyx-btn mavyx-btn-secondary" style={{ padding: '12px 32px' }}>
            Create Account
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="mavyx-card" style={{ padding: 20 }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 20, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--text-ghost)' }}>
          AI-generated analysis only · Not financial advice · Always manage your own risk
        </p>
      </footer>
    </main>
  );
}
