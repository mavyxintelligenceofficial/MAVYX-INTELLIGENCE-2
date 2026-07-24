'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, updateProfile } from '@/features/profile/api';
import { Profile } from '@/features/profile/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';
import AppLayout from '@/components/layout/AppLayout';

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

  async function handleSave(e: FormEvent) {
    e.preventDefault();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="text-ghost">Loading profile...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ marginBottom: 24 }}>Profile</h1>

        {/* User Info */}
        <div className="mavyx-card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 4,
            background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: 'var(--gold)',
          }}>
            {(profile?.displayName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{profile?.displayName || 'User'}</div>
            <div className="text-caption">{profile?.role}</div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="mavyx-card" style={{ marginBottom: 16 }}>
          {error && <div style={{ marginBottom: 12, padding: '6px 10px', background: 'var(--red-dim)', borderRadius: 4, fontSize: 12, color: 'var(--red)' }}>{error}</div>}
          {saved && <div style={{ marginBottom: 12, padding: '6px 10px', background: 'var(--green-dim)', borderRadius: 4, fontSize: 12, color: 'var(--green)' }}>✓ Saved</div>}

          <div style={{ marginBottom: 16 }}>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Display Name</label>
            <input type="text" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }}
              maxLength={100} className="mavyx-input" placeholder="Enter your name" />
          </div>

          <button type="submit" disabled={isSaving} className="mavyx-btn mavyx-btn-primary" style={{ width: '100%' }}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { logout(); router.push('/login'); }} className="mavyx-btn mavyx-btn-secondary" style={{ flex: 1 }}>
            Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
