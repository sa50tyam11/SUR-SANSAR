-- Create custom types
CREATE TYPE region_type AS ENUM ('North', 'South', 'East', 'West', 'Northeast', 'Central', 'Unknown');
CREATE TYPE license_type AS ENUM ('CC-BY', 'AI-Generated', 'Licensed');

-- Create states table
CREATE TABLE states (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    region region_type NOT NULL DEFAULT 'Unknown',
    svg_path_id TEXT NOT NULL UNIQUE,
    cover_image_url TEXT,
    description TEXT
);

-- Create tracks table
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artist TEXT,
    instrument_type TEXT,
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER,
    license_type license_type,
    play_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "States are viewable by everyone" ON states FOR SELECT USING (true);
CREATE POLICY "Tracks are viewable by everyone" ON tracks FOR SELECT USING (true);
