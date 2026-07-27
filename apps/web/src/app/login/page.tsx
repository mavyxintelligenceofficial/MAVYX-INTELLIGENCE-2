'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loginWithCredentials } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { setSession, token, isHydrated, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && token) router.replace('/workspace');
    setTimeout(() => setMounted(true), 100);
  }, [isHydrated, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      const data = await loginWithCredentials({ email, password });
      setSession(data.user, data.accessToken);
      router.push('/workspace');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid credentials');
    } finally { setIsLoading(false); }
  }

  return (
    <main style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      background: '#0A0A0A',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      overflow: 'hidden',
    }}>
      {/* ─── Left Panel (50%) — Brand Experience ──────────────── */}
      <div style={{
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        position: 'relative',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>
        {/* Subtle background dots */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Brand Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <Image
            src="/brand/Mavyx-METALLIC.png"
            alt="Mavyx Intelligence"
            width={180}
            height={72}
            priority
            style={{ marginBottom: 24 }}
          />

          <h1 style={{
            fontSize: 26, fontWeight: 700, color: '#FFFFFF',
            letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8,
          }}>
            Executive Intelligence
            <br />
            <span style={{ color: '#D4AF37' }}>for Financial Markets</span>
          </h1>

          <p style={{ fontSize: 14, color: '#888888', lineHeight: 1.6, marginBottom: 28 }}>
            Multi-Agent AI · Institutional Research
            <br />
            Executive Decision Intelligence
          </p>

          {/* Feature Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Multi-Agent Analysis', 'Explainable AI Decisions', 'Institutional Grade Research'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#B0B0B0' }}>
                <span style={{ color: '#D4AF37' }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Security indicators */}
        <div style={{
          position: 'absolute', bottom: 20, left: 40,
          fontSize: 10, color: '#444444', lineHeight: 1.6,
        }}>
          <div>AES-256 Encryption</div>
          <div>Enterprise Authentication</div>
          <div>Version 1.0</div>
        </div>

        {/* Market ticker */}
        <div style={{
          position: 'absolute', bottom: 20, right: 40,
          fontSize: 10, color: '#555555',
        }}>
          EUR/USD 1.0875 · GBP/USD 1.2945 · USD/JPY 163.21
        </div>
      </div>

      {/* ─── Right Panel (50%) — Auth Card ─────────────────────── */}
      <div style={{
        width: '50%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}>
        {/* Market Status */}
        <div style={{
          position: 'absolute', top: 20, right: 24,
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: '#888888',
        }}>
          <span>Forex Market</span>
          <span style={{ color: '#22C55E', fontSize: 8 }}>●</span>
          <span style={{ color: '#22C55E' }}>OPEN</span>
        </div>

        {/* Auth Card */}
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: '#171717',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: 13, color: '#888888' }}>
              Continue to your Executive Workspace.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 16, padding: '8px 12px',
              background: 'rgba(255,45,85,0.08)',
              border: '1px solid rgba(255,45,85,0.2)',
              borderRadius: 10, fontSize: 12, color: '#FF5252',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address" required
                style={{
                  width: '100%', height: 48, padding: '0 14px',
                  background: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, color: '#FFFFFF', fontSize: 14,
                  fontFamily: 'Inter, sans-serif', outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D4AF37';
                  e.target.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" required
                  style={{
                    width: '100%', height: 48, padding: '0 40px 0 14px',
                    background: '#0A0A0A',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, color: '#FFFFFF', fontSize: 14,
                    fontFamily: 'Inter, sans-serif', outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D4AF37';
                    e.target.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14,
                  }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 20,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#D4AF37' }} />
                <span style={{ fontSize: 12, color: '#888888' }}>Remember me</span>
              </label>
              <Link href="/auth/forgot-password" style={{ fontSize: 12, color: '#D4AF37', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading} style={{
              width: '100%', height: 48,
              background: '#D4AF37',
              border: 'none', borderRadius: 12,
              color: '#0A0A0A', fontSize: 14, fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
              marginBottom: 20,
            }}>
              {isLoading ? 'Signing in...' : 'Continue →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#555' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* OAuth */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {['Google', 'Microsoft', 'Apple'].map((p) => (
              <button key={p} style={{
                width: '100%', height: 44,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                color: '#B0B0B8', fontSize: 13, fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                Continue with {p}
              </button>
            ))}
          </div>

          {/* Sign Up */}
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>
              Create Workspace
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
