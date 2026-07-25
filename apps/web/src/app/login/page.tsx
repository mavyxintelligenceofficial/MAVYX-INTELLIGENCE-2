'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

/**
 * Login Page — Per MEIDS §6.4
 * "Login should communicate trust"
 * Centered login card, large logo, security notice, no distractions
 */

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      const data = await login({ email, password });
      setSession(data.user, data.access_token);
      router.push('/welcome');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.');
    } finally { setIsLoading(false); }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ width: 360, padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={120} height={48} priority
            style={{ marginBottom: 16, opacity: 0.9 }} />
          <p className="text-label" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.2em' }}>Sign In</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mavyx-card" style={{ padding: 24 }}>
          {error && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 4, fontSize: 12, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="mavyx-input" required />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••" className="mavyx-input" required />
          </div>

          <button type="submit" disabled={isLoading} className="mavyx-btn mavyx-btn-primary" style={{ width: '100%', padding: '10px 16px' }}>
            {isLoading ? 'Authenticating...' : 'Access Platform'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-tertiary)' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Create one</Link>
        </p>

        {/* Security notice */}
        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--text-ghost)' }}>
          Protected by enterprise-grade security
        </p>
      </div>
    </main>
  );
}
