'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { getQuote } from '@/features/market/api';
import { analyzeSymbol, chatWithAssistant } from '@/features/ai/api';
import type { Quote } from '@/features/market/types';
import dynamic from 'next/dynamic';
import '@/app/mavyx-ui.css';

const TradingViewChart = dynamic(() => import('@/components/CandlestickChart'), { ssr: false });

const TIMEFRAMES = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: 'Daily' },
  { value: '1w', label: 'Weekly' },
  { value: '1M', label: 'Monthly' },
];

const OVERLAYS = [
  { label: 'Market Structure', color: '#D4AF37', on: true },
  { label: 'Liquidity', color: '#4E8FD9', on: true },
  { label: 'Order Blocks', color: '#4E8FD9', on: true },
  { label: 'Fair Value Gaps', color: '#8B8D93', on: false },
  { label: 'Break of Structure', color: '#8B8D93', on: false },
  { label: 'Change of Character', color: '#8B8D93', on: false },
  { label: 'Premium/Discount', color: '#8B8D93', on: false },
  { label: 'Session Boundaries', color: '#8B8D93', on: false },
  { label: 'Institutional Targets', color: '#8B8D93', on: false },
  { label: 'Invalidation Levels', color: '#8B8D93', on: false },
];

export default function WorkspacePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate, user, logout } = useAuthStore();
  const ai = useAIStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [activeTab, setActiveTab] = useState<'brief' | 'evidence' | 'chat' | 'alerts'>('brief');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [overlays, setOverlays] = useState(OVERLAYS);
  const [clock, setClock] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().substr(11, 8) + ' UTC');
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live price
  useEffect(() => {
    if (!token) return;
    getQuote(token, ai.symbol).then(setQuote).catch(() => {});
    const interval = setInterval(() => {
      getQuote(token, ai.symbol).then(setQuote).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [token, ai.symbol]);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ai.chatMessages]);

  async function handleAnalyze() {
    if (!token || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const data = await analyzeSymbol(token, ai.symbol, ai.timeframe);
      ai.setResult(data);
      setActiveTab('brief');
    } catch (err: any) {
      ai.setError(err?.message || 'Analysis failed');
    } finally { setIsAnalyzing(false); }
  }

  async function handleChatSend() {
    if (!chatInput.trim() || !token) return;
    const msg = chatInput.trim();
    setChatInput('');
    ai.addChatMessage({ role: 'user', text: msg });
    try {
      const ctx: any = { symbol: ai.symbol, timeframe: ai.timeframe, user_name: user?.fullName };
      if (ai.result) ctx.analysis_result = { symbol: ai.result.symbol, recommendation: ai.result.recommendation, confidence: ai.result.confidence };
      const res = await chatWithAssistant(token, msg, ai.chatMessages, ctx);
      ai.addChatMessage({ role: 'assistant', text: res.response });
    } catch {
      ai.addChatMessage({ role: 'assistant', text: 'Connection issue. Try again.' });
    }
  }

  function toggleOverlay(index: number) {
    setOverlays(prev => prev.map((o, i) => i === index ? { ...o, on: !o.on } : o));
  }

  if (!isHydrated || !token) return null;

  const initials = (user?.fullName || user?.email || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {/* ═══ TOP INTELLIGENCE BAR ═══ */}
      <header className="topbar">
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/brand/Mavyx-LOGO.png" alt="Mavyx" width={22} height={22} />
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        </div>

        <div className="topbar-pair" style={{ flexShrink: 0 }}>
          <span className="sym">{ai.symbol}</span>
          <span className="px">{quote?.price?.toString() || '—'}</span>
        </div>

        <div className="topbar-chips">
          <div className="topbar-chip"><span className="dot" /> London Session</div>
          <div className="topbar-chip">{clock}</div>
          <div className="topbar-chip"><span className="dot" /> Connected</div>
          <div className="topbar-chip"><span className="dot amber" /> Market Open</div>
        </div>

        <div className="search-bar">
          <span>🔍</span>
          <span>Search markets, journal, docs…</span>
          <kbd style={{ marginLeft: 'auto', fontSize: 10, border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-mute)' }}>⌘K</kbd>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div className="ai-status-pill">
            <span className="pulse" />
            AI Ready
          </div>
          <div className="avatar-btn">{initials}</div>
        </div>
      </header>

      {/* ═══ MAIN: Sidebar / Workspace / AI Panel ═══ */}
      <div className="app-main">
        {/* ─── Sidebar ──────────────────────────────────────────── */}
        <nav className="sidebar">
          <div className="nav-group-label">Intelligence</div>
          <a className="nav-item" onClick={() => router.push('/dashboard')}><span>▦</span> Dashboard</a>
          <a className="nav-item" onClick={() => router.push('/markets')}><span>◇</span> Markets</a>
          <a className="nav-item active"><span>◈</span> Workspace</a>
          <a className="nav-item" onClick={() => setActiveTab('brief')}><span>📄</span> Executive Brief</a>
          <a className="nav-item" onClick={() => setActiveTab('chat')}><span>💬</span> AI Chat</a>

          <div className="nav-group-label">Records</div>
          <a className="nav-item" onClick={() => router.push('/journal')}><span>📖</span> Trade Journal</a>
          <a className="nav-item" onClick={() => router.push('/analytics')}><span>📊</span> Analytics</a>
          <a className="nav-item" onClick={() => router.push('/watchlist')}><span>⭐</span> Watchlist</a>

          <div style={{ flex: 1 }} />
          <div className="sidebar-footer">
            <a className="nav-item" onClick={() => router.push('/settings')}><span>⚙</span> Settings</a>
            <a className="nav-item" onClick={() => { logout(); router.push('/login'); }}><span>⏻</span> Logout</a>
          </div>
        </nav>

        {/* ─── Executive Workspace (Chart) ──────────────────────── */}
        <main className="workspace">
          {/* Chart Toolbar */}
          <div className="chart-toolbar">
            <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Timeframe</span>
            <div className="tf-group">
              {TIMEFRAMES.map(tf => (
                <button key={tf.value}
                  className={`tf-btn ${ai.timeframe === tf.value ? 'active' : ''}`}
                  onClick={() => ai.setTimeframe(tf.value)}>
                  {tf.label}
                </button>
              ))}
            </div>
            <button className={`analyze-btn ${isAnalyzing ? 'busy' : ''}`} onClick={handleAnalyze}>
              {isAnalyzing ? '⏳ Analyzing…' : '⚡ Analyze'}
            </button>
          </div>

          {/* Overlay Toggles */}
          <div className="overlay-toggles">
            {overlays.map((o, i) => (
              <span key={o.label} className={`chip ${o.on ? 'on' : ''}`} onClick={() => toggleOverlay(i)}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: o.color }} />
                {o.label}
              </span>
            ))}
          </div>

          {/* Chart Area */}
          <div className="chart-area">
            <TradingViewChart symbol={ai.symbol} />
          </div>

          {/* Trade Controls */}
          <div className="trade-controls">
            {ai.result?.suggested_action?.entry_zone && ai.result.suggested_action.entry_zone !== 'N/A' ? (
              <>
                <div className="tc-card">
                  <div className="tc-label">Suggested Entry Zone</div>
                  <div className="tc-value entry">{ai.result.suggested_action.entry_zone}</div>
                </div>
                <div className="tc-card">
                  <div className="tc-label">Suggested Stop Area</div>
                  <div className="tc-value stop">{ai.result.suggested_action.stop_loss || '—'}</div>
                </div>
                <div className="tc-card">
                  <div className="tc-label">Suggested Target Area</div>
                  <div className="tc-value target">{ai.result.suggested_action.take_profit_1 || '—'}</div>
                </div>
                <div className="tc-card">
                  <div className="tc-label">Confidence</div>
                  <div className="tc-value rr">{ai.result.confidence}%</div>
                </div>
              </>
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 8, fontSize: 12, color: 'var(--text-mute)' }}>
                Run an analysis to see suggested trade levels
              </div>
            )}
          </div>
        </main>

        {/* ─── AI Intelligence Panel ────────────────────────────── */}
        <aside className="ai-panel">
          {/* Tabs */}
          <div className="ai-tabs">
            {(['brief', 'evidence', 'chat', 'alerts'] as const).map(tab => (
              <div key={tab} className={`ai-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'brief' ? 'Executive Brief' : tab === 'evidence' ? 'Evidence' : tab === 'chat' ? 'AI Chat' : 'Alerts'}
              </div>
            ))}
          </div>

          {/* Tab Content */}
          <div className="ai-body">
            {activeTab === 'brief' && <ExecutiveBrief result={ai.result} isLoading={isAnalyzing} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} />}
            {activeTab === 'evidence' && <EvidenceTab result={ai.result} setSelectedAgent={setSelectedAgent} setActiveTab={setActiveTab} />}
            {activeTab === 'chat' && <ChatTab messages={ai.chatMessages} chatEndRef={chatEndRef} />}
            {activeTab === 'alerts' && <AlertsTab />}
          </div>

          {/* Chat Input */}
          {activeTab === 'chat' && (
            <div className="chat-input-row">
              <input className="chat-input" value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                placeholder="Ask about this analysis…" />
              <button className="chat-send" onClick={handleChatSend}>Send</button>
            </div>
          )}
        </aside>
      </div>

      {/* ═══ BOTTOM INTELLIGENCE DOCK ═══ */}
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

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function ExecutiveBrief({ result, isLoading, selectedAgent, setSelectedAgent }: any) {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 12 }}>
          {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', opacity: 0.3, animation: `pulse 1.8s ${i * 0.1}s infinite` }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-soft)' }}>Deploying 14 specialist agents…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 28, color: 'var(--text-mute)', marginBottom: 12 }}>⚡</div>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', fontWeight: 700 }}>No active analysis</p>
        <p style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>Click Analyze to deploy specialist agents</p>
      </div>
    );
  }

  const total = (result.agent_consensus?.bullish || 0) + (result.agent_consensus?.bearish || 0) + (result.agent_consensus?.neutral || 0);
  const r = 36, c = 2 * Math.PI * r, offset = c - ((result.confidence || 0) / 100) * c;

  return (
    <>
      {/* Header */}
      <div className="brief-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>Executive Summary</span>
        <span className="bias-badge">
          {result.recommendation === 'buy' ? 'Bullish Bias' : result.recommendation === 'sell' ? 'Bearish Bias' : result.recommendation === 'wait' ? 'Wait' : 'No Trade'}
        </span>
      </div>

      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-soft)' }}>
        {result.executive_summary?.substring(0, 300)}{result.executive_summary?.length > 300 ? '…' : ''}
      </p>

      {/* Confidence Ring */}
      <div className="confidence-block">
        <div className="ring-wrap">
          <svg width="86" height="86" viewBox="0 0 86 86">
            <circle className="ring-track" cx="43" cy="43" r={r} />
            <circle className="ring-fill" cx="43" cy="43" r={r} strokeDasharray={c} strokeDashoffset={offset} />
          </svg>
          <div className="ring-label">
            <span className="num">{result.confidence}%</span>
            <span className="cap">Confidence</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-soft)' }}>
            <span>Evidence Strength</span><b style={{ color: 'var(--text)' }}>{result.successful_agents}/{result.total_agents} agents</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-soft)' }}>
            <span>Processing Time</span><b style={{ color: 'var(--text)' }}>{result.processing_time_ms}ms</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-soft)' }}>
            <span>Consensus</span>
            <b style={{ color: 'var(--green)' }}>{result.agent_consensus?.bullish || 0}B · {result.agent_consensus?.bearish || 0}B · {result.agent_consensus?.neutral || 0}N</b>
          </div>
        </div>
      </div>

      {/* Bull/Bear Cases */}
      {result.key_evidence?.length > 0 && (
        <div className="split-cases">
          <div className="case-card bull">
            <div className="case-title">Supporting Evidence</div>
            <ul>
              {result.key_evidence.slice(0, 3).map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
          <div className="case-card bear">
            <div className="case-title">Risk Factors</div>
            <ul>
              {result.risk_warnings?.slice(0, 3).map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Info Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {result.suggested_action?.entry_zone && (
          <div className="info-line"><span>Suggested Entry</span><b>{result.suggested_action.entry_zone}</b></div>
        )}
        {result.suggested_action?.stop_loss && (
          <div className="info-line danger"><span>Stop Loss</span><b>{result.suggested_action.stop_loss}</b></div>
        )}
        {result.suggested_action?.take_profit_1 && (
          <div className="info-line"><span>Target</span><b>{result.suggested_action.take_profit_1}</b></div>
        )}
      </div>

      {/* Agent Reasoning Panel */}
      {selectedAgent && (
        <div className="agent-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="agent-icon">{selectedAgent.agent_id?.substring(0, 2).toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800 }}>{formatAgent(selectedAgent.agent_id)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>Selected reasoning</div>
            </div>
          </div>
          <div className="agent-field"><div className="lbl">Signal</div><div className="val">{selectedAgent.signal?.toUpperCase()} ({selectedAgent.confidence}%)</div></div>
          <div className="agent-field"><div className="lbl">Summary</div><div className="val">{selectedAgent.summary}</div></div>
        </div>
      )}
    </>
  );
}

function EvidenceTab({ result, setSelectedAgent, setActiveTab }: any) {
  if (!result?.agent_breakdown?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--text-mute)' }}>Run an analysis to see evidence cards</p>
      </div>
    );
  }

  return (
    <>
      <div className="section-label">Specialist Evidence <span>{result.agent_breakdown.length} Agents</span></div>
      <div className="evidence-grid">
        {result.agent_breakdown.map((agent: any) => (
          <div key={agent.agent_id} className="ev-card" onClick={() => { setSelectedAgent(agent); setActiveTab('brief'); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{formatAgent(agent.agent_id)}</span>
              <span className={`ev-status ${agent.signal === 'bullish' ? 'validated' : agent.signal === 'bearish' ? 'conflict' : 'uncertain'}`} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>Confidence {agent.confidence}%</div>
            <div className="ev-bar"><span style={{ width: `${agent.confidence}%` }} /></div>
            <div style={{ fontSize: 10, color: 'var(--text-soft)', lineHeight: 1.4 }}>{agent.summary?.substring(0, 80)}…</div>
          </div>
        ))}
      </div>
    </>
  );
}

function ChatTab({ messages, chatEndRef }: any) {
  return (
    <>
      {messages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--text-mute)' }}>Ask anything about the analysis</p>
        </div>
      )}
      {messages.map((msg: any, i: number) => (
        <div key={i} className="chat-msg">
          <div className={`chat-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
            {msg.role === 'user' ? 'U' : 'AI'}
          </div>
          <div className="chat-bubble">{msg.text}</div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </>
  );
}

function AlertsTab() {
  return (
    <>
      <div className="section-label">Notifications</div>
      <div className="notif-item">
        <div className="notif-cat risk">!</div>
        <div><div style={{ fontSize: 11, fontWeight: 700 }}>Risk: Monitor open positions</div><div style={{ fontSize: 10, color: 'var(--text-mute)' }}>Just now · Risk</div></div>
      </div>
      <div className="notif-item">
        <div className="notif-cat ai">AI</div>
        <div><div style={{ fontSize: 11, fontWeight: 700 }}>AI agents ready for analysis</div><div style={{ fontSize: 10, color: 'var(--text-mute)' }}>Just now · AI</div></div>
      </div>
    </>
  );
}

function formatAgent(id: string): string {
  return id?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown';
}
