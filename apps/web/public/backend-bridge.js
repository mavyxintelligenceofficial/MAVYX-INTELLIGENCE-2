/**
 * Mavyx Intelligence — Backend Bridge
 * Connects the workspace HTML UI to the real backend APIs.
 * Inject this script into the workspace.html to make all features functional.
 */

const API_BASE = 'http://localhost:4000';

// Get auth token from localStorage
function getToken() {
  try {
    const store = JSON.parse(localStorage.getItem('mavyx-auth-store') || '{}');
    return store?.state?.token || null;
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

// ─── Make functions available globally ──────────────────────────
window.mavyxBackend = {
  getToken,
  apiRequest,
  fetchQuote,
  fetchCandles,
  fetchTicker,
  runAnalysis,
  sendChatMessage,
  API_BASE,
};

console.log('[Mavyx] Backend bridge loaded');
