'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/features/auth/store';
import '@/app/mavyx-ui.css';

const NAV_ITEMS = [
  { section: 'Intelligence', items: [
    { href: '/dashboard', icon: '▦', label: 'Dashboard' },
    { href: '/workspace', icon: '◈', label: 'Workspace' },
    { href: '/markets', icon: '◇', label: 'Markets' },
  ]},
  { section: 'Records', items: [
    { href: '/journal', icon: '📖', label: 'Trade Journal' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
    { href: '/watchlist', icon: '⭐', label: 'Watchlist' },
  ]},
];

const ALL_PAGES = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Workspace', href: '/workspace' },
  { label: 'Markets', href: '/markets' },
  { label: 'Trade Journal', href: '/journal' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Watchlist', href: '/watchlist' },
  { label: 'Settings', href: '/settings' },
  { label: 'System Health', href: '/health' },
];

const MARKET_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'XAU/USD'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [clock, setClock] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ label: string; href?: string; action?: () => void }>>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().substr(11, 8) + ' UTC');
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load notification preference
  useEffect(() => {
    const pref = localStorage.getItem('mavyx_notifications');
    if (pref !== null) setNotificationsEnabled(pref === 'true');
  }, []);

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: Array<{ label: string; href?: string; action?: () => void }> = [];

    // Search pages
    ALL_PAGES.forEach(p => {
      if (p.label.toLowerCase().includes(q)) {
        results.push({ label: p.label, href: p.href });
      }
    });

    // Search market pairs
    MARKET_PAIRS.forEach(pair => {
      if (pair.toLowerCase().includes(q)) {
        results.push({
          label: `Analyze ${pair}`,
          action: () => { router.push('/workspace'); }
        });
      }
    });

    setSearchResults(results.slice(0, 8));
  }, [searchQuery, router]);

  const initials = (user?.fullName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {/* ═══ SEARCH MODAL ═══ */}
      {searchOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh',
        }} onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
          <div style={{
            width: 480, background: 'var(--bg-card)', border: '1px solid var(--gold-line)',
            borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-mute)' }}>🔍</span>
              <input ref={searchInputRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search markets, pages, journal..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                autoFocus />
              <kbd style={{ fontSize: 10, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', color: 'var(--text-mute)' }}>ESC</kbd>
            </div>
            {searchResults.length > 0 && (
              <div style={{ padding: 8, maxHeight: 300, overflowY: 'auto' }}>
                {searchResults.map((r, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => {
                      if (r.href) router.push(r.href);
                      if (r.action) r.action();
                      setSearchOpen(false); setSearchQuery('');
                    }}>
                    <span style={{ color: 'var(--text-mute)', fontSize: 11 }}>→</span>
                    {r.label}
                  </div>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--text-mute)' }}>
                No results found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}

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

        {/* Search Bar */}
        <div className="search-bar" onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }} style={{ cursor: 'pointer' }}>
          <span>🔍</span>
          <span>Search markets, journal, docs…</span>
          <kbd style={{ marginLeft: 'auto', fontSize: 10, border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-mute)' }}>⌘K</kbd>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div className="ai-status-pill">
            <span className="pulse" />
            AI Ready
          </div>
          {/* Notification Bell */}
          <button style={{
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '1px solid transparent', color: 'var(--text-soft)', cursor: 'pointer',
          }} onClick={() => {
            if (notificationsEnabled) {
              // Show notification toast
              const toast = document.createElement('div');
              toast.className = 'toast';
              toast.innerHTML = '<span class="dot"></span> No new notifications';
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 3000);
            }
          }}>
            🔔
          </button>
          <div className="avatar-btn" onClick={() => router.push('/settings')} style={{ cursor: 'pointer' }}>
            {initials}
          </div>
        </div>
      </header>

      {/* ═══ MAIN: Sidebar + Content ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 0 }}>
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
