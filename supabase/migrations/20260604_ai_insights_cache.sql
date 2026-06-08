-- Add AI insight cache columns to shops table
-- These store the generated insight text and when it was generated,
-- so we can serve cached responses for up to 24 hours.

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS ai_insight_text TEXT,
  ADD COLUMN IF NOT EXISTS ai_insight_generated_at TIMESTAMPTZ;
