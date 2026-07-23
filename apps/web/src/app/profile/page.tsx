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

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    getProfile(token)
      .then((data) => {
        setProfile(data);
        setDisplayName(data.displayName || '');
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not load your profile.');
      })
      .finally(() => setIsLoading(false));
  }, [isHydrated, token, router]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateProfile(token, { displayName });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your changes.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (!isHydrated || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="mavyx-spinner" />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6" style={{ background: '#0A0A0F' }}>
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/Mavyx GOLD VERSION.png"
              alt="Mavyx"
              width={32}
              height={32}
            />
            <h1 className="text-xl font-semibold" style={{ color: '#E8E8F0' }}>
              Profile
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm transition-colors hover:text-amber-400"
            style={{ color: '#8888A0' }}
          >
            Log out
          </button>
        </div>

        {/* Profile Card */}
        <div className="mavyx-card">
          {profile && (
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #A08030)',
                  color: '#0A0A0F',
                }}
              >
                {(profile.displayName || profile.role || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#E8E8F0' }}>
                  {profile.displayName || 'User'}
                </p>
                <p className="text-xs" style={{ color: '#8888A0' }}>
                  {profile.role}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(255,23,68,0.1)', color: '#FF5252', border: '1px solid rgba(255,23,68,0.2)' }}>
              {error}
            </div>
          )}
          {saved && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(0,200,83,0.1)', color: '#00C853', border: '1px solid rgba(0,200,83,0.2)' }}>
              Saved.
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#8888A0' }}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }}
                maxLength={100}
                className="mavyx-input"
                placeholder="Enter your name"
              />
            </div>
            <button type="submit" disabled={isSaving} className="mavyx-btn-gold w-full">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/analysis', icon: '🤖', label: 'AI Analysis', desc: 'Run intelligence' },
            { href: '/market', icon: '📈', label: 'Market', desc: 'Live quotes' },
            { href: '/watchlist', icon: '👁️', label: 'Watchlist', desc: 'Your pairs' },
            { href: '/health', icon: '💚', label: 'System', desc: 'Health status' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mavyx-card text-center space-y-2 hover:border-amber-500/30 transition-all"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>
                  {item.label}
                </p>
                <p className="text-xs" style={{ color: '#8888A0' }}>
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
