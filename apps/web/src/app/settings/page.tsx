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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);
  useEffect(() => {
    if (!token) return;
    getProfile(token).then(p => { setProfile(p); setDisplayName(p.displayName || ''); });
    // Load notification preference
    const notifPref = localStorage.getItem('mavyx_notifications');
    if (notifPref !== null) setNotificationsEnabled(notifPref === 'true');
    // Load API key
    const savedKey = localStorage.getItem('mavyx_twelvedata_key');
    if (savedKey) setApiKey(savedKey);
  }, [token]);

  async function handleSave() {
    if (!token) return;
    try {
      const updated = await updateProfile(token, { displayName });
      setProfile(updated); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }

  function handleNotificationToggle() {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    localStorage.setItem('mavyx_notifications', String(newVal));
  }

  async function handleSaveApiKey() {
    localStorage.setItem('mavyx_twelvedata_key', apiKey);
    // Also send to market service so it can use the key
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${API_URL}/market/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
    } catch (e) {
      console.log('Could not update market service API key:', e);
    }
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  }

  if (!isHydrated || !token) return null;

  return (
    <AppLayout>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Settings</h1>

        {/* Account */}
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

        {/* Market Data API Key */}
        <div className="tc-card" style={{ marginBottom: 12, padding: 16 }}>
          <div className="tc-label" style={{ marginBottom: 12 }}>Market Data (Twelve Data API)</div>
          <p style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 12 }}>
            Get your free API key at <a href="https://twelvedata.com/" target="_blank" style={{ color: 'var(--gold)' }}>twelvedata.com</a>
          </p>
          <div style={{ marginBottom: 12 }}>
            <label className="tc-label" style={{ display: 'block', marginBottom: 6 }}>API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your Twelve Data API key"
              className="chat-input" style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleSaveApiKey} className="analyze-btn">Save API Key</button>
            {apiKeySaved && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ Saved</span>}
          </div>
        </div>

        {/* Notifications */}
        <div className="tc-card" style={{ marginBottom: 12, padding: 16 }}>
          <div className="tc-label" style={{ marginBottom: 12 }}>Notifications</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Enable Notifications</p>
              <p style={{ fontSize: 11, color: 'var(--text-mute)' }}>Receive alerts for market opportunities and system issues</p>
            </div>
            <button onClick={handleNotificationToggle} style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: notificationsEnabled ? 'var(--gold)' : 'var(--gray-dim)',
              position: 'relative', transition: 'all 0.2s',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3, left: notificationsEnabled ? 25 : 3,
                transition: 'all 0.2s',
              }} />
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="tc-card" style={{ marginBottom: 12, padding: 16 }}>
          <div className="tc-label" style={{ marginBottom: 12 }}>Security</div>
          <div style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.8 }}>
            <p>Session: <span style={{ color: 'var(--green)' }}>Active</span></p>
            <p>MFA: Not configured</p>
            <p>Role: {profile?.role || 'STANDARD'}</p>
          </div>
        </div>

        {/* Danger Zone */}
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
