'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

/**
 * Login Page — Exact match to reference design
 * Dark background, centered glass card, Mavyx logo, minimal clean design
 */

export default function LoginPage() {
  const router = useRouter();
  const { setSession, token, isHydrated, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && token) router.replace('/welcome');
    setTimeout(() => setMounted(true), 50);
  }, [isHydrated, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      const data = await login({ email, password });
      setSession(data.user, data.access_token);
      router.push('/welcome');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid credentials');
    } finally { setIsLoading(false); }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050508',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Card */}
      <div style={{
        width: 380,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={100} height={40} priority style={{ marginBottom: 8 }} />
        </div>

        {/* Form Container */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: '28px 24px',
        }}>
          {error && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.15)', borderRadius: 6, fontSize: 12, color: '#FF5252' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" required
                style={{
                  width: '100%', padding: '11px 14px',
                  background: '#0C0C14',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, color: '#E0E0E8', fontSize: 14,
                  fontFamily: 'Inter, sans-serif', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" required
                style={{
                  width: '100%', padding: '11px 14px',
                  background: '#0C0C14',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, color: '#E0E0E8', fontSize: 14,
                  fontFamily: 'Inter, sans-serif', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Sign In Button */}
            <button type="submit" disabled={isLoading} style={{
              width: '100%', padding: '11px 0',
              background: '#C9A84C',
              border: 'none', borderRadius: 8,
              color: '#050508', fontSize: 14, fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#484858' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Google */}
          <button style={{
            width: '100%', padding: '11px 0',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#B0B0B8', fontSize: 13, fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Sign Up Link */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#585868' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#C9A84C', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </main>
  );
}
