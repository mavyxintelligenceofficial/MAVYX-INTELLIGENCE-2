'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/features/auth/store';
import '@/app/mavyx-ui.css';

/**
 * Shared App Layout — used by all pages except login/signup
 * Top Intelligence Bar + Left Sidebar + Main Content + Bottom Dock
 */

const NAV_ITEMS = [
  { section: 'Intelligence', items: [
    { href: '/dashboard', icon: '▦', label: 'Dashboard' },
    { href: '/workspace', icon: '◈', label: 'Workspace' },
    { href: '/markets', icon: '◇', label: 'Markets' },
    { href: '/analysis', icon: '⚡', label: 'AI Analysis' },
  ]},
  { section: 'Records', items: [
    { href: '/journal', icon: '📖', label: 'Trade Journal' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
    { href: '/watchlist', icon: '⭐', label: 'Watchlist' },
  ]},
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().substr(11, 8) + ' UTC');
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const initials = (user?.fullName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {/* ═══ TOP INTELLIGENCE BAR ═══ */}
      <header className="topbar">
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/brand/Mavyx-LOGO.png" alt="Mavyx" width={22} height={22} />
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        </div>

        <div className="topbar-chips">
          <div className="topbar-chip"><span className="dot" /> London Session</div>
          <div className="topbar-chip">{clock}</div>
          <div className="topbar-chip"><span className="dot" /> Connected</div>
          <div className="topbar-chip"><span className="dot amber" /> Market Open</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div className="ai-status-pill">
            <span className="pulse" />
            AI Ready
          </div>
          <div className="avatar-btn" onClick={() => router.push('/settings')} style={{ cursor: 'pointer' }}>
            {initials}
          </div>
        </div>
      </header>

      {/* ═══ MAIN: Sidebar + Content ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 0 }}>
        {/* ─── Sidebar ──────────────────────────────── */}
        <nav className="sidebar">
          {NAV_ITEMS.map(group => (
            <div key={group.section}>
              <div className="nav-group-label">{group.section}</div>
              {group.items.map(item => (
                <a key={item.href}
                  className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => router.push(item.href)}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          ))}

          <div style={{ flex: 1 }} />
          <div className="sidebar-footer">
            <a className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
              onClick={() => router.push('/settings')}>
              <span>⚙</span><span>Settings</span>
            </a>
            <a className="nav-item" onClick={() => { logout(); router.push('/login'); }}>
              <span>⏻</span><span>Logout</span>
            </a>
          </div>
        </nav>

        {/* ─── Main Content ─────────────────────────── */}
        <main style={{ overflow: 'auto', background: 'var(--bg)', padding: 24 }}>
          {children}
        </main>
      </div>

      {/* ═══ BOTTOM DOCK ═══ */}
      <footer className="dock">
        <div className="dock-item up">DXY <b>▲ 104.21</b></div>
        <div className="dock-item down">SPX <b>▼ 5,412</b></div>
        <div className="dock-item up">Gold <b>▲ 2,401</b></div>
        <div className="dock-item">10Y Yield <b>4.28%</b></div>
        <div className="dock-spacer" />
        <div className="dock-item">Agents Online <b>14/14</b></div>
        <div className="dock-item"><span className="dot" style={{ display: 'inline-block' }} /> All Systems Nominal</div>
      </footer>
    </div>
  );
}
