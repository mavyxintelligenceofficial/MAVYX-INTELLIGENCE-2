'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

/**
 * Login Page — Per MEIDS §6.4
 * "Login should communicate trust"
 * Dark themed, animated, professional
 */

export default function LoginPage() {
  const router = useRouter();
  const { setSession, token, isHydrated, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPage, setShowPage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && token) router.replace('/welcome');
    setTimeout(() => setShowPage(true), 100);
  }, [isHydrated, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      const data = await login({ email, password });
      setSession(data.user, data.access_token);
      router.push('/welcome');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid email or password.');
    } finally { setIsLoading(false); }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050508',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.06), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-10%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,240,255,0.03), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Login Card */}
      <div style={{
        width: 400, padding: '0 24px',
        opacity: showPage ? 1 : 0,
        transform: showPage ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Logo — centered, prominent */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Image
            src="/brand/Mavyx GOLD VERSION.png"
            alt="Mavyx Intelligence"
            width={140}
            height={56}
            priority
            style={{ marginBottom: 16, opacity: 0.9 }}
          />
          <h1 style={{
            fontSize: 24, fontWeight: 700, color: '#E8E8ED',
            letterSpacing: '-0.02em', marginBottom: 4,
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: '#686878' }}>
            Sign in to your intelligence workspace
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 28,
        }}>
          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px',
              background: 'rgba(255,45,85,0.08)',
              border: '1px solid rgba(255,45,85,0.15)',
              borderRadius: 8, fontSize: 13, color: '#FF5252',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                color: '#686878', marginBottom: 8,
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '12px 14px',
                  background: '#0A0A12',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: '#E8E8ED',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                color: '#686878', marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%', padding: '12px 14px',
                    paddingRight: 44,
                    background: '#0A0A12',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#E8E8ED',
                    fontSize: 14,
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#686878', cursor: 'pointer',
                    fontSize: 12, padding: 4,
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '12px 24px',
                background: isLoading ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg, #C9A84C, #A08030)',
                color: '#050508',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '20px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#484858' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={() => {
              // Google OAuth redirect
              const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
              const redirectUri = `${window.location.origin}/auth/google/callback`;
              const scope = 'email profile openid';
              window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
            }}
            style={{
              width: '100%', padding: '12px 24px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              color: '#E8E8ED',
              fontSize: 13, fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Sign Up Link */}
        <p style={{
          textAlign: 'center', marginTop: 24,
          fontSize: 13, color: '#686878',
        }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </p>

        {/* Security Notice */}
        <p style={{
          textAlign: 'center', marginTop: 32,
          fontSize: 11, color: '#484858',
        }}>
          Protected by enterprise-grade security
        </p>
      </div>
    </main>
  );
}
