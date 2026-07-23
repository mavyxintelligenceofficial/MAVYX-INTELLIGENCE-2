'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { analyzeSymbol } from '@/features/ai/api';
import { AnalysisResult } from '@/features/ai/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

export default function AnalysisPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const [symbol, setSymbol] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState('4h');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAgents, setShowAgents] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true); setError(null); setResult(null);
    try {
      const data = await analyzeSymbol(token, symbol, timeframe);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analysis failed.');
    } finally { setIsLoading(false); }
  }

  if (!isHydrated || !token) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <div className="mavyx-bg" /><div className="mavyx-grid" />
        <div className="mavyx-loader" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen p-6">
      <div className="mavyx-bg" /><div className="mavyx-grid" />
      <div className="mavyx-orb mavyx-orb-gold" /><div className="mavyx-orb mavyx-orb-cyan" />

      <div className="relative z-10 mx-auto max-w-2xl mavyx-page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image src="/brand/Mavyx GOLD VERSION.png" alt="Mavyx" width={28} height={28} />
            <div>
              <h1 className="font-orbitron text-sm tracking-widest text-gold">AI ANALYSIS</h1>
              <p className="font-rajdhani text-xs text-dim">Multi-agent intelligence</p>
            </div>
          </div>
          <Link href="/profile" className="font-rajdhani text-xs tracking-wider uppercase text-dim hover:text-gold transition-colors">
            ← Back
          </Link>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="mavyx-glass p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-orbitron text-[10px] tracking-widest uppercase mb-2 text-dim">Currency Pair</label>
              <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="EUR/USD" className="mavyx-input" />
            </div>
            <div>
              <label className="block font-orbitron text-[10px] tracking-widest uppercase mb-2 text-dim">Timeframe</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="mavyx-input">
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hour</option>
                <option value="1d">Daily</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="mavyx-btn mavyx-btn-gold w-full">
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="mavyx-typing"><span /><span /><span /></span>
                ANALYZING
              </span>
            ) : 'RUN ANALYSIS'}
          </button>
          {isLoading && (
            <div className="mt-4 text-center">
              <p className="font-rajdhani text-xs text-dim mb-2">Deploying specialist agents...</p>
              <div className="flex justify-center gap-2">
                {['Technical', 'Structure', 'Sentiment', 'Risk', 'Fundamental', 'Behavior', 'Recommendation'].map((agent, i) => (
                  <div key={agent} className="w-2 h-2 rounded-full bg-gold/30 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Error */}
        {error && (
          <div className="mavyx-glass p-4 mb-6" style={{ borderColor: 'rgba(255,45,85,0.2)' }}>
            <p className="font-rajdhani text-sm" style={{ color: '#FF5252' }}>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 mavyx-stagger">
            {/* Recommendation */}
            <div className={`mavyx-rec-card mavyx-rec-${result.recommendation === 'no_trade' ? 'no-trade' : result.recommendation}`}>
              <p className="font-orbitron text-[10px] tracking-widest text-dim mb-3">{result.symbol}</p>
              <p className="font-orbitron text-5xl font-black mb-3" style={{ color: getRecColor(result.recommendation) }}>
                {result.recommendation === 'buy' ? 'BUY' : result.recommendation === 'sell' ? 'SELL' : result.recommendation === 'wait' ? 'WAIT' : 'NO TRADE'}
              </p>
              <p className="font-rajdhani text-sm text-dim">
                Confidence: <span className="font-orbitron font-bold text-gold">{result.confidence}%</span>
              </p>
            </div>

            {/* Confidence & Consensus */}
            <div className="grid grid-cols-2 gap-4">
              <div className="mavyx-glass p-5">
                <p className="font-orbitron text-[10px] tracking-widest text-dim mb-3">CONFIDENCE</p>
                <p className="font-orbitron text-4xl font-black text-gold glow-gold mb-3">{result.confidence}%</p>
                <div className="mavyx-confidence-track">
                  <div className={`mavyx-confidence-fill ${result.confidence >= 70 ? 'confidence-high' : result.confidence >= 50 ? 'confidence-medium' : 'confidence-low'}`}
                    style={{ width: `${result.confidence}%` }} />
                </div>
              </div>
              <div className="mavyx-glass p-5">
                <p className="font-orbitron text-[10px] tracking-widest text-dim mb-3">CONSENSUS</p>
                <div className="space-y-3">
                  {[
                    { label: 'BULL', count: result.agent_consensus.bullish, color: '#00FF88' },
                    { label: 'BEAR', count: result.agent_consensus.bearish, color: '#FF2D55' },
                    { label: 'FLAT', count: result.agent_consensus.neutral, color: '#6B6B80' },
                  ].map((item) => {
                    const total = result.agent_consensus.bullish + result.agent_consensus.bearish + result.agent_consensus.neutral;
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="font-orbitron text-[9px] w-8" style={{ color: item.color }}>{item.label}</span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%`, background: item.color }} />
                        </div>
                        <span className="font-orbitron text-xs font-bold w-4 text-right" style={{ color: item.color }}>{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Suggested Action */}
            {result.suggested_action?.direction && result.suggested_action.direction !== 'none' && (
              <div className="mavyx-glass p-5 border-glow-gold">
                <p className="font-orbitron text-[10px] tracking-widest text-gold mb-4">SUGGESTED ACTION</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'ENTRY', value: result.suggested_action.entry_zone },
                    { label: 'STOP LOSS', value: result.suggested_action.stop_loss },
                    { label: 'TAKE PROFIT 1', value: result.suggested_action.take_profit_1 },
                    { label: 'TAKE PROFIT 2', value: result.suggested_action.take_profit_2 },
                  ].filter(i => i.value && i.value !== 'N/A').map((item) => (
                    <div key={item.label} className="p-3 rounded-lg" style={{ background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.08)' }}>
                      <p className="font-orbitron text-[9px] tracking-widest text-gold/50 mb-1">{item.label}</p>
                      <p className="font-rajdhani text-sm font-semibold" style={{ color: '#F0F0F8' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Evidence */}
            {result.key_evidence.length > 0 && (
              <div className="mavyx-glass p-5">
                <p className="font-orbitron text-[10px] tracking-widest text-gold mb-4">KEY EVIDENCE</p>
                <div className="space-y-2">
                  {result.key_evidence.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(201,168,76,0.02)' }}>
                      <span className="font-orbitron text-xs text-gold mt-0.5">✓</span>
                      <p className="font-rajdhani text-sm" style={{ color: '#B0B0C0' }}>{e}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Warnings */}
            {result.risk_warnings.length > 0 && (
              <div className="mavyx-glass p-5" style={{ borderColor: 'rgba(255,184,0,0.15)' }}>
                <p className="font-orbitron text-[10px] tracking-widest mb-4" style={{ color: '#FFB800' }}>⚠ RISK WARNINGS</p>
                <div className="space-y-2">
                  {result.risk_warnings.map((w, i) => (
                    <p key={i} className="font-rajdhani text-sm" style={{ color: '#FFD54F' }}>• {w}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Breakdown */}
            <div className="mavyx-glass overflow-hidden">
              <button onClick={() => setShowAgents(!showAgents)} className="w-full p-5 flex items-center justify-between">
                <p className="font-orbitron text-[10px] tracking-widest text-gold">AGENT BREAKDOWN ({result.agent_breakdown.length})</p>
                <span className="text-dim text-xs">{showAgents ? '▲' : '▼'}</span>
              </button>
              {showAgents && (
                <div className="px-5 pb-5 space-y-2 mavyx-stagger">
                  {result.agent_breakdown.map((agent) => (
                    <div key={agent.agent_id} className="p-3 rounded-lg flex items-center justify-between"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <p className="font-rajdhani text-sm font-semibold" style={{ color: '#F0F0F8' }}>
                          {agent.agent_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                        <p className="font-rajdhani text-xs text-dim mt-0.5">{agent.summary?.substring(0, 60)}...</p>
                      </div>
                      <span className={`mavyx-badge mavyx-badge-${agent.signal}`}>
                        {agent.signal} {agent.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Executive Summary */}
            <div className="mavyx-glass p-5">
              <p className="font-orbitron text-[10px] tracking-widest text-gold mb-3">EXECUTIVE SUMMARY</p>
              <p className="font-rajdhani text-sm leading-relaxed whitespace-pre-line" style={{ color: '#8B8BA0' }}>
                {result.executive_summary}
              </p>
            </div>

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="font-rajdhani text-xs text-dim">
                {result.successful_agents}/{result.result.total_agents} agents · {result.processing_time_ms}ms
              </p>
              <p className="font-rajdhani text-[10px] mt-2" style={{ color: '#3B3B50' }}>
                AI-generated analysis only · Not financial advice
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function getRecColor(rec: string): string {
  switch (rec) {
    case 'buy': return '#00FF88';
    case 'sell': return '#FF2D55';
    case 'wait': return '#FFB800';
    default: return '#6B6B80';
  }
}
