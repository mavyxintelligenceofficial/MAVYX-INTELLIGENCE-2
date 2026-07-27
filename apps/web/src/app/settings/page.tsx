'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { getProfile, updateProfile } from '@/features/profile/api';
import AppLayout from '@/components/AppLayout';

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
      setProfile(updated); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }

  if (!isHydrated || !token) return null;

  return (
    <AppLayout>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Settings</h1>

        <div className="tc-card" style={{ marginBottom: 12, padding: 16 }}>
          <div className="tc-label" style={{ marginBottom: 12 }}>Account</div>
          <div style={{ marginBottom: 12 }}>
            <label className="tc-label" style={{ display: 'block', marginBottom: 6 }}>Display Name</label>
            <input type="text" value={displayName} onChange={e => { setDisplayName(e.target.value); setSaved(false); }}
              className="chat-input" style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="tc-label" style={{ display: 'block', marginBottom: 6 }}>Email</label>
            <input type="text" value={profile?.email || ''} className="chat-input" style={{ width: '100%', opacity: 0.5 }} disabled />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleSave} className="analyze-btn">Save Changes</button>
            {saved && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ Saved</span>}
          </div>
        </div>

        <div className="tc-card" style={{ marginBottom: 12, padding: 16 }}>
          <div className="tc-label" style={{ marginBottom: 12 }}>Security</div>
          <div style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.8 }}>
            <p>Session: <span style={{ color: 'var(--green)' }}>Active</span></p>
            <p>MFA: Not configured</p>
            <p>Role: {profile?.role || 'STANDARD'}</p>
          </div>
        </div>

        <div className="tc-card" style={{ padding: 16 }}>
          <div className="tc-label" style={{ marginBottom: 12 }}>Danger Zone</div>
          <button onClick={() => { logout(); router.push('/login'); }}
            style={{ padding: '8px 16px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(178,74,68,0.3)', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
