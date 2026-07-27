'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { reviewJournalEntry } from '@/features/ai/api';
import AppLayout from '@/components/AppLayout';

export default function JournalPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, any>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !token) router.replace('/login'); }, [isHydrated, token, router]);

  async function handleReview(entryId: string) {
    if (!token) return;
    const entry = ai.journal.find(e => e.id === entryId);
    if (!entry) return;
    setReviewingId(entryId);
    try {
      const review = await reviewJournalEntry(token, entry);
      setReviews(prev => ({ ...prev, [entryId]: review }));
    } catch {
      setReviews(prev => ({ ...prev, [entryId]: { review_summary: 'Failed to generate review.' } }));
    } finally { setReviewingId(null); }
  }

  if (!isHydrated || !token) return null;

  return (
    <AppLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Trade Journal</h1>
          <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{ai.journal.length} entries</span>
        </div>

        {ai.journal.length === 0 ? (
          <div className="tc-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 28, color: 'var(--text-mute)', marginBottom: 12 }}>📖</div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No journal entries yet</h2>
            <p style={{ fontSize: 12, color: 'var(--text-mute)', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
              Every analysis you run is automatically saved here. Go to the Workspace and run your first analysis.
            </p>
            <button className="analyze-btn" style={{ marginTop: 16 }} onClick={() => router.push('/workspace')}>Open Workspace</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ai.journal.map(entry => {
              const review = reviews[entry.id];
              const isReviewing = reviewingId === entry.id;
              return (
                <div key={entry.id} className="tc-card" style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{entry.symbol}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>{entry.timeframe}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                        background: entry.recommendation === 'buy' ? 'var(--green-dim)' : entry.recommendation === 'sell' ? 'var(--red-dim)' : 'var(--orange-dim)',
                        color: entry.recommendation === 'buy' ? 'var(--green)' : entry.recommendation === 'sell' ? 'var(--red)' : 'var(--orange)',
                      }}>{entry.recommendation?.toUpperCase()}</span>
                      <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>{entry.confidence}%</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>

                  {expandedId === entry.id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                      <div style={{ marginBottom: 10 }}>
                        <div className="tc-label">Executive Summary</div>
                        <p style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.6 }}>{entry.executiveSummary}</p>
                      </div>

                      {entry.keyEvidence?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div className="tc-label">Key Evidence</div>
                          {entry.keyEvidence.map((e: string, i: number) => (
                            <div key={i} style={{ fontSize: 11, color: 'var(--text-soft)', padding: '2px 0' }}>
                              <span style={{ color: 'var(--gold)' }}>✓</span> {e}
                            </div>
                          ))}
                        </div>
                      )}

                      {entry.riskWarnings?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div className="tc-label" style={{ color: 'var(--orange)' }}>Risk Warnings</div>
                          {entry.riskWarnings.map((w: string, i: number) => (
                            <div key={i} style={{ fontSize: 11, color: 'var(--orange)', padding: '2px 0' }}>• {w}</div>
                          ))}
                        </div>
                      )}

                      {review && (
                        <div style={{ marginBottom: 10, padding: 10, background: 'var(--gold-dim)', borderRadius: 6, border: '1px solid var(--gold-line)' }}>
                          <div className="tc-label" style={{ color: 'var(--gold)' }}>AI Review</div>
                          <p style={{ fontSize: 11, color: 'var(--text-soft)', lineHeight: 1.5 }}>{review.review_summary}</p>
                          {review.decision_quality_score && (
                            <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, marginTop: 6 }}>
                              Decision Quality: {review.decision_quality_score}%
                            </p>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); ai.setSymbol(entry.symbol); router.push('/workspace'); }}
                          className="analyze-btn" style={{ padding: '6px 14px', fontSize: 11, background: 'var(--bg-panel)', color: 'var(--gold)', border: '1px solid var(--gold-line)', boxShadow: 'none' }}>
                          Re-analyze
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleReview(entry.id); }}
                          disabled={isReviewing} className="analyze-btn" style={{ padding: '6px 14px', fontSize: 11 }}>
                          {isReviewing ? 'Reviewing...' : 'AI Review'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
