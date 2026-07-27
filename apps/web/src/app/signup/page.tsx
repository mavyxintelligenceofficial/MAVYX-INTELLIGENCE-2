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
  const [mounted, setMounted] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && token) router.replace('/workspace');
    setTimeout(() => setMounted(true), 100);
  }, [isHydrated, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setIsLoading(true); setError(null);
    try {
      const data = await signup({ email, password, fullName });
      setSession(data.user, data.accessToken);
      router.push('/workspace');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Signup failed.');
    } finally { setIsLoading(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 14px',
    background: '#0A0A0A',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, color: '#FFFFFF', fontSize: 14,
    fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'all 0.2s',
  };

  return (
    <main style={{
      height: '100vh', width: '100vw',
      display: 'flex', background: '#0A0A0A',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Left Panel */}
      <div style={{
        width: '50%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '40px', position: 'relative',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <Image src="/brand/Mavyx-METALLIC.png" alt="Mavyx" width={180} height={72} priority style={{ marginBottom: 24 }} />
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
            Executive Intelligence<br /><span style={{ color: '#D4AF37' }}>for Financial Markets</span>
          </h1>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 28 }}>
            Multi-Agent AI · Institutional Research<br />Executive Decision Intelligence
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Multi-Agent Analysis', 'Explainable AI Decisions', 'Institutional Grade Research'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#B0B0B0' }}>
                <span style={{ color: '#D4AF37' }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: 40, fontSize: 10, color: '#444', lineHeight: 1.6 }}>
          <div>AES-256 Encryption</div>
          <div>Enterprise Authentication</div>
          <div>Version 1.0</div>
        </div>
      </div>

      {/* Right Panel — Signup Card */}
      <div style={{
        width: '50%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 20, right: 24,
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888',
        }}>
          <span>Forex Market</span>
          <span style={{ color: '#22C55E', fontSize: 8 }}>●</span>
          <span style={{ color: '#22C55E' }}>OPEN</span>
        </div>

        <div style={{
          width: '100%', maxWidth: 400, background: '#171717',
          borderRadius: 20, padding: '28px 24px',
          boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: '95vh', overflowY: 'auto',
        }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>
              Create Your Workspace
            </h2>
            <p style={{ fontSize: 13, color: '#888' }}>
              Build your AI-powered trading intelligence platform.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.2)', borderRadius: 10, fontSize: 12, color: '#FF5252' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name" required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address" required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password" required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
              {confirmPassword && confirmPassword !== password && (
                <p style={{ fontSize: 11, color: '#FF5252', marginTop: 4 }}>Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} style={{
              width: '100%', height: 48,
              background: '#D4AF37', border: 'none', borderRadius: 12,
              color: '#0A0A0A', fontSize: 14, fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s', marginBottom: 16,
            }}>
              {isLoading ? 'Creating...' : 'Create Executive Workspace →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#555' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <button style={{
            width: '100%', height: 44,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, color: '#B0B0B8', fontSize: 13, fontWeight: 500,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16,
          }}>
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
