'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import AppLayout from '@/components/layout/AppLayout';

export default function JournalPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1>Trade Journal</h1>
          <span className="text-caption">{ai.journal.length} entries</span>
        </div>

        {ai.journal.length === 0 ? (
          <div className="mavyx-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 28, color: 'var(--text-ghost)', marginBottom: 12 }}>◫</div>
            <h2 style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>No journal entries yet</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
              Every analysis you run is automatically saved here as a research case.
              Go to the Workspace and run your first analysis.
            </p>
            <button className="mavyx-btn mavyx-btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/workspace')}>
              Open Workspace
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ai.journal.map(entry => (
              <div key={entry.id} className="mavyx-card" style={{ cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{entry.symbol}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{entry.timeframe}</span>
                    <span className={`signal signal-${entry.recommendation === 'buy' ? 'bullish' : entry.recommendation === 'sell' ? 'bearish' : 'neutral'}`}>
                      {entry.recommendation?.toUpperCase()}
                    </span>
                    <span className="text-number" style={{ fontSize: 12, color: 'var(--gold)' }}>{entry.confidence}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 3,
                      background: entry.outcome === 'win' ? 'var(--green-dim)' : entry.outcome === 'loss' ? 'var(--red-dim)' : 'rgba(104,104,120,0.1)',
                      color: entry.outcome === 'win' ? 'var(--green)' : entry.outcome === 'loss' ? 'var(--red)' : 'var(--text-tertiary)',
                    }}>
                      {entry.outcome?.toUpperCase() || 'PENDING'}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-ghost)' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === entry.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: 10 }}>
                      <div className="text-label" style={{ fontSize: 9, marginBottom: 4 }}>Executive Summary</div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{entry.executiveSummary}</p>
                    </div>

                    {entry.keyEvidence.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div className="text-label" style={{ fontSize: 9, marginBottom: 4 }}>Key Evidence</div>
                        {entry.keyEvidence.map((e, i) => (
                          <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0' }}>
                            <span className="text-gold">✓</span> {e}
                          </div>
                        ))}
                      </div>
                    )}

                    {entry.riskWarnings.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div className="text-label text-orange" style={{ fontSize: 9, marginBottom: 4 }}>Risk Warnings</div>
                        {entry.riskWarnings.map((w, i) => (
                          <div key={i} style={{ fontSize: 11, color: 'var(--orange)', padding: '2px 0' }}>• {w}</div>
                        ))}
                      </div>
                    )}

                    {/* Agent Breakdown */}
                    {entry.agentBreakdown.length > 0 && (
                      <div>
                        <div className="text-label" style={{ fontSize: 9, marginBottom: 4 }}>Agent Breakdown</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {entry.agentBreakdown.map((agent: any) => (
                            <span key={agent.agent_id} className={`signal signal-${agent.signal}`} style={{ fontSize: 9 }}>
                              {agent.agent_id.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')}: {agent.signal} {agent.confidence}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      <button className="mavyx-btn mavyx-btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }}
                        onClick={(e) => { e.stopPropagation(); ai.setSymbol(entry.symbol); router.push('/workspace'); }}>
                        Re-analyze
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
