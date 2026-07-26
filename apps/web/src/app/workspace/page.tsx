'use client';

import { useState, useEffect, FormEvent, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { getQuote } from '@/features/market/api';
import { analyzeSymbol, chatWithAssistant } from '@/features/ai/api';
import type { Quote } from '@/features/market/types';
import AppLayout from '@/components/layout/AppLayout';
import dynamic from 'next/dynamic';

const TradingViewChart = dynamic(() => import('@/components/CandlestickChart'), { ssr: false });

const TIMEFRAMES = [
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
];

export default function WorkspacePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate, user } = useAuthStore();
  const ai = useAIStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'brief' | 'assistant'>('brief');

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  // Fetch live price
  useEffect(() => {
    if (!token) return;
    getQuote(token, ai.symbol).then(setQuote).catch(() => {});
    const interval = setInterval(() => {
      getQuote(token, ai.symbol).then(setQuote).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [token, ai.symbol]);

  async function handleAnalyze(e?: FormEvent) {
    e?.preventDefault();
    if (!token) return;
    ai.setLoading(true);
    try {
      const data = await analyzeSymbol(token, ai.symbol, ai.timeframe);
      ai.setResult(data);
      setActiveTab('brief');
    } catch (err: any) {
      ai.setError(err?.message || 'Analysis failed');
    }
  }

  if (!isHydrated || !token) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050508' }}><span style={{ color: '#585868' }}>Loading...</span></div>;
  }

  return (
    <AppLayout>
      {/* ─── Controls Bar ────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <input type="text" value={ai.symbol} onChange={(e) => ai.setSymbol(e.target.value.toUpperCase())}
          placeholder="EUR/USD"
          style={{ width: 100, padding: '7px 10px', background: '#0C0C14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: '#E0E0E8', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif', outline: 'none' }} />

        <div style={{ display: 'flex', gap: 1, background: '#0C0C14', borderRadius: 4, padding: 2 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} onClick={() => ai.setTimeframe(tf.value)}
              style={{ padding: '5px 10px', fontSize: 10, fontWeight: 700, borderRadius: 3, border: 'none', cursor: 'pointer',
                background: ai.timeframe === tf.value ? '#C9A84C' : 'transparent',
                color: ai.timeframe === tf.value ? '#050508' : '#585868',
                transition: 'all 0.15s' }}>
              {tf.label}
            </button>
          ))}
        </div>

        {quote && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginLeft: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#E0E0E8', fontVariantNumeric: 'tabular-nums' }}>{quote.price}</span>
            <span style={{ fontSize: 10, color: '#585868' }}>{ai.symbol}</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button id="run-analysis-btn" onClick={handleAnalyze} disabled={ai.isLoading}
          style={{ padding: '7px 16px', background: '#C9A84C', border: 'none', borderRadius: 6, color: '#050508', fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif', cursor: ai.isLoading ? 'not-allowed' : 'pointer', opacity: ai.isLoading ? 0.6 : 1, letterSpacing: '0.03em' }}>
          {ai.isLoading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {/* ─── Chart + AI Panel ────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chart */}
        <div style={{ flex: 1, position: 'relative' }}>
          <TradingViewChart symbol={ai.symbol} />
        </div>

        {/* AI Panel */}
        <div style={{ width: 340, borderLeft: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', background: '#08080E' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <button onClick={() => setActiveTab('brief')} style={{ flex: 1, padding: '8px 0', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === 'brief' ? '#0C0C14' : 'transparent', color: activeTab === 'brief' ? '#C9A84C' : '#484858', borderBottom: activeTab === 'brief' ? '2px solid #C9A84C' : '2px solid transparent', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Executive Brief
            </button>
            <button onClick={() => setActiveTab('assistant')} style={{ flex: 1, padding: '8px 0', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === 'assistant' ? '#0C0C14' : 'transparent', color: activeTab === 'assistant' ? '#C9A84C' : '#484858', borderBottom: activeTab === 'assistant' ? '2px solid #C9A84C' : '2px solid transparent', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              AI Assistant
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {activeTab === 'brief' ? (
              <ExecutiveBrief result={ai.result} isLoading={ai.isLoading} expandedAgent={expandedAgent} setExpandedAgent={setExpandedAgent} />
            ) : (
              <AssistantChat symbol={ai.symbol} result={ai.result} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ─── Executive Brief ─────────────────────────────────────────── */
function ExecutiveBrief({ result, isLoading, expandedAgent, setExpandedAgent }: any) {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 0' }}>
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 10 }}>
          {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C', opacity: 0.3, animation: `fadeIn 1s ease ${i * 0.08}s infinite alternate` }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#686878' }}>Deploying 14 specialist agents...</p>
        <p style={{ fontSize: 10, color: '#484858', marginTop: 4 }}>This may take 30-60 seconds</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 24, color: '#383848', marginBottom: 8 }}>⬡</div>
        <p style={{ fontSize: 12, color: '#585868' }}>No active analysis</p>
        <p style={{ fontSize: 10, color: '#484858', marginTop: 4 }}>Click "Run Analysis" to deploy agents</p>
      </div>
    );
  }

  const total = (result.agent_consensus?.bullish || 0) + (result.agent_consensus?.bearish || 0) + (result.agent_consensus?.neutral || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Recommendation */}
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div style={{
          display: 'inline-block', padding: '5px 16px', borderRadius: 6,
          fontSize: 13, fontWeight: 700, letterSpacing: '0.03em',
          background: result.recommendation === 'buy' ? 'rgba(52,199,89,0.1)' : result.recommendation === 'sell' ? 'rgba(255,45,85,0.1)' : 'rgba(255,184,0,0.1)',
          color: result.recommendation === 'buy' ? '#34C759' : result.recommendation === 'sell' ? '#FF2D55' : '#FFB800',
          border: `1px solid ${result.recommendation === 'buy' ? 'rgba(52,199,89,0.2)' : result.recommendation === 'sell' ? 'rgba(255,45,85,0.2)' : 'rgba(255,184,0,0.2)'}`,
        }}>
          {result.recommendation?.toUpperCase() === 'BUY' ? 'STRONG CANDIDATE' : result.recommendation?.toUpperCase() === 'SELL' ? 'HIGH RISK' : result.recommendation?.toUpperCase() === 'WAIT' ? 'WAIT' : 'NO TRADE'}
        </div>
      </div>

      {/* Confidence + Consensus */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <ConfidenceRing value={result.confidence || 0} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#484858', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Agent Consensus</div>
          <Bar label="Bullish" count={result.agent_consensus?.bullish || 0} total={total} color="#34C759" />
          <Bar label="Bearish" count={result.agent_consensus?.bearish || 0} total={total} color="#FF2D55" />
          <Bar label="Neutral" count={result.agent_consensus?.neutral || 0} total={total} color="#585868" />
        </div>
      </div>

      {/* Evidence Cards */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#484858', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Evidence Cards</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {result.agent_breakdown?.map((agent: any) => (
            <div key={agent.agent_id} onClick={() => setExpandedAgent(expandedAgent === agent.agent_id ? null : agent.agent_id)}
              style={{ padding: '5px 8px', background: '#0C0C14', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 4, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#C0C0C8' }}>{formatAgent(agent.agent_id)}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                  background: agent.signal === 'bullish' ? 'rgba(52,199,89,0.1)' : agent.signal === 'bearish' ? 'rgba(255,45,85,0.1)' : 'rgba(88,88,104,0.1)',
                  color: agent.signal === 'bullish' ? '#34C759' : agent.signal === 'bearish' ? '#FF2D55' : '#585868' }}>
                  {agent.signal} {agent.confidence}%
                </span>
              </div>
              {expandedAgent === agent.agent_id && (
                <p style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 10, color: '#686878', lineHeight: 1.5 }}>{agent.summary}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Evidence */}
      {result.key_evidence?.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#484858', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Key Evidence</div>
          {result.key_evidence.slice(0, 5).map((e: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 5, padding: '2px 0', fontSize: 10, color: '#686878' }}>
              <span style={{ color: '#C9A84C', flexShrink: 0 }}>✓</span> {e}
            </div>
          ))}
        </div>
      )}

      {/* Risk Warnings */}
      {result.risk_warnings?.length > 0 && (
        <div style={{ background: 'rgba(255,184,0,0.04)', borderRadius: 4, padding: '6px 8px', border: '1px solid rgba(255,184,0,0.1)' }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#FFB800', marginBottom: 4 }}>Risk Warnings</div>
          {result.risk_warnings.map((w: string, i: number) => (
            <div key={i} style={{ fontSize: 10, color: '#FFB800', padding: '1px 0' }}>• {w}</div>
          ))}
        </div>
      )}

      {/* Suggested Action */}
      {result.suggested_action?.direction && result.suggested_action.direction !== 'none' && (
        <div style={{ background: 'rgba(201,168,76,0.04)', borderRadius: 4, padding: '6px 8px', border: '1px solid rgba(201,168,76,0.1)' }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#C9A84C', marginBottom: 6 }}>Suggested Action</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              { l: 'Entry', v: result.suggested_action.entry_zone },
              { l: 'Stop Loss', v: result.suggested_action.stop_loss },
              { l: 'TP1', v: result.suggested_action.take_profit_1 },
              { l: 'TP2', v: result.suggested_action.take_profit_2 },
            ].filter((i: any) => i.v && i.v !== 'N/A').map((i: any) => (
              <div key={i.l} style={{ padding: '3px 6px', background: '#0A0A12', borderRadius: 3 }}>
                <div style={{ fontSize: 8, color: '#484858', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{i.l}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#E0E0E8', fontVariantNumeric: 'tabular-nums' }}>{i.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#484858', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Executive Summary</div>
        <p style={{ fontSize: 10, color: '#686878', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {result.executive_summary?.substring(0, 250)}{result.executive_summary?.length > 250 ? '...' : ''}
        </p>
      </div>

      {/* Meta */}
      <div style={{ textAlign: 'center', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: 9, color: '#383848' }}>{result.successful_agents}/{result.total_agents} agents · {result.processing_time_ms}ms</span>
      </div>
    </div>
  );
}

/* ─── AI Assistant Chat ────────────────────────────────────────── */
function AssistantChat({ symbol, result }: { symbol: string; result: any }) {
  const ai = useAIStore();
  const auth = useAuthStore();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ai.chatMessages, isThinking]);

  useEffect(() => {
    if (ai.chatMessages.length === 0) {
      const name = auth.user?.fullName || auth.user?.email?.split('@')[0] || 'there';
      ai.addChatMessage({ role: 'assistant', text: `Hey ${name}! I'm your Mavyx AI assistant. I can run analyses, navigate the platform, explain features, or just chat. What would you like to do?` });
    }
  }, []);

  async function handleSend() {
    if (!input.trim() || !auth.token) return;
    const msg = input.trim();
    setInput('');
    ai.addChatMessage({ role: 'user', text: msg });
    setIsThinking(true);
    try {
      const ctx: any = { symbol, timeframe: ai.timeframe, user_name: auth.user?.fullName };
      if (result) ctx.analysis_result = { symbol: result.symbol, recommendation: result.recommendation, confidence: result.confidence };
      const res = await chatWithAssistant(auth.token, msg, ai.chatMessages, ctx);
      ai.addChatMessage({ role: 'assistant', text: res.response });
      if (res.action) {
        if (res.action.type === 'navigate') router.push(res.action.target);
        if (res.action.type === 'analyze') { ai.setSymbol(res.action.symbol || symbol); document.getElementById('run-analysis-btn')?.click(); }
        if (res.action.type === 'logout') { auth.logout(); router.push('/login'); }
      }
    } catch (err: any) {
      ai.addChatMessage({ role: 'assistant', text: `Connection issue: ${err?.message || 'Unknown'}. Try again.` });
    } finally { setIsThinking(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ai.chatMessages.map((msg, i) => (
          <div key={i} style={{
            padding: '7px 9px', borderRadius: 6, fontSize: 11, lineHeight: 1.5,
            background: msg.role === 'user' ? 'rgba(201,168,76,0.06)' : '#0C0C14',
            color: msg.role === 'user' ? '#C9A84C' : '#8888A0',
            border: msg.role === 'user' ? '1px solid rgba(201,168,76,0.12)' : '1px solid rgba(255,255,255,0.04)',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%', whiteSpace: 'pre-line',
          }}>{msg.text}</div>
        ))}
        {isThinking && (
          <div style={{ padding: '7px 9px', borderRadius: 6, background: '#0C0C14', border: '1px solid rgba(255,255,255,0.04)', alignSelf: 'flex-start', display: 'flex', gap: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#484858' }}>Thinking</span>
            {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#C9A84C', opacity: 0.4, animation: `fadeIn 0.8s ease ${i * 0.2}s infinite alternate` }} />)}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: 6, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 6 }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything..." style={{ flex: 1, padding: '6px 10px', background: '#0C0C14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: '#E0E0E8', fontSize: 11, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
        <button onClick={handleSend} style={{ padding: '6px 12px', background: '#C9A84C', border: 'none', borderRadius: 6, color: '#050508', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Send</button>
      </div>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────── */
function ConfidenceRing({ value }: { value: number }) {
  const r = 28, c = 2 * Math.PI * r, offset = c - (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="#0C0C14" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="#C9A84C" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#C9A84C', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <span style={{ fontSize: 7, fontWeight: 600, color: '#484858', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>Confidence</span>
      </div>
    </div>
  );
}

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
      <span style={{ width: 40, fontSize: 10, color: '#484858' }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: '#0C0C14', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ width: 12, textAlign: 'right', fontSize: 10, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
    </div>
  );
}

function formatAgent(id: string): string {
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
