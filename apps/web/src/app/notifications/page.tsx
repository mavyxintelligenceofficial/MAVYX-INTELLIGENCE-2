'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Notification Center — Per MEIDS Chapter 15
 * "Notifications are not interruptions. They are carefully timed
 *  executive briefings designed to deliver the right information,
 *  to the right person, at the right moment."
 */

export default function NotificationsPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  // Generate notifications from journal entries
  const notifications = ai.journal.slice(0, 10).map((entry, i) => ({
    id: entry.id,
    type: i === 0 ? 'analysis' : i < 3 ? 'market' : 'info',
    priority: i === 0 ? 'high' : i < 3 ? 'medium' : 'low',
    title: i === 0 ? `New Analysis: ${entry.symbol}` : i < 3 ? `${entry.symbol} Analysis Complete` : `Journal Entry: ${entry.symbol}`,
    message: `${entry.recommendation?.toUpperCase()} with ${entry.confidence}% confidence`,
    timestamp: entry.timestamp,
    read: i > 2,
  }));

  return (
    <AppLayout>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ marginBottom: 16 }}>Notifications</h1>

        {notifications.length === 0 ? (
          <div className="mavyx-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 28, color: 'var(--text-ghost)', marginBottom: 12 }}>🔔</div>
            <h2 style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>No notifications</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Notifications will appear when you run analyses, receive AI insights, or when market conditions change.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notifications.map(notif => (
              <div key={notif.id} className="mavyx-card" style={{
                opacity: notif.read ? 0.6 : 1,
                borderLeft: notif.priority === 'high' ? '3px solid var(--gold)' : notif.priority === 'medium' ? '3px solid var(--blue)' : '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{notif.title}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-ghost)' }}>{new Date(notif.timestamp).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{notif.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
