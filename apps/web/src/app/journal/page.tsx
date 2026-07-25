'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { useAIStore } from '@/features/ai/store';
import { reviewJournalEntry, generateWeeklyReview } from '@/features/ai/api';
import AppLayout from '@/components/layout/AppLayout';

export default function JournalPage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const ai = useAIStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, any>>({});
  const [weeklyReview, setWeeklyReview] = useState<any>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);

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
    } catch (err) {
      setReviews(prev => ({ ...prev, [entryId]: { review_summary: 'Failed to generate review.' } }));
    } finally {
      setReviewingId(null);
    }
  }

  async function handleWeeklyReview() {
    if (!token) return;
    setIsWeeklyLoading(true);
    try {
      const review = await generateWeeklyReview(token, ai.journal);
      setWeeklyReview(review);
    } catch {
      setWeeklyReview({ weekly_summary: 'Failed to generate weekly review.' });
    } finally {
      setIsWeeklyLoading(false);
    }
  }

  if (!isHydrated || !token) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="text-ghost">Loading...</div></div>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1>Trade Journal</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="text-caption">{ai.journal.length} entries</span>
            <button onClick={handleWeeklyReview} disabled={isWeeklyLoading} className="mavyx-btn mavyx-btn-secondary" style={{ fontSize: 11, padding: '5px 12px' }}>
              {isWeeklyLoading ? 'Generating...' : 'Weekly Review'}
            </button>
          </div>
        </div>

        {/* Weekly Review Card */}
        {weeklyReview && (
          <div className="mavyx-card" style={{ marginBottom: 12, borderColor: 'var(--gold-border)' }}>
            <div className="text-label text-gold" style={{ marginBottom: 8 }}>Weekly Intelligence Review</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{weeklyReview.weekly_summary}</p>
            {weeklyReview.performance_score && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                <div>
                  <div className="text-label" style={{ fontSize: 9 }}>Performance</div>
                  <div className="text-number" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{weeklyReview.performance_score}%</div>
                </div>
              </div>
            )}
            {weeklyReview.strengths_to_reinforce?.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div className="text-label" style={{ fontSize: 9, marginBottom: 4 }}>Strengths</div>
                {weeklyReview.strengths_to_reinforce.map((s: string, i: number) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--green)', padding: '2px 0' }}>✓ {s}</div>
                ))}
              </div>
            )}
            {weeklyReview.weaknesses_to_address?.length > 0 && (
              <div>
                <div className="text-label" style={{ fontSize: 9, marginBottom: 4 }}>Areas to Improve</div>
                {weeklyReview.weaknesses_to_address.map((w: string, i: number) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--orange)', padding: '2px 0' }}>• {w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Journal Entries */}
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
            {ai.journal.map(entry => {
              const review = reviews[entry.id];
              const isReviewing = reviewingId === entry.id;

              return (
                <div key={entry.id} className="mavyx-card">
                  {/* Header — clickable to expand */}
                  <div style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{entry.symbol}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{entry.timeframe}</span>
                        <span className={`signal signal-${entry.recommendation === 'buy' ? 'bullish' : entry.recommendation === 'sell' ? 'bearish' : 'neutral'}`}>
                          {entry.recommendation?.toUpperCase()}
                        </span>
                        <span className="text-number" style={{ fontSize: 12, color: 'var(--gold)' }}>{entry.confidence}%</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-ghost)' }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === entry.id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      {/* Summary */}
                      <div style={{ marginBottom: 10 }}>
                        <div className="text-label" style={{ fontSize: 9, marginBottom: 4 }}>Executive Summary</div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{entry.executiveSummary}</p>
                      </div>

                      {/* Key Evidence */}
                      {entry.keyEvidence?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div className="text-label" style={{ fontSize: 9, marginBottom: 4 }}>Key Evidence</div>
                          {entry.keyEvidence.map((e: string, i: number) => (
                            <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0' }}>
                              <span className="text-gold">✓</span> {e}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Risk Warnings */}
                      {entry.riskWarnings?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div className="text-label text-orange" style={{ fontSize: 9, marginBottom: 4 }}>Risk Warnings</div>
                          {entry.riskWarnings.map((w: string, i: number) => (
                            <div key={i} style={{ fontSize: 11, color: 'var(--orange)', padding: '2px 0' }}>• {w}</div>
                          ))}
                        </div>
                      )}

                      {/* Agent Breakdown */}
                      {entry.agentBreakdown?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
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

                      {/* AI Review */}
                      {review && (
                        <div style={{ marginBottom: 10, padding: '10px', background: 'var(--bg-primary)', borderRadius: 4, border: '1px solid var(--gold-border)' }}>
                          <div className="text-label text-gold" style={{ fontSize: 9, marginBottom: 6 }}>AI Review</div>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{review.review_summary}</p>
                          {review.decision_quality_score && (
                            <div style={{ marginBottom: 6 }}>
                              <span className="text-label" style={{ fontSize: 9 }}>Decision Quality: </span>
                              <span className="text-number" style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{review.decision_quality_score}%</span>
                            </div>
                          )}
                          {review.strengths?.length > 0 && (
                            <div style={{ marginBottom: 4 }}>
                              {review.strengths.map((s: string, i: number) => (
                                <div key={i} style={{ fontSize: 10, color: 'var(--green)' }}>✓ {s}</div>
                              ))}
                            </div>
                          )}
                          {review.weaknesses?.length > 0 && (
                            <div>
                              {review.weaknesses.map((w: string, i: number) => (
                                <div key={i} style={{ fontSize: 10, color: 'var(--orange)' }}>• {w}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={(e) => { e.stopPropagation(); ai.setSymbol(entry.symbol); router.push('/workspace'); }}
                          className="mavyx-btn mavyx-btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }}>
                          Re-analyze
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleReview(entry.id); }}
                          disabled={isReviewing} className="mavyx-btn mavyx-btn-ghost" style={{ fontSize: 10, padding: '4px 8px', color: 'var(--gold)' }}>
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
