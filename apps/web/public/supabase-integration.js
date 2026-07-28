/**
 * Mavyx Intelligence — Supabase Integration
 * Auth: Google, Microsoft, Apple, Email/Password
 * Data: Journal, Watchlist, Chat History, Settings, Analysis
 * All user data persisted in Supabase. No localStorage for data.
 */

const SUPABASE_URL = 'https://ratjbypgubystowwrklz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdGpieXBndWJ5c3Rvd3dya2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTczNzksImV4cCI6MjEwMDgzMzM3OX0.emrEoC8tWcwxcl6lvI6fmCvnzXU64A1XOJO1xq44HVw';

let _supabase = null;
let _user = null;

function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
    console.warn('[Mavyx] Supabase client not loaded yet');
    return null;
  }
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
  return _supabase;
}

// ─── Auth ──────────────────────────────────────────────────────
async function signInWithEmail(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  _user = data.user;
  return data;
}

async function signUpWithEmail(email, password, metadata) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
      emailRedirectTo: window.location.origin + '/workspace.html',
    },
  });
  if (error) throw error;
  return data;
}

async function signInWithOAuth(provider) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');
  const { data, error } = await sb.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + '/workspace.html',
    },
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
  _user = null;
  localStorage.removeItem('mavyx-auth-store');
  window.location.href = '/login';
}

async function getCurrentUser() {
  if (_user) return _user;
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: { user } } = await sb.auth.getUser();
    _user = user;
    return user;
  } catch { return null; }
}

async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

function onAuthStateChange(callback) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
    _user = session?.user || null;
    callback(event, session);
  });
  return () => subscription.unsubscribe();
}

// ─── Journal (Supabase) ───────────────────────────────────────
async function getJournal() {
  const user = await getCurrentUser();
  if (!user) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) { console.error('[Mavyx] Journal fetch error:', error); return []; }
  return data || [];
}

async function saveJournal(entry) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const sb = getSupabase();
  const row = {
    user_id: user.id,
    symbol: entry.symbol || 'EUR/USD',
    direction: entry.direction || 'buy',
    entry_price: entry.entry || null,
    exit_price: entry.exit || null,
    stop_loss: entry.stopLoss || null,
    take_profit: entry.target || null,
    pnl: entry.pnl || 0,
    rr: entry.rr || 0,
    notes: entry.notes || '',
    status: entry.status || 'open',
    tags: entry.tags || [],
    analysis_id: entry.analysisId || null,
  };
  const { data, error } = await sb.from('journal_entries').insert(row).select().single();
  if (error) throw error;
  return data;
}

async function updateJournalEntry(id, updates) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const sb = getSupabase();
  const row = {};
  if (updates.symbol) row.symbol = updates.symbol;
  if (updates.direction) row.direction = updates.direction;
  if (updates.entry) row.entry_price = updates.entry;
  if (updates.exit) row.exit_price = updates.exit;
  if (updates.stopLoss) row.stop_loss = updates.stopLoss;
  if (updates.target) row.take_profit = updates.target;
  if (updates.pnl !== undefined) row.pnl = updates.pnl;
  if (updates.rr !== undefined) row.rr = updates.rr;
  if (updates.notes) row.notes = updates.notes;
  if (updates.status) row.status = updates.status;
  const { data, error } = await sb.from('journal_entries').update(row).eq('id', id).eq('user_id', user.id).select().single();
  if (error) throw error;
  return data;
}

async function deleteJournalEntry(id) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const sb = getSupabase();
  const { error } = await sb.from('journal_entries').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}

// ─── Watchlist (Supabase) ─────────────────────────────────────
async function getWatchlistSymbols() {
  const user = await getCurrentUser();
  if (!user) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from('watchlist')
    .select('symbol')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data || []).map(r => r.symbol);
}

async function addToWatchlist(symbol) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const sb = getSupabase();
  const { error } = await sb.from('watchlist').upsert(
    { user_id: user.id, symbol },
    { onConflict: 'user_id,symbol' },
  );
  if (error) throw error;
}

async function removeFromWatchlist(symbol) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const sb = getSupabase();
  const { error } = await sb.from('watchlist').delete().eq('user_id', user.id).eq('symbol', symbol);
  if (error) throw error;
}

// ─── Chat History (Supabase) ──────────────────────────────────
async function getChatHistory(channel) {
  const user = await getCurrentUser();
  if (!user) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('channel', channel || 'assistant')
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) return [];
  return data || [];
}

async function saveChatMessage(channel, role, content) {
  const user = await getCurrentUser();
  if (!user) return;
  const sb = getSupabase();
  await sb.from('chat_messages').insert({
    user_id: user.id,
    channel: channel || 'assistant',
    role,
    content,
  });
}

async function deleteChatHistory(channel) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const sb = getSupabase();
  const { error } = await sb.from('chat_messages').delete().eq('user_id', user.id).eq('channel', channel);
  if (error) throw error;
}

// ─── Analysis History (Supabase) ──────────────────────────────
async function getAnalysisHistory() {
  const user = await getCurrentUser();
  if (!user) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from('analysis_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return [];
  return data || [];
}

async function saveAnalysis(result) {
  const user = await getCurrentUser();
  if (!user) return;
  const sb = getSupabase();
  await sb.from('analysis_history').insert({
    user_id: user.id,
    symbol: result.symbol || 'EUR/USD',
    timeframe: result.timeframe || '4h',
    confidence: result.confidence || 0,
    recommendation: result.recommendation || 'wait',
    executive_summary: result.executive_summary || '',
    agent_consensus: result.agent_consensus || {},
    suggested_action: result.suggested_action || {},
    processing_time_ms: result.processing_time_ms || 0,
    total_agents: result.total_agents || 0,
    successful_agents: result.successful_agents || 0,
  });
}

// ─── Settings (Supabase) ──────────────────────────────────────
async function getSettings() {
  const user = await getCurrentUser();
  if (!user) return {};
  const sb = getSupabase();
  const { data } = await sb.from('user_settings').select('*').eq('user_id', user.id).single();
  return data || {};
}

async function updateSettings(settings) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const sb = getSupabase();
  const { error } = await sb.from('user_settings').upsert(
    { user_id: user.id, ...settings },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

// ─── Delete All User Data ─────────────────────────────────────
async function deleteAllUserData() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const sb = getSupabase();
  const uid = user.id;
  // Delete all user data from all tables
  await Promise.all([
    sb.from('journal_entries').delete().eq('user_id', uid),
    sb.from('watchlist').delete().eq('user_id', uid),
    sb.from('chat_messages').delete().eq('user_id', uid),
    sb.from('analysis_history').delete().eq('user_id', uid),
    sb.from('user_settings').delete().eq('user_id', uid),
  ]);
}

// ─── Export ────────────────────────────────────────────────────
window.mavyxSupabase = {
  getSupabase,
  // Auth
  signInWithEmail,
  signUpWithEmail,
  signInWithOAuth,
  signOut,
  getCurrentUser,
  getSession,
  onAuthStateChange,
  // Journal
  getJournal,
  saveJournal,
  updateJournalEntry,
  deleteJournalEntry,
  // Watchlist
  getWatchlistSymbols,
  addToWatchlist,
  removeFromWatchlist,
  // Chat
  getChatHistory,
  saveChatMessage,
  deleteChatHistory,
  // Analysis
  getAnalysisHistory,
  saveAnalysis,
  // Settings
  getSettings,
  updateSettings,
  // Delete
  deleteAllUserData,
};

console.log('[Mavyx] Supabase integration loaded');
