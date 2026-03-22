-- ============================================================
-- LetterWiki — Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. documents table
-- ------------------------------------------------------------
CREATE TABLE documents (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id  uuid        REFERENCES documents(id) ON DELETE CASCADE,  -- null = root document
  title      text        NOT NULL DEFAULT '제목 없음',
  content    jsonb,          -- TipTap JSON output
  icon       text,           -- emoji or icon name
  cover_url  text,           -- cover image URL
  is_favorite boolean    NOT NULL DEFAULT false,
  sort_order integer     NOT NULL DEFAULT 0,  -- for ordering siblings
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. calendar_events table
-- ------------------------------------------------------------
CREATE TABLE calendar_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  start_at    timestamptz NOT NULL,
  end_at      timestamptz,
  all_day     boolean     NOT NULL DEFAULT false,
  color       text        DEFAULT '#0054FF',   -- Payletter Blue default
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. event_document_links table (backlinks)
-- ------------------------------------------------------------
CREATE TABLE event_document_links (
  event_id    uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id)       ON DELETE CASCADE,
  PRIMARY KEY (event_id, document_id)
);

-- ------------------------------------------------------------
-- 4. Indexes
-- ------------------------------------------------------------
CREATE INDEX idx_documents_user_id    ON documents(user_id);
CREATE INDEX idx_documents_parent_id  ON documents(parent_id);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);

CREATE INDEX idx_calendar_events_user_id  ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_at ON calendar_events(start_at);

-- ------------------------------------------------------------
-- 5. updated_at auto-trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------

-- Enable RLS
ALTER TABLE documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_document_links ENABLE ROW LEVEL SECURITY;

-- documents: users can only CRUD their own rows
CREATE POLICY "documents: select own" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "documents: insert own" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents: update own" ON documents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents: delete own" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- calendar_events: same pattern
CREATE POLICY "events: select own" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "events: insert own" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events: update own" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events: delete own" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- event_document_links: allow if user owns the event
CREATE POLICY "links: select own" ON event_document_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE id = event_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "links: insert own" ON event_document_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE id = event_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "links: delete own" ON event_document_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE id = event_id AND user_id = auth.uid()
    )
  );
