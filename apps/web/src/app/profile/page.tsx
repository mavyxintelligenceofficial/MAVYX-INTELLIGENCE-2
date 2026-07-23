'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getProfile, updateProfile } from '@/features/profile/api';
import { Profile } from '@/features/profile/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

export default function ProfilePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate, logout } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!isHydrated) return;
    if (!token) { router.replace('/login'); return; }
    getProfile(token)
      .then((data) => { setProfile(data); setDisplayName(data.displayName || ''); })
      .catch((err) => { setError(err instanceof ApiError ? err.message : 'Could not load profile.'); })
      .finally(() => setIsLoading(false));
  }, [isHydrated, token, router]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setIsSaving(true); setError(null); setSaved(false);
    try {
      const updated = await updateProfile(token, { displayName });
      setProfile(updated); setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally { setIsSaving(false); }
  }

  if (!isHydrated || isLoading) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <div className="mavyx-bg" /><div className="mavyx-grid" />
        <div className="relative z-10 text-center">
          <div className="mavyx-loader mx-auto mb-4" />
          <p className="font-orbitron text-xs tracking-widest text-gold/50">INITIALIZING</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen p-6">
      <div className="mavyx-bg" /><div className="mavyx-grid" /><div className="mavyx-orb mavyx-orb-gold" />

      <div className="relative z-10 mx-auto max-w-md mavyx-page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={28} height={28} />
            <h1 className="font-orbitron text-sm tracking-widest text-gold">PROFILE</h1>
          </div>
          <button onClick={logout} className="font-rajdhani text-xs tracking-wider uppercase text-dim hover:text-gold transition-colors">
            Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <div className="mavyx-glass p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-orbitron text-xl font-bold text-black mavyx-pulse-ring"
                style={{ background: 'linear-gradient(135deg, #E8D48B, #C9A84C, #A08030)' }}>
                {(profile?.displayName || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <p className="font-rajdhani text-xl font-semibold" style={{ color: '#F0F0F8' }}>
                {profile?.displayName || 'User'}
              </p>
              <p className="font-orbitron text-xs tracking-widest uppercase text-gold/60">
                {profile?.role}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm font-rajdhani" style={{ background: 'rgba(255,45,85,0.08)', color: '#FF5252', border: '1px solid rgba(255,45,85,0.15)' }}>
              {error}
            </div>
          )}
          {saved && (
            <div className="mb-4 p-3 rounded-lg text-sm font-rajdhani" style={{ background: 'rgba(0,255,136,0.08)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.15)' }}>
              ✓ Profile updated
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block font-orbitron text-[10px] tracking-widest uppercase mb-2 text-dim">
                Display Name
              </label>
              <input type="text" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }}
                maxLength={100} className="mavyx-input" placeholder="Enter your name" />
            </div>
            <button type="submit" disabled={isSaving} className="mavyx-btn mavyx-btn-gold w-full">
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </form>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 gap-3 mavyx-stagger">
          {[
            { href: '/analysis', icon: '⬡', label: 'AI ANALYSIS', desc: 'Run intelligence', color: '#C9A84C' },
            { href: '/market', icon: '◈', label: 'MARKET', desc: 'Live quotes', color: '#00F0FF' },
            { href: '/watchlist', icon: '◇', label: 'WATCHLIST', desc: 'Your pairs', color: '#8B5CF6' },
            { href: '/health', icon: '⊕', label: 'SYSTEM', desc: 'Health status', color: '#00FF88' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="mavyx-glass p-5 text-center group">
              <div className="text-2xl mb-2 transition-all group-hover:scale-110" style={{ color: item.color }}>
                {item.icon}
              </div>
              <p className="font-orbitron text-[10px] tracking-widest font-semibold mb-1" style={{ color: '#F0F0F8' }}>
                {item.label}
              </p>
              <p className="font-rajdhani text-xs" style={{ color: '#6B6B80' }}>{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
