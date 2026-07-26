'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signup } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

export default function SignupPage() {
  const router = useRouter();
  const { setSession, token, isHydrated, hydrate } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPage, setShowPage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && token) router.replace('/welcome');
    setTimeout(() => setShowPage(true), 100);
  }, [isHydrated, token, router]);

  // Password strength checker
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setIsLoading(true); setError(null);
    try {
      const data = await signup({ email, password, fullName });
      setSession(data.user, data.access_token);
      router.push('/welcome');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Signup failed. Please try again.');
    } finally { setIsLoading(false); }
  }

  const strengthColors = ['#FF2D55', '#FF9500', '#FFB800', '#34C759', '#00C853'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

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
        position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.06), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{
        width: 420, padding: '0 24px',
        opacity: showPage ? 1 : 0,
        transform: showPage ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={120} height={48} priority style={{ marginBottom: 12, opacity: 0.9 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8E8ED', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 13, color: '#686878' }}>Start using institutional-grade trading intelligence</p>
        </div>

        {/* Form Card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.15)', borderRadius: 8, fontSize: 13, color: '#FF5252' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#686878', marginBottom: 6 }}>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required
                style={{ width: '100%', padding: '11px 14px', background: '#0A0A12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#E8E8ED', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.2s ease' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#686878', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                style={{ width: '100%', padding: '11px 14px', background: '#0A0A12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#E8E8ED', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.2s ease' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#686878', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" required
                  style={{ width: '100%', padding: '11px 14px', paddingRight: 44, background: '#0A0A12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#E8E8ED', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.2s ease' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#686878', cursor: 'pointer', fontSize: 12, padding: 4 }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {/* Password Strength Bar */}
              {password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {[0,1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < passwordStrength ? strengthColors[Math.min(passwordStrength - 1, 4)] : 'rgba(255,255,255,0.06)', transition: 'background 0.2s ease' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: strengthColors[Math.min(passwordStrength - 1, 4)] || '#686878' }}>
                    {passwordStrength > 0 ? strengthLabels[Math.min(passwordStrength - 1, 4)] : 'Too short'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#686878', marginBottom: 6 }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••••••" required
                style={{ width: '100%', padding: '11px 14px', background: '#0A0A12', border: `1px solid ${confirmPassword && confirmPassword !== password ? 'rgba(255,45,85,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: '#E8E8ED', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.2s ease' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                onBlur={(e) => e.target.style.borderColor = confirmPassword && confirmPassword !== password ? 'rgba(255,45,85,0.4)' : 'rgba(255,255,255,0.08)'} />
              {confirmPassword && confirmPassword !== password && (
                <p style={{ fontSize: 11, color: '#FF5252', marginTop: 4 }}>Passwords do not match</p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading || (confirmPassword && confirmPassword !== password)}
              style={{
                width: '100%', padding: '12px 24px',
                background: isLoading ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg, #C9A84C, #A08030)',
                color: '#050508', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.05em', textTransform: 'uppercase',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Google Sign-Up */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#484858' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <button
            onClick={() => {
              const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
              const redirectUri = `${window.location.origin}/auth/google/callback`;
              window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile%20openid`;
            }}
            style={{
              width: '100%', padding: '12px 24px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, color: '#E8E8ED', fontSize: 13, fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#686878' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}
