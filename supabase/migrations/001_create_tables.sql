-- Mavyx Intelligence — Supabase Schema
-- Run this in your Supabase SQL Editor

-- ============================================================
-- 1. Journal Entries
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL DEFAULT 'EUR/USD',
  direction TEXT NOT NULL DEFAULT 'buy' CHECK (direction IN ('buy', 'sell')),
  entry_price TEXT,
  exit_price TEXT,
  stop_loss TEXT,
  take_profit TEXT,
  pnl NUMERIC DEFAULT 0,
  rr NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'planned', 'cancelled')),
  tags TEXT[] DEFAULT '{}',
  analysis_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own journal" ON journal_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_journal_user ON journal_entries(user_id, created_at DESC);

-- ============================================================
-- 2. Watchlist
-- ============================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, symbol)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_watchlist_user ON watchlist(user_id, sort_order);

-- ============================================================
-- 3. Chat Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'assistant' CHECK (channel IN ('assistant', 'live')),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_chat_user_channel ON chat_messages(user_id, channel, created_at);

-- ============================================================
-- 4. Analysis History
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT DEFAULT '4h',
  confidence INTEGER DEFAULT 0,
  recommendation TEXT DEFAULT 'wait',
  executive_summary TEXT DEFAULT '',
  agent_consensus JSONB DEFAULT '{}',
  suggested_action JSONB DEFAULT '{}',
  processing_time_ms INTEGER DEFAULT 0,
  total_agents INTEGER DEFAULT 0,
  successful_agents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own analysis" ON analysis_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_analysis_user ON analysis_history(user_id, created_at DESC);

-- ============================================================
-- 5. User Settings
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  theme TEXT DEFAULT 'matte',
  accent TEXT DEFAULT 'gold',
  notification_prefs JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. Updated-at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
