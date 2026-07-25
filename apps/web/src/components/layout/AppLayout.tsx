'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * Mavyx Intelligence — Institutional Layout
 * Per MEIDS Chapter 5 §5.5: Five permanent zones
 */

const NAV_ITEMS = [
  { href: '/dashboard', icon: '▦', label: 'Dashboard' },
  { href: '/workspace', icon: '◈', label: 'Workspace' },
  { href: '/markets', icon: '◇', label: 'Markets' },
  { href: '/watchlist', icon: '◻', label: 'Watchlist' },
  { href: '/journal', icon: '◫', label: 'Journal' },
  { href: '/analytics', icon: '◬', label: 'Analytics' },
];

const NAV_BOTTOM = [
  { href: '/settings', icon: '⚙', label: 'Settings' },
  { href: '/health', icon: '⊕', label: 'System' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mavyx-layout">
      {/* ─── Top Intelligence Bar ─────────────────────────────── */}
      <header className="mavyx-topbar">
        <div className="mavyx-topbar-section">
          <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={24} height={24} />
          <span className="text-label text-gold" style={{ fontSize: 11, letterSpacing: '0.15em' }}>MAVYX</span>
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
          <TopBarItem label="PAIR" value="EUR/USD" />
          <TopBarItem label="SESSION" value={getCurrentSession()} />
          <TopBarItem label="STATUS" value="ACTIVE" valueColor="var(--green)" />
        </div>
        <div className="mavyx-topbar-section">
          <TopBarItem label="TIME" value={new Date().toLocaleTimeString('en-US', { hour12: false })} />
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
          <div className="mavyx-topbar-item">
            <span style={{ color: 'var(--green)', fontSize: 8 }}>●</span>
            <span>AI Ready</span>
          </div>
        </div>
      </header>

      {/* ─── Left Sidebar ─────────────────────────────────────── */}
      <nav className="mavyx-sidebar">
        <div style={{ padding: '4px 16px 12px' }}>
          <div className="text-label" style={{ fontSize: 9, marginBottom: 2 }}>Intelligence</div>
        </div>

        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}
            className={`mavyx-nav-item ${pathname === item.href ? 'active' : ''}`}>
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="mavyx-nav-divider" />

        {NAV_BOTTOM.map((item) => (
          <Link key={item.href} href={item.href}
            className={`mavyx-nav-item ${pathname === item.href ? 'active' : ''}`}>
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <div style={{ flex: 1 }} />
        <div className="mavyx-nav-divider" />
        <Link href="/profile" className={`mavyx-nav-item ${pathname === '/profile' ? 'active' : ''}`}>
          <span className="icon">◎</span>
          <span>Profile</span>
        </Link>
      </nav>

      {/* ─── Executive Workspace ──────────────────────────────── */}
      <main className="mavyx-workspace">
        {children}
      </main>

      {/* ─── AI Intelligence Panel ────────────────────────────── */}
      <aside className="mavyx-panel">
        <div className="mavyx-panel-header">
          <span className="text-label text-gold" style={{ fontSize: 10 }}>Intelligence Panel</span>
        </div>
        <div className="mavyx-panel-content">
          <div className="text-ghost" style={{ fontSize: 12, textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.3 }}>⬡</div>
            <p>Select a market and run an analysis from the Workspace to see the Executive Intelligence Brief here.</p>
          </div>
        </div>
      </aside>

      {/* ─── Bottom Intelligence Dock ─────────────────────────── */}
      <footer className="mavyx-bottombar">
        <div style={{ display: 'flex', gap: 16 }}>
          <span>Market: <span style={{ color: 'var(--green)' }}>Open</span></span>
          <span>AI: <span style={{ color: 'var(--green)' }}>11 Agents Ready</span></span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>v1.0.0</span>
          <span>Mavyx Intelligence</span>
        </div>
      </footer>
    </div>
  );
}

function TopBarItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="mavyx-topbar-item">
      <span className="text-ghost" style={{ fontSize: 10 }}>{label}</span>
      <span className="value" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

function getCurrentSession(): string {
  const hour = new Date().getUTCHours();
  if (hour >= 21 || hour < 6) return 'SYDNEY';
  if (hour >= 6 && hour < 8) return 'TOKYO';
  if (hour >= 8 && hour < 16) return 'LONDON';
  if (hour >= 12 && hour < 21) return 'NEW YORK';
  return 'LONDON';
}
