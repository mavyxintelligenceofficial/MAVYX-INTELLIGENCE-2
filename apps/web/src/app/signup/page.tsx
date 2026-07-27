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
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [experience, setExperience] = useState('');
  const [tradingStyle, setTradingStyle] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && token) router.replace('/workspace');
    setTimeout(() => setMounted(true), 100);
  }, [isHydrated, token, router]);

  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!agreed) { setError('Please accept the terms.'); return; }
    setIsLoading(true); setError(null);
    try {
      const data = await signup({ email, password, fullName });
      setSession(data.user, data.accessToken);
      router.push('/workspace');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Signup failed.');
    } finally { setIsLoading(false); }
  }

  const strengthColors = ['#FF2D55', '#FF9500', '#FFB800', '#22C55E', '#22C55E'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  const inputStyle = {
    width: '100%' as const, height: 56, padding: '0 18px',
    background: '#0A0A0A',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, color: '#FFFFFF', fontSize: 15,
    fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'all 0.3s ease',
  };

  const focusStyle = {
    borderColor: '#D4AF37',
    boxShadow: '0 0 0 3px rgba(212,175,55,0.1)',
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', background: '#0A0A0A',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', overflow: 'hidden',
    }}>
      {/* Left Panel */}
      <div style={{
        width: '55%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: '60px', position: 'relative',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease',
      }}>
        {/* World map background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 600'%3E%3Cpath d='M150,300 Q200,250 250,280 Q300,310 350,290 Q400,270 450,300 Q500,330 550,310 Q600,290 650,320 Q700,350 750,330 Q800,310 850,340' stroke='rgba(255,255,255,0.03)' fill='none' stroke-width='1'/%3E%3Ccircle cx='250' cy='280' r='3' fill='rgba(212,175,55,0.15)'/%3E%3Ccircle cx='450' cy='300' r='3' fill='rgba(212,175,55,0.15)'/%3E%3Ccircle cx='650' cy='320' r='3' fill='rgba(212,175,55,0.15)'/%3E%3C/svg%3E")`,
          backgroundSize: 'cover', opacity: 0.4,
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420 }}>
          <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={160} height={64} priority style={{ marginBottom: 24, opacity: 0.9 }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
            Executive Intelligence
            <br />
            <span style={{ color: '#D4AF37' }}>for Financial Markets</span>
          </h1>
          <p style={{ fontSize: 15, color: '#888888', lineHeight: 1.6, marginBottom: 32 }}>
            Multi-Agent AI · Institutional Research
            <br />
            Executive Decision Intelligence
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Multi-Agent Analysis', 'Explainable AI Decisions', 'Institutional Grade Research'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#B0B0B0' }}>
                <span style={{ color: '#D4AF37' }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 24, left: 60, fontSize: 10, color: '#444444' }}>
          <div>AES-256 Encryption</div>
          <div>Enterprise Authentication</div>
          <div>Version 1.0</div>
        </div>
      </div>

      {/* Right Panel — Signup Card */}
      <div style={{
        width: '45%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 24, right: 24,
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888888',
        }}>
          <span>Forex Market</span>
          <span style={{ color: '#22C55E', fontSize: 8 }}>●</span>
          <span style={{ color: '#22C55E' }}>OPEN</span>
        </div>

        <div style={{
          width: '100%', maxWidth: 460, background: '#171717',
          borderRadius: 24, padding: '44px 40px',
          boxShadow: '0 4px 60px rgba(0,0,0,0.4)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: '90vh', overflowY: 'auto',
        }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Create Your Executive Workspace
            </h2>
            <p style={{ fontSize: 14, color: '#888888' }}>
              Build your AI-powered trading intelligence platform.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.2)', borderRadius: 14, fontSize: 13, color: '#FF5252' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#888888', marginBottom: 6 }}>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#888888', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#888888', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
              {/* Password Strength */}
              {password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[0,1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < passwordStrength ? strengthColors[Math.min(passwordStrength-1,4)] : 'rgba(255,255,255,0.06)', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: strengthColors[Math.min(passwordStrength-1,4)] || '#666' }}>
                    {passwordStrength > 0 ? strengthLabels[Math.min(passwordStrength-1,4)] : 'Too short'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#888888', marginBottom: 6 }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
              {confirmPassword && confirmPassword !== password && (
                <p style={{ fontSize: 11, color: '#FF5252', marginTop: 4 }}>Passwords do not match</p>
              )}
            </div>

            {/* Country & Timezone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888888', marginBottom: 6 }}>Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none' as const }}>
                  <option value="">Select</option>
                  <option value="NG">Nigeria</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="JP">Japan</option>
                  <option value="SG">Singapore</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888888', marginBottom: 6 }}>Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none' as const }}>
                  <option value="">Select</option>
                  <option value="UTC+1">WAT (UTC+1)</option>
                  <option value="UTC+0">GMT (UTC+0)</option>
                  <option value="UTC-5">EST (UTC-5)</option>
                  <option value="UTC-8">PST (UTC-8)</option>
                  <option value="UTC+9">JST (UTC+9)</option>
                </select>
              </div>
            </div>

            {/* Trading Experience & Style */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888888', marginBottom: 6 }}>Trading Experience</label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none' as const }}>
                  <option value="">Select</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="professional">Professional</option>
                  <option value="institutional">Institutional</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888888', marginBottom: 6 }}>Trading Style</label>
                <select value={tradingStyle} onChange={(e) => setTradingStyle(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none' as const }}>
                  <option value="">Select</option>
                  <option value="scalper">Scalper</option>
                  <option value="day">Day Trader</option>
                  <option value="swing">Swing Trader</option>
                  <option value="position">Position Trader</option>
                </select>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  style={{ accentColor: '#D4AF37', marginTop: 2 }} />
                <span style={{ fontSize: 12, color: '#888888', lineHeight: 1.5 }}>
                  I understand that Mavyx provides decision intelligence and research support.
                  Final trading decisions remain my responsibility.
                </span>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading || !agreed} style={{
              width: '100%', height: 56,
              background: '#D4AF37', border: 'none', borderRadius: 14,
              color: '#0A0A0A', fontSize: 16, fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading || !agreed ? 0.5 : 1,
              transition: 'all 0.2s ease', marginBottom: 20,
            }}>
              {isLoading ? 'Creating...' : 'Create Executive Workspace →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 12, color: '#555555' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Google */}
          <button style={{
            width: '100%', height: 48,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, color: '#B0B0B8', fontSize: 14, fontWeight: 500,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>🔴</span> Continue with Google
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888888' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
