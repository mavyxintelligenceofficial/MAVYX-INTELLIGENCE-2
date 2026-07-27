'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loginWithCredentials } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';
import '@/app/mavyx-auth.css';

const HUBS = [
  { name: 'London', x: 46, y: 30 },
  { name: 'New York', x: 27, y: 34 },
  { name: 'Tokyo', x: 85, y: 38 },
  { name: 'Singapore', x: 75, y: 56 },
  { name: 'Frankfurt', x: 48, y: 29 },
  { name: 'Sydney', x: 88, y: 78 },
];

const PAIRS = [
  { symbol: 'EUR/USD', value: '1.0842', up: true },
  { symbol: 'GBP/USD', value: '1.2716', up: false },
  { symbol: 'USD/JPY', value: '156.34', up: true },
  { symbol: 'USD/CHF', value: '0.8871', up: false },
  { symbol: 'AUD/USD', value: '0.6598', up: true },
  { symbol: 'USD/CAD', value: '1.3702', up: true },
];

export default function LoginPage() {
  const router = useRouter();
  const { setSession, token, isHydrated, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && token) router.replace('/workspace');
    setTimeout(() => setMounted(true), 100);
  }, [isHydrated, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!email) nextErrors.email = 'Enter your email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const data = await loginWithCredentials({ email, password });
      setSession(data.user, data.accessToken);
      router.push('/workspace');
    } catch (err) {
      setErrors({ general: err instanceof ApiError ? err.message : 'Invalid credentials' });
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--mvx-bg)', fontFamily: 'var(--mvx-font)' }}>
      {/* ─── Left Panel (55%) — Brand Experience ───────────── */}
      <div style={{
        flex: '0 0 55%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '64px', position: 'relative',
        overflow: 'hidden', animation: 'mvx-fade-in 600ms ease',
      }}>
        {/* World Map Background */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <g fill="var(--mvx-text-primary)" opacity="0.02">
              <path d="M10,20 Q18,14 28,17 Q34,15 40,19 Q36,26 30,25 Q24,30 18,27 Q12,28 10,20 Z" />
              <path d="M20,32 Q26,30 30,36 Q28,44 22,46 Q18,40 20,32 Z" />
              <path d="M45,16 Q54,12 62,16 Q66,14 70,17 Q68,24 60,22 Q52,25 45,20 Z" />
              <path d="M46,26 Q52,24 55,32 Q52,42 47,44 Q43,34 46,26 Z" />
              <path d="M64,30 Q74,26 84,30 Q88,36 82,42 Q72,44 66,38 Q62,34 64,30 Z" />
              <path d="M78,50 Q86,48 90,54 Q88,60 80,58 Q76,54 78,50 Z" />
            </g>
          </svg>
          {HUBS.map((hub) => (
            <span key={hub.name} style={{
              position: 'absolute', left: `${hub.x}%`, top: `${hub.y}%`,
              width: 5, height: 5, borderRadius: '50%', background: 'var(--mvx-gold)',
              opacity: 0.25, boxShadow: '0 0 24px 10px rgba(212, 175, 55, 0.06)',
              animation: `mvx-hub-pulse 5s ease-in-out infinite ${hub.x % 3}s`,
            }} />
          ))}
        </div>

        {/* Brand Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <Image src="/brand/Mavyx-LOGO.png" alt="Mavyx" width={160} height={64} priority
            style={{ marginBottom: 48, animation: 'mvx-fade-in 600ms ease 100ms both' }} />

          <h1 style={{
            fontSize: 40, lineHeight: 1.18, fontWeight: 600, letterSpacing: '-0.01em',
            color: 'var(--mvx-text-primary)', marginBottom: 16,
          }}>
            Executive Intelligence
            <br />
            for Financial Markets
          </h1>

          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--mvx-text-secondary)', marginBottom: 32, maxWidth: 380 }}>
            Multi-Agent AI · Institutional Research · Executive Decision Intelligence
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Multi-Agent Analysis', 'Explainable AI Decisions', 'Institutional Grade Research'].map((f) => (
              <div key={f} style={{ fontSize: 13, color: 'var(--mvx-text-secondary)', letterSpacing: '0.01em' }}>
                ✓ {f}
              </div>
            ))}
          </div>
        </div>

        {/* Market Ticker */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 64, paddingTop: 24, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', gap: 32, width: 'max-content',
            animation: 'mvx-ticker-scroll 60s linear infinite',
          }}>
            {[...PAIRS, ...PAIRS].map((p, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--mvx-text-secondary)' }}>{p.symbol}</span>
                <span style={{ color: p.up ? 'var(--mvx-status-up)' : 'var(--mvx-status-down)' }}>{p.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel (45%) — Auth Card ──────────────────── */}
      <div style={{
        flex: '0 0 45%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24,
        position: 'relative', background: 'var(--mvx-surface)',
      }}>
        {/* Market Status */}
        <div style={{
          position: 'absolute', top: 24, right: 32,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'var(--mvx-text-tertiary)', letterSpacing: '0.02em',
        }}>
          <span>Forex Market</span>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--mvx-status-up)',
            boxShadow: '0 0 6px 2px rgba(47, 158, 91, 0.35)',
          }} />
          <span style={{ color: 'var(--mvx-status-up)', fontWeight: 500 }}>OPEN</span>
        </div>

        {/* Auth Card */}
        <div style={{
          width: '100%', maxWidth: 460, background: 'var(--mvx-card)',
          border: '1px solid var(--mvx-border)', borderRadius: 'var(--mvx-radius-card)',
          padding: '48px', boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)',
          animation: mounted ? 'mvx-card-in 300ms ease both' : 'none',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 8 }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: 14, color: 'var(--mvx-text-secondary)' }}>
              Continue to your Executive Workspace.
            </p>
          </div>

          {/* Error */}
          {errors.general && (
            <div style={{
              marginBottom: 20, padding: '10px 16px',
              background: 'var(--mvx-error-bg)', border: '1px solid rgba(201,79,79,0.2)',
              borderRadius: 10, fontSize: 13, color: 'var(--mvx-error)',
            }}>
              {errors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>
                Email Address
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: '100%', height: 56, padding: '0 16px',
                  background: 'var(--mvx-surface)', border: `1px solid ${errors.email ? 'var(--mvx-error)' : 'var(--mvx-border)'}`,
                  borderRadius: 'var(--mvx-radius-input)', color: 'var(--mvx-text-primary)',
                  fontSize: 15, fontFamily: 'var(--mvx-font)', outline: 'none',
                  transition: 'all 200ms ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--mvx-gold)';
                  e.target.style.boxShadow = '0 0 0 3px var(--mvx-gold-dim)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.email ? 'var(--mvx-error)' : 'var(--mvx-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.email && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--mvx-error)' }}>{errors.email}</div>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', height: 56, padding: '0 16px',
                  background: 'var(--mvx-surface)', border: `1px solid ${errors.password ? 'var(--mvx-error)' : 'var(--mvx-border)'}`,
                  borderRadius: 'var(--mvx-radius-input)', color: 'var(--mvx-text-primary)',
                  fontSize: 15, fontFamily: 'var(--mvx-font)', outline: 'none',
                  transition: 'all 200ms ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--mvx-gold)';
                  e.target.style.boxShadow = '0 0 0 3px var(--mvx-gold-dim)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.password ? 'var(--mvx-error)' : 'var(--mvx-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.password && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--mvx-error)' }}>{errors.password}</div>}
            </div>

            {/* Remember / Forgot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--mvx-text-secondary)' }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: 'var(--mvx-gold)' }} />
                Remember this device
              </label>
              <Link href="/auth/forgot-password" style={{ fontSize: 13, color: 'var(--mvx-text-secondary)', textDecoration: 'none' }}>
                Forgot Password
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', height: 56, background: 'var(--mvx-gold)',
              border: 'none', borderRadius: 'var(--mvx-radius-button)',
              color: '#0a0a0a', fontSize: 15, fontWeight: 600,
              fontFamily: 'var(--mvx-font)', cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1, boxShadow: '0 4px 16px rgba(212,175,55,0.18)',
              transition: 'all 200ms ease',
            }}>
              {loading ? 'Please wait…' : 'Continue →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--mvx-border)' }} />
            <span style={{ fontSize: 12, color: 'var(--mvx-text-tertiary)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--mvx-border)' }} />
          </div>

          {/* OAuth Buttons */}
          {['Google', 'Microsoft', 'Apple'].map((provider) => (
            <button key={provider} style={{
              width: '100%', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              border: '1px solid var(--mvx-border)', borderRadius: 'var(--mvx-radius-button)',
              background: 'transparent', color: 'var(--mvx-text-primary)', fontSize: 14,
              fontFamily: 'var(--mvx-font)', cursor: 'pointer', marginBottom: 12,
              transition: 'all 200ms ease',
            }}>
              Continue with {provider}
            </button>
          ))}

          {/* Sign Up */}
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--mvx-text-secondary)', marginTop: 32 }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--mvx-gold)', textDecoration: 'none', fontWeight: 500 }}>
              Create Executive Workspace
            </Link>
          </p>
        </div>

        {/* Security Indicators */}
        <div style={{
          marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
          fontSize: 11, color: 'var(--mvx-text-tertiary)', maxWidth: 460, textAlign: 'center',
        }}>
          <span>AES-256 Encryption</span>
          <span>·</span>
          <span>Enterprise Authentication</span>
          <span>·</span>
          <span>Secure Cloud Infrastructure</span>
          <span>·</span>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  );
}
