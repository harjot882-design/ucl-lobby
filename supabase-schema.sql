-- ============================================================
-- UCL LOBBY GUESSER — SUPABASE SCHEMA
-- Paste into: Supabase → SQL Editor → Run
-- ============================================================

DROP TABLE IF EXISTS rooms CASCADE;

CREATE TABLE rooms (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,

  -- Lobby state
  phase         TEXT NOT NULL DEFAULT 'waiting',
  -- phases: waiting | picking | writing_clues | guessing | reveal

  -- Up to 4 players stored as JSONB array
  -- Each player: { id, name, slot (1-4), role: 'chooser'|'guesser', score }
  players       JSONB DEFAULT '[]'::JSONB,

  -- The chooser's secret player name
  secret_player TEXT,

  -- Clues written by chooser (array of 3 strings)
  clues         TEXT[],

  -- Questions per guesser: { slot: { questions: [{q, a}], guesses: 0, correct: false, guessOrder: null } }
  guesser_data  JSONB DEFAULT '{}'::JSONB,

  -- Who is the chooser (slot number 1-4)
  chooser_slot  INTEGER,

  -- Scores: { "1": 0, "2": 0, "3": 0, "4": 0 }
  scores        JSONB DEFAULT '{}'::JSONB,

  -- Round tracking
  round         INTEGER DEFAULT 1,

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read rooms"   ON rooms FOR SELECT USING (true);
CREATE POLICY "insert rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "update rooms" ON rooms FOR UPDATE USING (true);
CREATE POLICY "delete rooms" ON rooms FOR DELETE USING (true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
