'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

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
      router.push('/profile');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.');
    } finally { setIsLoading(false); }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center">
      <div className="mavyx-bg" /><div className="mavyx-grid" />
      <div className="mavyx-orb mavyx-orb-gold" />

      <div className="relative z-10 w-full max-w-sm px-6 mavyx-page-enter">
        {/* Logo */}
        <div className="text-center mb-10">
          <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={120} height={48} priority className="mx-auto mb-4 drop-shadow-[0_0_30px_rgba(201,168,76,0.3)]" />
          <p className="font-orbitron text-[10px] tracking-[0.3em] text-dim">SIGN IN</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mavyx-glass p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg text-sm font-rajdhani" style={{ background: 'rgba(255,45,85,0.08)', color: '#FF5252', border: '1px solid rgba(255,45,85,0.15)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block font-orbitron text-[10px] tracking-widest uppercase mb-2 text-dim">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mavyx-input" required />
          </div>

          <div>
            <label className="block font-orbitron text-[10px] tracking-widest uppercase mb-2 text-dim">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mavyx-input" required />
          </div>

          <button type="submit" disabled={isLoading} className="mavyx-btn mavyx-btn-gold w-full">
            {isLoading ? 'AUTHENTICATING...' : 'ACCESS PLATFORM'}
          </button>
        </form>

        <p className="text-center mt-6 font-rajdhani text-sm text-dim">
          No account?{' '}
          <Link href="/signup" className="text-gold hover:underline">Create one</Link>
        </p>
      </div>
    </main>
  );
}
