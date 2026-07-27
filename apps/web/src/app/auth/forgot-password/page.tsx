'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import '@/app/mavyx-auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) { setError('Enter your email address.'); return; }
    setError('');
    setLoading(true);
    // Simulate API call
    setTimeout(() => { setSent(true); setLoading(false); }, 1500);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--mvx-bg)', fontFamily: 'var(--mvx-font)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 460, background: 'var(--mvx-card)',
        border: '1px solid var(--mvx-border)', borderRadius: 24,
        padding: '48px', boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
      }}>
        {!sent ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Reset Password</h2>
              <p style={{ fontSize: 14, color: 'var(--mvx-text-secondary)', lineHeight: 1.6 }}>
                Enter the email tied to your Executive Workspace and we'll send a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--mvx-text-secondary)', marginBottom: 8 }}>
                  Email Address
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={{
                    width: '100%', height: 56, padding: '0 16px',
                    background: 'var(--mvx-surface)', border: `1px solid ${error ? 'var(--mvx-error)' : 'var(--mvx-border)'}`,
                    borderRadius: 14, color: 'var(--mvx-text-primary)', fontSize: 15,
                    fontFamily: 'var(--mvx-font)', outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--mvx-gold)'; e.target.style.boxShadow = '0 0 0 3px var(--mvx-gold-dim)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--mvx-border)'; e.target.style.boxShadow = 'none'; }} />
                {error && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--mvx-error)' }}>{error}</div>}
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', height: 56, background: 'var(--mvx-gold)',
                border: 'none', borderRadius: 14, color: '#0a0a0a',
                fontSize: 15, fontWeight: 600, fontFamily: 'var(--mvx-font)',
                cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(212,175,55,0.18)',
              }}>
                {loading ? 'Please wait…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: 56, height: 56, margin: '0 auto 24px', borderRadius: '50%',
              background: 'var(--mvx-gold-dim)', color: 'var(--mvx-gold)',
              fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Check Your Inbox</h2>
            <p style={{ fontSize: 14, color: 'var(--mvx-text-secondary)', lineHeight: 1.6 }}>
              A reset link has been sent to <strong>{email}</strong>.
            </p>
          </div>
        )}

        <Link href="/login" style={{
          display: 'block', textAlign: 'center', marginTop: 24,
          fontSize: 13, color: 'var(--mvx-text-secondary)', textDecoration: 'none',
        }}>
          ← Return to Login
        </Link>
      </div>
    </div>
  );
}
