'use client';

import { useState, useEffect, FormEvent, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { getQuote, getCandles } from '@/features/market/api';
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
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'brief' | 'assistant'>('brief');

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  // Fetch market data
  const fetchMarketData = useCallback(() => {
    if (!token) return;
    getQuote(token, ai.symbol).then(setQuote).catch(() => {});
    getCandles(token, ai.symbol, ai.timeframe).then(d => setCandles(d.candles || [])).catch(() => {});
  }, [token, ai.symbol, ai.timeframe]);

  useEffect(() => { fetchMarketData(); }, [fetchMarketData]);

  // Chart refresh callback for live updates
  const handleChartRefresh = useCallback(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
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
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;
  }

  return (
    <AppLayout hasPanel={true}>
      {/* ─── Top Controls Bar ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexShrink: 0 }}>
        {/* Symbol Input */}
        <input
          type="text" value={ai.symbol}
          onChange={(e) => ai.setSymbol(e.target.value.toUpperCase())}
          className="mavyx-input" style={{ width: 110, fontWeight: 700, fontSize: 14 }}
          placeholder="EUR/USD"
        />

        {/* Timeframe Buttons */}
        <div style={{ display: 'flex', gap: 1, background: 'var(--bg-tertiary)', borderRadius: 4, padding: 2 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} onClick={() => ai.setTimeframe(tf.value)}
              style={{
                padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 3, border: 'none', cursor: 'pointer',
                background: ai.timeframe === tf.value ? 'var(--gold)' : 'transparent',
                color: ai.timeframe === tf.value ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                transition: 'all 0.15s ease',
              }}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* Price Display */}
        {quote && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginLeft: 4 }}>
            <span className="text-number" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{quote.price}</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{ai.symbol}</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Run Analysis Button */}
        <button id="run-analysis-btn" onClick={handleAnalyze} disabled={ai.isLoading} className="mavyx-btn mavyx-btn-primary" style={{ whiteSpace: 'nowrap' }}>
          {ai.isLoading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {/* ─── Main Content: Chart + AI Panel ────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ─── Chart Area (Left) ────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="mavyx-card" style={{ flex: 1, padding: 0, overflow: 'hidden', borderRadius: 6 }}>
            <TradingViewChart symbol={ai.symbol} />
          </div>

          {/* Bottom Info Bar */}
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexShrink: 0 }}>
            <InfoChip label="Price" value={quote?.price?.toString() || '—'} />
            <InfoChip label="TF" value={ai.timeframe.toUpperCase()} />
            <InfoChip label="Candles" value={candles.length.toString()} />
            {ai.result && (
              <InfoChip label="Signal"
                value={ai.result.recommendation?.toUpperCase() || '—'}
                color={ai.result.recommendation === 'buy' ? 'var(--green)' : ai.result.recommendation === 'sell' ? 'var(--red)' : 'var(--orange)'} />
            )}
          </div>
        </div>

        {/* ─── AI Intelligence Panel (Right) ────────────────────── */}
        <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>

          {/* Panel Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 0, flexShrink: 0 }}>
            <button onClick={() => setActiveTab('brief')}
              style={{
                flex: 1, padding: '8px 12px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: activeTab === 'brief' ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                color: activeTab === 'brief' ? 'var(--gold)' : 'var(--text-tertiary)',
                borderBottom: activeTab === 'brief' ? '2px solid var(--gold)' : '2px solid transparent',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
              Executive Brief
            </button>
            <button onClick={() => setActiveTab('assistant')}
              style={{
                flex: 1, padding: '8px 12px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: activeTab === 'assistant' ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                color: activeTab === 'assistant' ? 'var(--gold)' : 'var(--text-tertiary)',
                borderBottom: activeTab === 'assistant' ? '2px solid var(--gold)' : '2px solid transparent',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
              AI Assistant
            </button>
          </div>

          {/* Panel Content */}
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-tertiary)', borderRadius: '0 0 6px 6px' }}>
            {activeTab === 'brief' ? (
              <ExecutiveBriefPanel result={ai.result} isLoading={ai.isLoading} expandedAgent={expandedAgent} setExpandedAgent={setExpandedAgent} />
            ) : (
              <AIAssistantPanel symbol={ai.symbol} result={ai.result} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function InfoChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '4px 10px', background: 'var(--bg-tertiary)', borderRadius: 4, border: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center' }}>
      <span className="text-ghost" style={{ fontSize: 10 }}>{label}</span>
      <span className="text-number" style={{ fontSize: 12, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

/* ─── Executive Brief Panel ───────────────────────────────────── */

function ExecutiveBriefPanel({ result, isLoading, expandedAgent, setExpandedAgent }: {
  result: any; isLoading: boolean; expandedAgent: string | null;
  setExpandedAgent: (id: string | null) => void;
}) {
  if (isLoading) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 12 }}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)',
                opacity: 0.3, animation: `fadeIn 1s ease ${i * 0.1}s infinite alternate`,
              }} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Deploying 11 specialist agents...</p>
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>This may take 30-60 seconds</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 24, color: 'var(--text-ghost)', marginBottom: 8 }}>⬡</div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No active analysis</p>
        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>Click "Run Analysis" to deploy specialist agents</p>
      </div>
    );
  }

  const total = (result.agent_consensus?.bullish || 0) + (result.agent_consensus?.bearish || 0) + (result.agent_consensus?.neutral || 0);

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Recommendation */}
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div className={`mavyx-rec-badge rec-${result.recommendation === 'buy' ? 'strong' : result.recommendation === 'sell' ? 'high-risk' : result.recommendation === 'wait' ? 'wait' : 'avoid'}`}
          style={{ fontSize: 14, padding: '6px 20px' }}>
          {result.recommendation === 'buy' ? 'STRONG CANDIDATE' : result.recommendation === 'sell' ? 'HIGH RISK' : result.recommendation === 'wait' ? 'WAIT' : 'AVOID'}
        </div>
      </div>

      {/* Confidence Ring + Consensus side by side */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <ConfidenceRing value={result.confidence || 0} />
        <div style={{ flex: 1 }}>
          <div className="text-label" style={{ marginBottom: 6, fontSize: 9 }}>Agent Consensus</div>
          <ConsensusRow label="Bullish" count={result.agent_consensus?.bullish || 0} total={total} color="var(--green)" />
          <ConsensusRow label="Bearish" count={result.agent_consensus?.bearish || 0} total={total} color="var(--red)" />
          <ConsensusRow label="Neutral" count={result.agent_consensus?.neutral || 0} total={total} color="var(--text-tertiary)" />
        </div>
      </div>

      {/* Evidence Cards */}
      <div>
        <div className="text-label" style={{ marginBottom: 6, fontSize: 9 }}>Evidence Cards</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {result.agent_breakdown?.map((agent: any) => (
            <div key={agent.agent_id} className="mavyx-evidence-card" style={{ padding: '6px 8px' }}
              onClick={() => setExpandedAgent(expandedAgent === agent.agent_id ? null : agent.agent_id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{formatAgent(agent.agent_id)}</span>
                <span className={`signal signal-${agent.signal}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                  {agent.signal} {agent.confidence}%
                </span>
              </div>
              {expandedAgent === agent.agent_id && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{agent.summary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Evidence */}
      {result.key_evidence?.length > 0 && (
        <div>
          <div className="text-label" style={{ marginBottom: 6, fontSize: 9 }}>Key Evidence</div>
          {result.key_evidence.slice(0, 5).map((e: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 5, padding: '3px 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              <span className="text-gold" style={{ flexShrink: 0 }}>✓</span> {e}
            </div>
          ))}
        </div>
      )}

      {/* Risk Warnings */}
      {result.risk_warnings?.length > 0 && (
        <div style={{ background: 'rgba(255,149,0,0.05)', borderRadius: 4, padding: '8px 10px', border: '1px solid rgba(255,149,0,0.1)' }}>
          <div className="text-label text-orange" style={{ marginBottom: 4, fontSize: 9 }}>Risk Warnings</div>
          {result.risk_warnings.map((w: string, i: number) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--orange)', padding: '2px 0' }}>• {w}</div>
          ))}
        </div>
      )}

      {/* Suggested Action */}
      {result.suggested_action?.direction && result.suggested_action.direction !== 'none' && (
        <div style={{ background: 'rgba(201,168,76,0.05)', borderRadius: 4, padding: '8px 10px', border: '1px solid var(--gold-border)' }}>
          <div className="text-label text-gold" style={{ marginBottom: 6, fontSize: 9 }}>Suggested Action</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              { l: 'Entry', v: result.suggested_action.entry_zone },
              { l: 'Stop Loss', v: result.suggested_action.stop_loss },
              { l: 'TP1', v: result.suggested_action.take_profit_1 },
              { l: 'TP2', v: result.suggested_action.take_profit_2 },
            ].filter(i => i.v && i.v !== 'N/A').map(i => (
              <div key={i.l} style={{ padding: '3px 6px', background: 'var(--bg-primary)', borderRadius: 3 }}>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{i.l}</div>
                <div className="text-number" style={{ fontSize: 12, fontWeight: 600 }}>{i.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      <div>
        <div className="text-label" style={{ marginBottom: 4, fontSize: 9 }}>Executive Summary</div>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {result.executive_summary?.substring(0, 300)}{result.executive_summary?.length > 300 ? '...' : ''}
        </p>
      </div>

      {/* Metadata */}
      <div style={{ textAlign: 'center', padding: '4px 0', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <span className="text-ghost" style={{ fontSize: 10 }}>
          {result.successful_agents}/{result.total_agents} agents · {result.processing_time_ms}ms
        </span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 9, color: 'var(--text-ghost)' }}>AI-generated analysis · Not financial advice</span>
      </div>
    </div>
  );
}

/* ─── AI Assistant Panel ──────────────────────────────────────── */

function AIAssistantPanel({ symbol, result }: { symbol: string; result: any }) {
  const ai = useAIStore();
  const auth = useAuthStore();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ai.chatMessages, isThinking]);

  // Initialize welcome message if no messages exist
  useEffect(() => {
    if (ai.chatMessages.length === 0) {
      const userName = auth.user?.fullName || auth.user?.email?.split('@')[0] || 'there';
      ai.addChatMessage({ role: 'assistant', text: `Hey ${userName}! 👋 I'm your Mavyx AI assistant — the intelligent admin of this platform. I can:\n\n• Run analyses for any currency pair\n• Navigate you to any page\n• Explain features and trading concepts\n• Adjust your settings\n• Answer anything about the platform\n\nJust ask me anything! What would you like to do?` });
    }
  }, []);

  async function handleSend() {
    if (!input.trim() || !auth.token) return;
    const question = input.trim();
    setInput('');
    ai.addChatMessage({ role: 'user', text: question });
    setIsThinking(true);

    try {
      // Build context
      const context: Record<string, any> = {
        symbol: symbol,
        timeframe: ai.timeframe,
        user_name: auth.user?.fullName || auth.user?.email?.split('@')[0],
        current_page: 'workspace',
      };
      if (result) {
        context.analysis_result = {
          symbol: result.symbol,
          recommendation: result.recommendation,
          confidence: result.confidence,
        };
      }

      // Call real AI API
      const response = await chatWithAssistant(
        auth.token,
        question,
        ai.chatMessages,
        context,
      );

      // Add AI response
      ai.addChatMessage({ role: 'assistant', text: response.response });

      // Execute action if provided
      if (response.action) {
        executeAction(response.action);
      }

    } catch (err: any) {
      ai.addChatMessage({
        role: 'assistant',
        text: `I'm having trouble connecting to my AI brain right now. Error: ${err?.message || 'Unknown'}. Please try again in a moment.`,
      });
    } finally {
      setIsThinking(false);
    }
  }

  function executeAction(action: any) {
    switch (action.type) {
      case 'navigate':
        router.push(action.target);
        break;
      case 'analyze':
        if (action.symbol) ai.setSymbol(action.symbol);
        if (action.timeframe) ai.setTimeframe(action.timeframe);
        // Trigger analysis by clicking the button programmatically
        document.getElementById('run-analysis-btn')?.click();
        break;
      case 'logout':
        auth.logout();
        router.push('/login');
        break;
      case 'watchlist_add':
        // Could add to watchlist here
        break;
      case 'watchlist_remove':
        // Could remove from watchlist here
        break;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ai.chatMessages.map((msg, i) => (
          <div key={i} style={{
            padding: '8px 10px',
            borderRadius: 4,
            fontSize: 12,
            lineHeight: 1.5,
            background: msg.role === 'user' ? 'rgba(201,168,76,0.08)' : 'var(--bg-primary)',
            color: msg.role === 'user' ? 'var(--gold)' : 'var(--text-secondary)',
            border: msg.role === 'user' ? '1px solid var(--gold-border)' : '1px solid var(--border)',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            whiteSpace: 'pre-line',
          }}>
            {msg.text}
          </div>
        ))}
        {isThinking && (
          <div style={{
            padding: '8px 10px', borderRadius: 4, fontSize: 12,
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            alignSelf: 'flex-start', display: 'flex', gap: 4, alignItems: 'center',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Thinking</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)',
                  opacity: 0.4, animation: `fadeIn 0.8s ease ${i * 0.2}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        )}
        {/* Scroll anchor — always at bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 8, borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about the analysis..."
          className="mavyx-input" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
        />
        <button onClick={handleSend} className="mavyx-btn mavyx-btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>Send</button>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function ConfidenceRing({ value }: { value: number }) {
  const r = 32, c = 2 * Math.PI * r, offset = c - (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
      <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="38" cy="38" r={r} fill="none" stroke="var(--bg-primary)" strokeWidth="4" />
        <circle cx="38" cy="38" r={r} fill="none" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-number" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: 1 }}>Confidence</span>
      </div>
    </div>
  );
}

function ConsensusRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
      <span style={{ width: 44, fontSize: 10, color: 'var(--text-tertiary)' }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: 'var(--bg-primary)', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
      </div>
      <span className="text-number" style={{ width: 12, textAlign: 'right', fontSize: 10, fontWeight: 700, color }}>{count}</span>
    </div>
  );
}

function formatAgent(id: string): string {
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
