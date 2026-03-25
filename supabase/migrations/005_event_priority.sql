-- Add priority column to calendar_events
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium'
CHECK (priority IN ('high', 'medium', 'low'));
