'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signup } from '@/features/auth/api';
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

async function fetchLivePrices(): Promise<typeof PAIRS> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${API_URL}/market/ticker`);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    return PAIRS.map((p, i) => ({
      symbol: p.symbol,
      value: data[p.symbol]?.price?.toString() || p.value,
      up: data[p.symbol] ? (i % 2 === 0) : p.up,
    }));
  } catch {
    return PAIRS;
  }
}

const COUNTRIES = ['United States', 'United Kingdom', 'Nigeria', 'Germany', 'Singapore', 'Japan', 'Australia', 'Other'];
const TIMEZONES = ['GMT', 'GMT+1', 'EST', 'PST', 'WAT', 'JST', 'AEST'];
const EXPERIENCE = ['New to Trading', '1–3 Years', '3–7 Years', '7+ Years'];
const STYLES = ['Scalper', 'Day Trader', 'Swing Trader', 'Position Trader'];

export default function SignupPage() {
  const router = useRouter();
  const { setSession, token, isHydrated, hydrate } = useAuthStore();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    country: '', timezone: '', experience: '', style: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [livePairs, setLivePairs] = useState(PAIRS);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && token) router.replace('/workspace');
    setTimeout(() => setMounted(true), 100);
    fetchLivePrices().then(setLivePairs);
    const interval = setInterval(() => {
      fetchLivePrices().then(setLivePairs);
    }, 15000);
    return () => clearInterval(interval);
  }, [isHydrated, token, router]);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.fullName) nextErrors.fullName = 'Enter your full name.';
    if (!form.email) nextErrors.email = 'Enter your email address.';
    if (!form.password) nextErrors.password = 'Choose a password.';
    if (form.confirmPassword !== form.password || !form.confirmPassword)
      nextErrors.confirmPassword = 'Passwords do not match.';
    if (!agreed) nextErrors.agreed = 'Please confirm to continue.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const data = await signup({ email: form.email, password: form.password, fullName: form.fullName });
      setSession(data.user, data.accessToken);
      router.push('/workspace');
    } catch (err) {
      setErrors({ general: err instanceof ApiError ? err.message : 'Signup failed.' });
    } finally { setLoading(false); }
  }

  function getPasswordStrength(pw: string) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 12) score++;
    return Math.min(score, 3);
  }

  const strengthLabels = ['Weak', 'Medium', 'Strong', 'Excellent'];
  const strengthColors = ['#c94f4f', '#d4af37', '#d4af37', '#2f9e5b'];

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 56, padding: '0 16px',
    background: 'var(--mvx-surface)', border: '1px solid var(--mvx-border)',
    borderRadius: 14, color: 'var(--mvx-text-primary)',
    fontSize: 15, fontFamily: 'var(--mvx-font)', outline: 'none',
    transition: 'all 200ms ease',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239a9a9a' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--mvx-bg)', fontFamily: 'var(--mvx-font)' }}>
      {/* Left Panel */}
      <div style={{
        flex: '0 0 55%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '64px', position: 'relative',
        overflow: 'hidden', animation: 'mvx-fade-in 600ms ease',
      }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <g fill="var(--mvx-text-primary)" opacity="0.02">
              <path d="M10,20 Q18,14 28,17 Q34,15 40,19 Q36,26 30,25 Q24,30 18,27 Q12,28 10,20 Z" />
              <path d="M45,16 Q54,12 62,16 Q66,14 70,17 Q68,24 60,22 Q52,25 45,20 Z" />
              <path d="M64,30 Q74,26 84,30 Q88,36 82,42 Q72,44 66,38 Q62,34 64,30 Z" />
            </g>
          </svg>
          {HUBS.map((hub) => (
            <span key={hub.name} style={{
              position: 'absolute', left: `${hub.x}%`, top: `${hub.y}%`,
              width: 5, height: 5, borderRadius: '50%', background: 'var(--mvx-gold)',
              opacity: 0.25, boxShadow: '0 0 24px 10px rgba(212,175,55,0.06)',
              animation: `mvx-hub-pulse 5s ease-in-out infinite ${hub.x % 3}s`,
            }} />
          ))}
        </div>

        {/* Logo — small, top-left corner */}
        <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 2 }}>
          <Image src="/brand/Mavyx-LOGO.png" alt="Mavyx" width={80} height={32} priority />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <h1 style={{ fontSize: 40, lineHeight: 1.18, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 16 }}>
            Executive Intelligence<br />for Financial Markets
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--mvx-text-secondary)', marginBottom: 32, maxWidth: 380 }}>
            Multi-Agent AI · Institutional Research · Executive Decision Intelligence
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Multi-Agent Analysis', 'Explainable AI Decisions', 'Institutional Grade Research'].map((f) => (
              <div key={f} style={{ fontSize: 13, color: 'var(--mvx-text-secondary)' }}>✓ {f}</div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: 64, paddingTop: 24, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 32, width: 'max-content', animation: 'mvx-ticker-scroll 60s linear infinite' }}>
            {[...livePairs, ...livePairs].map((p, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--mvx-text-secondary)' }}>{p.symbol}</span>
                <span style={{ color: p.up ? 'var(--mvx-status-up)' : 'var(--mvx-status-down)' }}>{p.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Signup Card */}
      <div style={{
        flex: '0 0 45%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24,
        position: 'relative', background: 'var(--mvx-surface)',
      }}>
        <div style={{
          position: 'absolute', top: 24, right: 32,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'var(--mvx-text-tertiary)',
        }}>
          <span>Forex Market</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mvx-status-up)', boxShadow: '0 0 6px 2px rgba(47,158,91,0.35)' }} />
          <span style={{ color: 'var(--mvx-status-up)', fontWeight: 500 }}>OPEN</span>
        </div>

        <div style={{
          width: '100%', maxWidth: 460, background: 'var(--mvx-card)',
          border: '1px solid var(--mvx-border)', borderRadius: 24,
          padding: '48px', boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)',
          animation: mounted ? 'mvx-card-in 300ms ease both' : 'none',
          maxHeight: '95vh', overflowY: 'auto',
        }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 8 }}>
              Create Your Executive Workspace
            </h2>
            <p style={{ fontSize: 14, color: 'var(--mvx-text-secondary)' }}>
              Build your AI-powered trading intelligence platform.
            </p>
          </div>

          {errors.general && (
            <div style={{ marginBottom: 20, padding: '10px 16px', background: 'var(--mvx-error-bg)', border: '1px solid rgba(201,79,79,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--mvx-error)' }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>Full Name</label>
              <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                placeholder="Jordan Blake" style={{ ...inputStyle, borderColor: errors.fullName ? 'var(--mvx-error)' : 'var(--mvx-border)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--mvx-gold)'; e.target.style.boxShadow = '0 0 0 3px var(--mvx-gold-dim)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--mvx-border)'; e.target.style.boxShadow = 'none'; }} />
              {errors.fullName && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--mvx-error)' }}>{errors.fullName}</div>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                placeholder="you@company.com" style={{ ...inputStyle, borderColor: errors.email ? 'var(--mvx-error)' : 'var(--mvx-border)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--mvx-gold)'; e.target.style.boxShadow = '0 0 0 3px var(--mvx-gold-dim)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--mvx-border)'; e.target.style.boxShadow = 'none'; }} />
              {errors.email && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--mvx-error)' }}>{errors.email}</div>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>Password</label>
              <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                placeholder="••••••••" style={{ ...inputStyle, borderColor: errors.password ? 'var(--mvx-error)' : 'var(--mvx-border)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--mvx-gold)'; e.target.style.boxShadow = '0 0 0 3px var(--mvx-gold-dim)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--mvx-border)'; e.target.style.boxShadow = 'none'; }} />
              {form.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= getPasswordStrength(form.password) ? strengthColors[getPasswordStrength(form.password)] : 'var(--mvx-border)', transition: 'background 200ms ease' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: strengthColors[getPasswordStrength(form.password)] }}>
                    {strengthLabels[getPasswordStrength(form.password)]}
                  </span>
                </div>
              )}
              {errors.password && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--mvx-error)' }}>{errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="••••••••" style={{ ...inputStyle, borderColor: errors.confirmPassword ? 'var(--mvx-error)' : 'var(--mvx-border)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--mvx-gold)'; e.target.style.boxShadow = '0 0 0 3px var(--mvx-gold-dim)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--mvx-border)'; e.target.style.boxShadow = 'none'; }} />
              {errors.confirmPassword && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--mvx-error)' }}>{errors.confirmPassword}</div>}
            </div>

            {/* Country & Timezone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>Country</label>
                <select value={form.country} onChange={(e) => update('country', e.target.value)} style={selectStyle}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>Timezone</label>
                <select value={form.timezone} onChange={(e) => update('timezone', e.target.value)} style={selectStyle}>
                  <option value="">Select timezone</option>
                  {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Trading Experience & Style */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>Trading Experience</label>
                <select value={form.experience} onChange={(e) => update('experience', e.target.value)} style={selectStyle}>
                  <option value="">Select level</option>
                  {EXPERIENCE.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>Trading Style</label>
                <select value={form.style} onChange={(e) => update('style', e.target.value)} style={selectStyle}>
                  <option value="">Select style</option>
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                style={{ accentColor: 'var(--mvx-gold)', marginTop: 2 }} />
              <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--mvx-text-secondary)' }}>
                I understand that Mavyx provides decision intelligence and research support. Final trading decisions remain my responsibility.
              </span>
            </label>
            {errors.agreed && <div style={{ marginTop: -16, marginBottom: 16, fontSize: 12, color: 'var(--mvx-error)' }}>{errors.agreed}</div>}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', height: 56, background: 'var(--mvx-gold)',
              border: 'none', borderRadius: 14, color: '#0a0a0a',
              fontSize: 15, fontWeight: 600, fontFamily: 'var(--mvx-font)',
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
              boxShadow: '0 4px 16px rgba(212,175,55,0.18)', transition: 'all 200ms ease',
            }}>
              {loading ? 'Please wait…' : 'Create Executive Workspace →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--mvx-text-secondary)', marginTop: 32 }}>
            Already have a workspace?{' '}
            <Link href="/login" style={{ color: 'var(--mvx-gold)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>

        <div style={{
          marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
          fontSize: 11, color: 'var(--mvx-text-tertiary)', maxWidth: 460, textAlign: 'center',
        }}>
          <span>AES-256 Encryption</span><span>·</span>
          <span>Enterprise Authentication</span><span>·</span>
          <span>Secure Cloud Infrastructure</span><span>·</span>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  );
}
