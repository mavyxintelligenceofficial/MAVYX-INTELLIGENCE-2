'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { apiRequest } from '@/services/api-client';
import '@/app/mavyx-ui.css';

interface ServiceHealth {
  status: string;
  latency_ms?: number;
  error?: string;
}

interface SystemHealth {
  status: string;
  services: Record<string, ServiceHealth>;
  timestamp: number;
}

export default function HealthPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate, logout } = useAuthStore();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  useEffect(() => {
    if (!token) return;
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [token]);

  async function checkHealth() {
    try {
      const data = await apiRequest<SystemHealth>('/ai/health/system');
      setHealth(data);
    } catch {
      setHealth(null);
    } finally { setIsLoading(false); }
  }

  if (!isHydrated || !token) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <a onClick={() => router.push('/workspace')} style={{ cursor: 'pointer', fontSize: 11, color: 'var(--text-mute)' }}>← Back to Workspace</a>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>System Health</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={checkHealth} className="analyze-btn" style={{ padding: '6px 14px', fontSize: 11 }}>Refresh</button>
            <button onClick={() => { logout(); router.push('/login'); }} className="analyze-btn" style={{ padding: '6px 14px', fontSize: 11 }}>Logout</button>
          </div>
        </div>

        {isLoading ? (
          <div className="tc-card" style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ fontSize: 12, color: 'var(--text-mute)' }}>Checking services...</p>
          </div>
        ) : health ? (
          <>
            <div className="tc-card" style={{ marginBottom: 12, padding: 16, borderColor: health.status === 'healthy' ? 'rgba(63,166,107,0.3)' : 'rgba(201,135,63,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`dot ${health.status === 'healthy' ? '' : 'amber'}`} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>System {health.status === 'healthy' ? 'Healthy' : 'Degraded'}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-mute)' }}>Last checked: {new Date(health.timestamp * 1000).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(health.services).map(([name, svc]) => (
                <div key={name} className="tc-card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`dot ${svc.status === 'healthy' ? '' : svc.status === 'unreachable' ? 'red' : 'amber'}`} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: svc.status === 'healthy' ? 'var(--green)' : 'var(--red)' }}>{svc.status}</span>
                      {svc.latency_ms !== undefined && <span style={{ fontSize: 10, color: 'var(--text-mute)', marginLeft: 8 }}>{svc.latency_ms}ms</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="tc-card" style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ fontSize: 12, color: 'var(--text-mute)' }}>Unable to fetch system health</p>
          </div>
        )}
      </div>
    </div>
  );
}
