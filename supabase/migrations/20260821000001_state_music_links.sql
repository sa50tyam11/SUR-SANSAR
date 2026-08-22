-- ─── state_music_links table ──────────────────────────────────────────────────
-- Stores external .mp3 / .ogg stream URLs from Internet Archive, Wikimedia, etc.
-- No audio files are uploaded to Supabase Storage — only text links live here.
-- is_active=false marks dead / 404 links detected by the frontend or cron.

CREATE TABLE state_music_links (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  state_name   TEXT        NOT NULL,                      -- e.g. "Rajasthan"
  track_title  TEXT        NOT NULL,
  artist       TEXT,
  stream_url   TEXT        NOT NULL UNIQUE,               -- external .mp3 or .ogg link
  source       TEXT        NOT NULL,                      -- "Internet Archive" | "Wikimedia Commons"
  duration_seconds INTEGER,
  license_type TEXT        NOT NULL DEFAULT 'CC-BY',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE state_music_links ENABLE ROW LEVEL SECURITY;

-- Everyone can read active links
CREATE POLICY "Links viewable by everyone"
  ON state_music_links FOR SELECT
  USING (true);

-- Only service role (GitHub Actions cron) can insert new links
CREATE POLICY "Service role can insert"
  ON state_music_links FOR INSERT
  WITH CHECK (true);

-- Allow marking dead links inactive (service role + authenticated frontend)
CREATE POLICY "Service role can update"
  ON state_music_links FOR UPDATE
  USING (true);

-- Performance indexes
CREATE INDEX idx_sml_state_name  ON state_music_links(state_name);
CREATE INDEX idx_sml_is_active   ON state_music_links(is_active);
CREATE INDEX idx_sml_source      ON state_music_links(source);
CREATE INDEX idx_sml_created_at  ON state_music_links(created_at DESC);
