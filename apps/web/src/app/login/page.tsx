'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loginWithCredentials } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

/**
 * Login Page — Per UI/UX Specification
 * Split screen: Left (55%) brand experience, Right (45%) auth card
 */

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
  const [marketStatus, setMarketStatus] = useState('OPEN');

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
      minHeight: '100vh',
      display: 'flex',
      background: '#0A0A0A',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      overflow: 'hidden',
    }}>
      {/* ─── Left Panel (55%) — Brand Experience ──────────────── */}
      <div style={{
        width: '55%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        position: 'relative',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>
        {/* Subtle world map background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 600'%3E%3Cpath d='M150,300 Q200,250 250,280 Q300,310 350,290 Q400,270 450,300 Q500,330 550,310 Q600,290 650,320 Q700,350 750,330 Q800,310 850,340' stroke='rgba(255,255,255,0.03)' fill='none' stroke-width='1'/%3E%3Cpath d='M100,350 Q150,300 200,330 Q250,360 300,340 Q350,320 400,350 Q450,380 500,360 Q550,340 600,370 Q650,400 700,380 Q750,360 800,390 Q850,420 900,400' stroke='rgba(255,255,255,0.02)' fill='none' stroke-width='1'/%3E%3Ccircle cx='250' cy='280' r='3' fill='rgba(212,175,55,0.15)'/%3E%3Ccircle cx='450' cy='300' r='3' fill='rgba(212,175,55,0.15)'/%3E%3Ccircle cx='650' cy='320' r='3' fill='rgba(212,175,55,0.15)'/%3E%3Ccircle cx='350' cy='350' r='2' fill='rgba(212,175,55,0.1)'/%3E%3Ccircle cx='550' cy='280' r='2' fill='rgba(212,175,55,0.1)'/%3E%3Ccircle cx='750' cy='340' r='2' fill='rgba(212,175,55,0.1)'/%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          opacity: 0.4,
        }} />

        {/* Glowing financial hubs */}
        {[
          { left: '25%', top: '45%', label: 'London' },
          { left: '15%', top: '55%', label: 'New York' },
          { left: '75%', top: '40%', label: 'Tokyo' },
          { left: '80%', top: '55%', label: 'Singapore' },
          { left: '50%', top: '35%', label: 'Frankfurt' },
          { left: '85%', top: '70%', label: 'Sydney' },
        ].map((hub) => (
          <div key={hub.label} style={{
            position: 'absolute',
            left: hub.left,
            top: hub.top,
            width: 6, height: 6,
            borderRadius: '50%',
            background: 'rgba(212,175,55,0.2)',
            boxShadow: '0 0 20px rgba(212,175,55,0.15)',
            animation: `fadeIn 3s ease infinite alternate`,
          }} />
        ))}

        {/* Brand Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420 }}>
          {/* Logo */}
          <Image
            src="/brand/Mavyx GOLD VERSION.png"
            alt="Mavyx Intelligence"
            width={160}
            height={64}
            priority
            style={{ marginBottom: 24, opacity: 0.9 }}
          />

          {/* Tagline */}
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: '#FFFFFF',
            letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8,
          }}>
            Executive Intelligence
            <br />
            <span style={{ color: '#D4AF37' }}>for Financial Markets</span>
          </h1>

          <p style={{
            fontSize: 15, color: '#888888', lineHeight: 1.6, marginBottom: 32,
          }}>
            Multi-Agent AI · Institutional Research
            <br />
            Executive Decision Intelligence
          </p>

          {/* Feature Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
            {[
              'Multi-Agent Analysis',
              'Explainable AI Decisions',
              'Institutional Grade Research',
            ].map((feature) => (
              <div key={feature} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, color: '#B0B0B0',
              }}>
                <span style={{ color: '#D4AF37', fontSize: 14 }}>✓</span>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Security indicators */}
        <div style={{
          position: 'absolute', bottom: 24, left: 60,
          display: 'flex', flexDirection: 'column', gap: 3,
          fontSize: 10, color: '#444444',
        }}>
          <span>AES-256 Encryption</span>
          <span>Enterprise Authentication</span>
          <span>Secure Cloud Infrastructure</span>
          <span>Version 1.0</span>
        </div>

        {/* Animated market ticker */}
        <div style={{
          position: 'absolute', bottom: 24, right: 60,
          fontSize: 10, color: '#555555',
          animation: 'fadeIn 2s ease infinite alternate',
        }}>
          EUR/USD 1.0875 · GBP/USD 1.2945 · USD/JPY 163.21
        </div>
      </div>

      {/* ─── Right Panel (45%) — Authentication Card ─────────── */}
      <div style={{
        width: '45%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        position: 'relative',
      }}>
        {/* Market Status — Top Right */}
        <div style={{
          position: 'absolute', top: 24, right: 24,
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: '#888888',
        }}>
          <span>Forex Market</span>
          <span style={{ color: '#22C55E', fontSize: 8 }}>●</span>
          <span style={{ color: '#22C55E' }}>{marketStatus}</span>
        </div>

        {/* Auth Card */}
        <div style={{
          width: '100%',
          maxWidth: 460,
          background: '#171717',
          borderRadius: 24,
          padding: '48px 44px',
          boxShadow: '0 4px 60px rgba(0,0,0,0.4)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: 14, color: '#888888' }}>
              Continue to your Executive Workspace.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 20, padding: '10px 14px',
              background: 'rgba(255,45,85,0.08)',
              border: '1px solid rgba(255,45,85,0.2)',
              borderRadius: 14, fontSize: 13, color: '#FF5252',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: '#888888', marginBottom: 8,
              }}>
                Email Address
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" required
                style={{
                  width: '100%', height: 56, padding: '0 18px',
                  background: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, color: '#FFFFFF', fontSize: 15,
                  fontFamily: 'Inter, sans-serif', outline: 'none',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D4AF37';
                  e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: '#888888', marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" required
                  style={{
                    width: '100%', height: 56, padding: '0 48px 0 18px',
                    background: '#0A0A0A',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, color: '#FFFFFF', fontSize: 15,
                    fontFamily: 'Inter, sans-serif', outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D4AF37';
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#666666', cursor: 'pointer',
                    fontSize: 12, padding: 4,
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 28,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#D4AF37' }}
                />
                <span style={{ fontSize: 13, color: '#888888' }}>Remember this device</span>
              </label>
              <Link href="/auth/forgot-password" style={{ fontSize: 13, color: '#D4AF37', textDecoration: 'none' }}>
                Forgot Password
              </Link>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isLoading} style={{
              width: '100%', height: 56,
              background: '#D4AF37',
              border: 'none', borderRadius: 14,
              color: '#0A0A0A', fontSize: 16, fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s ease',
              marginBottom: 24,
            }}>
              {isLoading ? 'Signing in...' : 'Continue →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 12, color: '#555555' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* OAuth Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {[
              { name: 'Google', icon: '🔴', color: '#4285F4' },
              { name: 'Microsoft', icon: '🟦', color: '#00A4EF' },
              { name: 'Apple', icon: '🍎', color: '#FFFFFF' },
            ].map((provider) => (
              <button key={provider.name} style={{
                width: '100%', height: 48,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                color: '#B0B0B8', fontSize: 14, fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s ease',
              }}>
                <span style={{ fontSize: 16 }}>{provider.icon}</span>
                Continue with {provider.name}
              </button>
            ))}
          </div>

          {/* Sign Up Link */}
          <p style={{ textAlign: 'center', fontSize: 14, color: '#888888' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>
              Create Executive Workspace
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
