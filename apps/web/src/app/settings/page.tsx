'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { getProfile, updateProfile } from '@/features/profile/api';
import AppLayout from '@/components/layout/AppLayout';

export default function SettingsPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);
  useEffect(() => {
    if (!token) return;
    getProfile(token).then(p => { setProfile(p); setDisplayName(p.displayName || ''); });
  }, [token]);

  async function handleSave() {
    if (!token) return;
    try {
      const updated = await updateProfile(token, { displayName });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 500 }}>
        <h1 style={{ marginBottom: 20 }}>Settings</h1>

        <div className="mavyx-card" style={{ marginBottom: 12 }}>
          <div className="text-label" style={{ marginBottom: 12 }}>Account</div>
          <div style={{ marginBottom: 12 }}>
            <label className="text-label" style={{ display: 'block', marginBottom: 4, fontSize: 10 }}>Display Name</label>
            <input type="text" value={displayName} onChange={e => { setDisplayName(e.target.value); setSaved(false); }} className="mavyx-input" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="text-label" style={{ display: 'block', marginBottom: 4, fontSize: 10 }}>Email</label>
            <input type="text" value={profile?.email || ''} className="mavyx-input" disabled style={{ opacity: 0.5 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="text-label" style={{ display: 'block', marginBottom: 4, fontSize: 10 }}>Role</label>
            <input type="text" value={profile?.role || ''} className="mavyx-input" disabled style={{ opacity: 0.5 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} className="mavyx-btn mavyx-btn-primary">Save Changes</button>
            {saved && <span style={{ fontSize: 12, color: 'var(--green)', alignSelf: 'center' }}>Saved</span>}
          </div>
        </div>

        <div className="mavyx-card" style={{ marginBottom: 12 }}>
          <div className="text-label" style={{ marginBottom: 12 }}>Security</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p>Session: Active</p>
            <p>MFA: Not configured</p>
            <p>Last password change: Unknown</p>
          </div>
        </div>

        <div className="mavyx-card">
          <div className="text-label" style={{ marginBottom: 12 }}>Danger Zone</div>
          <button onClick={() => { logout(); router.push('/login'); }} className="mavyx-btn mavyx-btn-secondary" style={{ color: 'var(--red)', borderColor: 'rgba(255,59,48,0.3)' }}>
            Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
