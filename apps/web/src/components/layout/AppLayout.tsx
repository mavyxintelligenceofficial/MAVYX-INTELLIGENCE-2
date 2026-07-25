'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * Mavyx Intelligence — Institutional Layout
 * Per MEIDS Chapter 5 §5.5: Five permanent zones
 *
 * The right AI Panel only shows on the Workspace page.
 * Other pages use the full center area.
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

interface AppLayoutProps {
  children: React.ReactNode;
  /** If true, layout uses 3-column grid (sidebar + workspace + panel). Otherwise 2-column. */
  hasPanel?: boolean;
}

export default function AppLayout({ children, hasPanel = false }: AppLayoutProps) {
  const pathname = usePathname();

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '48px 1fr 28px',
      gridTemplateColumns: hasPanel ? '200px 1fr' : '200px 1fr',
      gridTemplateAreas: hasPanel
        ? '"topbar topbar" "sidebar main" "bottombar bottombar"'
        : '"topbar topbar" "sidebar main" "bottombar bottombar"',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>
      {/* ─── Top Intelligence Bar ─────────────────────────────── */}
      <header className="mavyx-topbar" style={{ gridArea: 'topbar' }}>
        <div className="mavyx-topbar-section">
          <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={22} height={22} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Mavyx</span>
          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
          <TopBarItem label="SESSION" value={getCurrentSession()} />
          <TopBarItem label="STATUS" value="ACTIVE" valueColor="var(--green)" />
        </div>
        <div className="mavyx-topbar-section">
          <TopBarItem label="TIME" value={new Date().toLocaleTimeString('en-US', { hour12: false })} />
          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
          <div className="mavyx-topbar-item">
            <span style={{ color: 'var(--green)', fontSize: 7 }}>●</span>
            <span style={{ fontSize: 11 }}>AI Ready</span>
          </div>
        </div>
      </header>

      {/* ─── Left Sidebar ─────────────────────────────────────── */}
      <nav style={{ gridArea: 'sidebar', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '6px 0', overflow: 'hidden' }}>
        <div style={{ padding: '2px 12px 8px' }}>
          <div className="text-label" style={{ fontSize: 8, marginBottom: 0 }}>Navigation</div>
        </div>

        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}
            className={`mavyx-nav-item ${pathname === item.href ? 'active' : ''}`}
            style={{ padding: '8px 12px', fontSize: 12 }}>
            <span className="icon" style={{ width: 16, fontSize: 13 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="mavyx-nav-divider" style={{ margin: '6px 12px' }} />

        {NAV_BOTTOM.map((item) => (
          <Link key={item.href} href={item.href}
            className={`mavyx-nav-item ${pathname === item.href ? 'active' : ''}`}
            style={{ padding: '8px 12px', fontSize: 12 }}>
            <span className="icon" style={{ width: 16, fontSize: 13 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <div style={{ flex: 1 }} />
        <div className="mavyx-nav-divider" style={{ margin: '6px 12px' }} />
        <Link href="/profile" className={`mavyx-nav-item ${pathname === '/profile' ? 'active' : ''}`}
          style={{ padding: '8px 12px', fontSize: 12 }}>
          <span className="icon" style={{ width: 16, fontSize: 13 }}>◎</span>
          <span>Profile</span>
        </Link>
      </nav>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main style={{ gridArea: 'main', background: 'var(--bg-primary)', overflow: 'hidden', padding: 10, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      {/* ─── Bottom Intelligence Dock ─────────────────────────── */}
      <footer className="mavyx-bottombar" style={{ gridArea: 'bottombar' }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ fontSize: 10 }}>Market: <span style={{ color: 'var(--green)' }}>Open</span></span>
          <span style={{ fontSize: 10 }}>AI: <span style={{ color: 'var(--green)' }}>11 Agents</span></span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ fontSize: 10 }}>v1.0.0</span>
          <span style={{ fontSize: 10 }}>Mavyx Intelligence</span>
        </div>
      </footer>
    </div>
  );
}

function TopBarItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="mavyx-topbar-item">
      <span className="text-ghost" style={{ fontSize: 9 }}>{label}</span>
      <span className="value" style={{ color: valueColor, fontSize: 11 }}>{value}</span>
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
