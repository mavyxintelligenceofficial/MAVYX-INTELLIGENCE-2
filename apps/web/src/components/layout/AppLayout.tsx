'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * Mavyx Intelligence — Institutional Layout
 * Matches reference design exactly:
 * - Left sidebar (narrow, icons only)
 * - Top bar (logo, pair, session, time)
 * - Main content area
 * - Bottom status bar
 */

const NAV_ITEMS = [
  { href: '/dashboard', icon: '▦', label: 'Dashboard' },
  { href: '/workspace', icon: '◈', label: 'Workspace' },
  { href: '/markets', icon: '◇', label: 'Markets' },
  { href: '/watchlist', icon: '◻', label: 'Watchlist' },
  { href: '/journal', icon: '◫', label: 'Journal' },
  { href: '/analytics', icon: '◬', label: 'Analytics' },
  { href: '/notifications', icon: '🔔', label: 'Alerts' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '44px 1fr 24px',
      gridTemplateColumns: '56px 1fr',
      gridTemplateAreas: '"topbar topbar" "sidebar main" "bottombar bottombar"',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#050508',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* ─── Top Bar ──────────────────────────────────────────── */}
      <header style={{
        gridArea: 'topbar',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#0A0A10',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={20} height={20} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.1em' }}>MAVYX</span>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />
          <span style={{ fontSize: 11, color: '#585868' }}>EUR/USD</span>
          <span style={{ fontSize: 11, color: '#585868' }}>4H</span>
          <span style={{ fontSize: 11, color: '#34C759' }}>● Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10, color: '#484858' }}>{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
          <span style={{ fontSize: 10, color: '#34C759' }}>● AI Ready</span>
        </div>
      </header>

      {/* ─── Sidebar ──────────────────────────────────────────── */}
      <nav style={{
        gridArea: 'sidebar',
        background: '#08080E',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0',
        gap: 2,
      }}>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}
            title={item.label}
            style={{
              width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              fontSize: 16,
              color: pathname === item.href ? '#C9A84C' : '#585868',
              background: pathname === item.href ? 'rgba(201,168,76,0.08)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}>
            {item.icon}
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        <Link href="/settings" title="Settings"
          style={{
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, fontSize: 16,
            color: pathname === '/settings' ? '#C9A84C' : '#585868',
            background: pathname === '/settings' ? 'rgba(201,168,76,0.08)' : 'transparent',
            textDecoration: 'none',
          }}>⚙</Link>
        <Link href="/profile" title="Profile"
          style={{
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, fontSize: 16,
            color: pathname === '/profile' ? '#C9A84C' : '#585868',
            background: pathname === '/profile' ? 'rgba(201,168,76,0.08)' : 'transparent',
            textDecoration: 'none',
          }}>◎</Link>
      </nav>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main style={{
        gridArea: 'main',
        background: '#050508',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </main>

      {/* ─── Bottom Bar ───────────────────────────────────────── */}
      <footer style={{
        gridArea: 'bottombar',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#0A0A10',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 10,
        color: '#383848',
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>Market: <span style={{ color: '#34C759' }}>Open</span></span>
          <span>AI: <span style={{ color: '#34C759' }}>14 Agents</span></span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>v1.0.0</span>
          <span>Mavyx Intelligence</span>
        </div>
      </footer>
    </div>
  );
}
