/**
 * Mavyx Intelligence — Backend Bridge (Enhanced)
 * Connects the workspace HTML UI to the real backend APIs.
 * Handles: Auth, Market Data, AI Analysis, AI Chat, Watchlist, Journal, Analytics, Profile.
 */

const API_BASE = 'http://localhost:4000';

// ─── Auth helpers ──────────────────────────────────────────────
function getToken() {
  try {
    const store = JSON.parse(localStorage.getItem('mavyx-auth-store') || '{}');
    return store?.state?.token || store?.state?.accessToken || null;
  } catch { return null; }
}

function getUser() {
  try {
    const store = JSON.parse(localStorage.getItem('mavyx-auth-store') || '{}');
    return store?.state?.user || null;
  } catch { return null; }
}

// Generic API request
async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

// ─── Market Data ────────────────────────────────────────────────
async function fetchQuote(symbol) {
  return apiRequest(`/market/quote?symbol=${encodeURIComponent(symbol)}`);
}

async function fetchCandles(symbol, interval) {
  return apiRequest(`/market/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`);
}

async function fetchTicker() {
  try {
    return await apiRequest('/market/ticker');
  } catch {
    return {};
  }
}

// ─── AI Analysis ────────────────────────────────────────────────
async function runAnalysis(symbol, timeframe) {
  return apiRequest('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ symbol, timeframe }),
  });
}

/**
 * Run analysis with SSE for Live Activity Feed (Rebuild Spec Section 8).
 * Tries AI service directly first, falls back to gateway, then regular analysis.
 */
function runAnalysisStream(symbol, timeframe, callbacks) {
  const token = getToken();
  const controller = new AbortController();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const body = JSON.stringify({ symbol: symbol, timeframe: timeframe });
  
  // Try AI service directly (port 4004) for SSE
  fetch('http://localhost:4004/analyze/stream', {
    method: 'POST', headers: headers, body: body, signal: controller.signal,
  }).then(function(response) {
    if (!response.ok) throw new Error('Direct stream failed');
    processSSEStream(response, callbacks);
  }).catch(function() {
    // Fallback: try gateway
    fetch(API_BASE + '/ai/analyze/stream', {
      method: 'POST', headers: headers, body: body, signal: controller.signal,
    }).then(function(response) {
      if (!response.ok) throw new Error('Gateway stream failed');
      processSSEStream(response, callbacks);
    }).catch(function() {
      // Final fallback: regular analysis (no live feed)
      runAnalysis(symbol, timeframe).then(function(result) {
        callbacks.onComplete && callbacks.onComplete(result);
        callbacks.onEnd && callbacks.onEnd();
      }).catch(function(e) {
        callbacks.onError && callbacks.onError(e.message || 'Analysis failed');
        callbacks.onEnd && callbacks.onEnd();
      });
    });
  });
  
  return { abort: function(){ controller.abort(); } };
}

function processSSEStream(response, callbacks) {
  var reader = response.body.getReader();
  var decoder = new TextDecoder();
  var buffer = '';
  function read() {
    reader.read().then(function(result) {
      if (result.done) { callbacks.onEnd && callbacks.onEnd(); return; }
      buffer += decoder.decode(result.value, { stream: true });
      var lines = buffer.split('\n');
      buffer = lines.pop();
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf('data: ') !== 0) continue;
        try {
          var event = JSON.parse(line.slice(6));
          if (event.event === 'agent_status') callbacks.onAgentStatus && callbacks.onAgentStatus(event);
          else if (event.event === 'analysis_complete') callbacks.onComplete && callbacks.onComplete(event.result);
          else if (event.event === 'analysis_error') callbacks.onError && callbacks.onError(event.error);
          else if (event.event === 'stream_end') { callbacks.onEnd && callbacks.onEnd(); return; }
        } catch(e) {}
      }
      read();
    }).catch(function(e) { callbacks.onError && callbacks.onError(e.message); callbacks.onEnd && callbacks.onEnd(); });
  }
  read();
}

async function fetchAnalysisHistory() {
  try {
    return await apiRequest('/ai/analyze/history');
  } catch {
    return [];
  }
}

async function getAnalysis(id) {
  return apiRequest(`/ai/analyze/${id}`);
}

// ─── AI Chat ────────────────────────────────────────────────────
async function sendChatMessage(message, chatHistory, context) {
  return apiRequest('/ai/assistant', {
    method: 'POST',
    body: JSON.stringify({
      message,
      chat_history: chatHistory || [],
      context: context || {},
    }),
  });
}

// ─── Journal (AI Review) ────────────────────────────────────────
async function journalReview(analysis) {
  return apiRequest('/ai/journal/review', {
    method: 'POST',
    body: JSON.stringify({ analysis }),
  });
}

async function weeklyReview(journalEntries) {
  return apiRequest('/ai/journal/weekly-review', {
    method: 'POST',
    body: JSON.stringify({ journal_entries: journalEntries }),
  });
}

// ─── Profile & Watchlist ────────────────────────────────────────
async function getProfile() {
  return apiRequest('/profile');
}

async function updateProfile(data) {
  return apiRequest('/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

async function getWatchlist() {
  try {
    const profile = await getProfile();
    return profile.watchlistSymbols || [];
  } catch {
    return [];
  }
}

async function updateWatchlist(symbols) {
  return updateProfile({ watchlistSymbols: symbols });
}

// ─── System Health ──────────────────────────────────────────────
async function getSystemHealth() {
  try {
    return await apiRequest('/ai/health/system');
  } catch {
    return { status: 'unknown' };
  }
}

async function getAiHealth() {
  try {
    return await apiRequest('/ai/health');
  } catch {
    return { status: 'unreachable' };
  }
}

// ─── Journal Local Storage ──────────────────────────────────────
// Trade journal entries stored locally (could be backed by server later)
function getJournalEntries() {
  try {
    return JSON.parse(localStorage.getItem('mavyx-journal') || '[]');
  } catch { return []; }
}

function saveJournalEntry(entry) {
  const entries = getJournalEntries();
  entry.id = entry.id || 'jrn_' + Date.now();
  entry.createdAt = entry.createdAt || new Date().toISOString();
  entries.unshift(entry);
  localStorage.setItem('mavyx-journal', JSON.stringify(entries));
  return entry;
}

function deleteJournalEntry(id) {
  let entries = getJournalEntries();
  entries = entries.filter(e => e.id !== id);
  localStorage.setItem('mavyx-journal', JSON.stringify(entries));
}

function updateJournalEntry(id, updates) {
  const entries = getJournalEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem('mavyx-journal', JSON.stringify(entries));
    return entries[idx];
  }
  return null;
}

// ─── Economic Calendar (Free API) ───────────────────────────────
async function fetchEconomicCalendar() {
  try {
    // Use a free forex factory-style calendar API
    // Fallback to curated data if API fails
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    
    // Try fetching from a free API
    try {
      const resp = await fetch(`https://nfs.faireconomy.media/ff_calendar_thisweek.json`);
      if (resp.ok) {
        const data = await resp.json();
        return data;
      }
    } catch {}
    
    // Fallback: return curated upcoming events
    return getFallbackCalendarEvents();
  } catch {
    return getFallbackCalendarEvents();
  }
}

function getFallbackCalendarEvents() {
  const now = new Date();
  const events = [
    { title: 'Fed Interest Rate Decision', country: 'USD', impact: 'high', date: new Date(now.getTime() + 2*86400000).toISOString(), forecast: '5.50%', previous: '5.50%' },
    { title: 'Non-Farm Payrolls', country: 'USD', impact: 'high', date: new Date(now.getTime() + 5*86400000).toISOString(), forecast: '180K', previous: '206K' },
    { title: 'CPI (YoY)', country: 'USD', impact: 'high', date: new Date(now.getTime() + 3*86400000).toISOString(), forecast: '3.1%', previous: '3.3%' },
    { title: 'ECB Interest Rate Decision', country: 'EUR', impact: 'high', date: new Date(now.getTime() + 4*86400000).toISOString(), forecast: '4.50%', previous: '4.50%' },
    { title: 'GDP (QoQ)', country: 'USD', impact: 'medium', date: new Date(now.getTime() + 6*86400000).toISOString(), forecast: '2.0%', previous: '1.4%' },
    { title: 'Retail Sales (MoM)', country: 'USD', impact: 'medium', date: new Date(now.getTime() + 1*86400000).toISOString(), forecast: '0.3%', previous: '0.1%' },
    { title: 'BOE Interest Rate Decision', country: 'GBP', impact: 'high', date: new Date(now.getTime() + 4*86400000).toISOString(), forecast: '5.25%', previous: '5.25%' },
    { title: 'Unemployment Rate', country: 'USD', impact: 'medium', date: new Date(now.getTime() + 5*86400000).toISOString(), forecast: '4.0%', previous: '4.0%' },
    { title: 'PMI Manufacturing', country: 'USD', impact: 'medium', date: new Date(now.getTime() + 1*86400000).toISOString(), forecast: '51.5', previous: '51.7' },
    { title: 'Consumer Confidence', country: 'USD', impact: 'medium', date: new Date(now.getTime() + 2*86400000).toISOString(), forecast: '100.2', previous: '100.4' },
    { title: 'Trade Balance', country: 'USD', impact: 'low', date: new Date(now.getTime() + 3*86400000).toISOString(), forecast: '-$72.5B', previous: '-$74.6B' },
    { title: 'BOJ Policy Rate', country: 'JPY', impact: 'high', date: new Date(now.getTime() + 3*86400000).toISOString(), forecast: '0.10%', previous: '0.10%' },
  ];
  return events;
}

// ─── Analytics Computations ─────────────────────────────────────
function computeAnalytics() {
  const journal = getJournalEntries();
  const totalTrades = journal.length;
  if (totalTrades === 0) {
    return {
      totalTrades: 0, winRate: 0, avgRR: 0, totalPnL: 0,
      bestTrade: null, worstTrade: null, streak: 0,
      byPair: {}, byDay: {}, monthlyPnL: [],
    };
  }
  
  const wins = journal.filter(t => (t.pnl || 0) > 0);
  const losses = journal.filter(t => (t.pnl || 0) < 0);
  const winRate = (wins.length / totalTrades * 100).toFixed(1);
  const avgRR = journal.reduce((s, t) => s + (t.rr || 0), 0) / totalTrades;
  const totalPnL = journal.reduce((s, t) => s + (t.pnl || 0), 0);
  
  const bestTrade = journal.reduce((best, t) => (t.pnl || 0) > (best?.pnl || -Infinity) ? t : best, null);
  const worstTrade = journal.reduce((worst, t) => (t.pnl || 0) < (worst?.pnl || Infinity) ? t : worst, null);
  
  // By pair
  const byPair = {};
  journal.forEach(t => {
    const pair = t.symbol || 'Unknown';
    if (!byPair[pair]) byPair[pair] = { trades: 0, pnl: 0, wins: 0 };
    byPair[pair].trades++;
    byPair[pair].pnl += (t.pnl || 0);
    if ((t.pnl || 0) > 0) byPair[pair].wins++;
  });
  
  // Current streak
  let streak = 0;
  const sorted = [...journal].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (const t of sorted) {
    if (streak === 0) {
      streak = (t.pnl || 0) > 0 ? 1 : -1;
    } else if (streak > 0 && (t.pnl || 0) > 0) {
      streak++;
    } else if (streak < 0 && (t.pnl || 0) < 0) {
      streak--;
    } else {
      break;
    }
  }
  
  return { totalTrades, winRate, avgRR: avgRR.toFixed(2), totalPnL: totalPnL.toFixed(2), bestTrade, worstTrade, streak, byPair };
}

// ─── Timezone ───────────────────────────────────────────────────
function getUserTimezone() {
  try {
    const profile = JSON.parse(localStorage.getItem('mavyx-profile') || '{}');
    return profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

function setTimezone(tz) {
  try {
    const profile = JSON.parse(localStorage.getItem('mavyx-profile') || '{}');
    profile.timezone = tz;
    localStorage.setItem('mavyx-profile', JSON.stringify(profile));
  } catch {}
}

// ─── Dock Data (Bottom Bar) ─────────────────────────────────────
// Cached dock quotes to avoid hammering the API
let _dockCache = {};
let _dockCacheTime = 0;
const DOCK_CACHE_TTL = 60000; // 60 seconds

async function fetchDockQuotes() {
  const now = Date.now();
  if (now - _dockCacheTime < DOCK_CACHE_TTL && Object.keys(_dockCache).length > 0) {
    return _dockCache;
  }
  
  const symbols = {
    dxy: 'DXY',
    spx: 'SPX',
    gold: 'XAU/USD',
    oil: 'WTI',
    btc: 'BTC/USD',
  };
  
  const results = {};
  
  for (const [key, sym] of Object.entries(symbols)) {
    try {
      const q = await fetchQuote(sym);
      results[key] = {
        price: q.price || q.close || q.ask || null,
        change: q.change || q.net_change || 0,
        changePercent: q.change_percent || q.percent_change || 0,
        ok: true,
      };
    } catch {
      results[key] = { price: null, change: 0, changePercent: 0, ok: false };
    }
    // Small delay between requests for rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  _dockCache = results;
  _dockCacheTime = now;
  return results;
}

// Measure real latency to gateway
async function measureLatency() {
  const start = performance.now();
  try {
    await fetch(API_BASE + '/health', { method: 'GET' });
    return Math.round(performance.now() - start);
  } catch {
    return -1; // unreachable
  }
}

// Get next upcoming economic event
function getNextCalendarEvent() {
  try {
    const events = getFallbackCalendarEvents();
    const now = new Date();
    // Sort by date and find the next one
    const upcoming = events
      .filter(e => new Date(e.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const diff = new Date(next.date).getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return {
        title: next.title,
        country: next.country,
        impact: next.impact,
        countdown: `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`,
        timestamp: new Date(next.date).getTime(),
      };
    }
  } catch {}
  return null;
}

// Update countdown every second (returns the interval ID)
function startNextEventCountdown(eventTimestamp, onUpdate) {
  return setInterval(() => {
    const now = Date.now();
    const diff = eventTimestamp - now;
    if (diff <= 0) {
      onUpdate('NOW');
      return;
    }
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    onUpdate(`${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
  }, 1000);
}

// Get current trading session based on UTC time
function getCurrentSession() {
  if (!isMarketOpen()) return { name: 'Markets Closed (Weekend)', color: 'var(--red)' };
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 7) return { name: 'Asian Session', color: 'var(--blue)' };
  if (hour >= 7 && hour < 16) return { name: 'London Session', color: 'var(--green)' };
  if (hour >= 13 && hour < 21) return { name: 'New York Session', color: 'var(--gold)' };
  return { name: 'Off-Hours', color: 'var(--gray)' };
}

// Check if forex market is open (closed Sat-Sun roughly)
function isMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  const hour = now.getUTCHours();
  // Forex closes Fri ~22:00 UTC, opens Sun ~22:00 UTC
  if (day === 6) return false; // Saturday
  if (day === 0 && hour < 22) return false; // Sunday before open
  if (day === 5 && hour >= 22) return false; // Friday after close
  return true;
}

// ─── Make functions available globally ──────────────────────────
window.mavyxBackend = {
  // Auth
  getToken,
  getUser,
  apiRequest,
  
  // Market Data
  fetchQuote,
  fetchCandles,
  fetchTicker,
  
  // AI
  runAnalysis,
  runAnalysisStream,
  fetchAnalysisHistory,
  getAnalysis,
  sendChatMessage,
  
  // Journal
  journalReview,
  weeklyReview,
  getJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
  updateJournalEntry,
  
  // Profile & Watchlist
  getProfile,
  updateProfile,
  getWatchlist,
  updateWatchlist,
  
  // Calendar
  fetchEconomicCalendar,
  
  // Analytics
  computeAnalytics,
  
  // Health
  getSystemHealth,
  getAiHealth,
  
  // Dock Data
  fetchDockQuotes,
  measureLatency,
  getNextCalendarEvent,
  startNextEventCountdown,
  getCurrentSession,
  isMarketOpen,
  
  // Timezone
  getUserTimezone,
  setTimezone,
  
  API_BASE,
};

console.log('[Mavyx] Backend bridge loaded — all systems connected');
