-- Migration: Unified Sailing-Centric Review System
-- Makes sailing the parent record that all other reviews link to.

-- 1. Add sailing_id FK to child review tables (optional, backwards compatible)
ALTER TABLE stateroom_reviews ADD COLUMN IF NOT EXISTS sailing_id UUID REFERENCES sailing_reviews(id);
ALTER TABLE dining_reviews ADD COLUMN IF NOT EXISTS sailing_id UUID REFERENCES sailing_reviews(id);
ALTER TABLE activity_reviews ADD COLUMN IF NOT EXISTS sailing_id UUID REFERENCES sailing_reviews(id);

-- 2. Add passenger/cost detail columns to sailing_reviews
ALTER TABLE sailing_reviews ADD COLUMN IF NOT EXISTS adults INTEGER;
ALTER TABLE sailing_reviews ADD COLUMN IF NOT EXISTS children INTEGER;
ALTER TABLE sailing_reviews ADD COLUMN IF NOT EXISTS infants INTEGER;
ALTER TABLE sailing_reviews ADD COLUMN IF NOT EXISTS occasions TEXT;
ALTER TABLE sailing_reviews ADD COLUMN IF NOT EXISTS purchased_from TEXT;
ALTER TABLE sailing_reviews ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,2);
ALTER TABLE sailing_reviews ADD COLUMN IF NOT EXISTS disembarkation_port TEXT;

-- 3. New table: sailing_companions (fellow sailors who are registered users)
CREATE TABLE IF NOT EXISTS sailing_companions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sailing_id UUID NOT NULL REFERENCES sailing_reviews(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sailing_id, companion_id)
);

-- 4. New table: sailing_invites (for non-registered friends invited by email)
CREATE TABLE IF NOT EXISTS sailing_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sailing_id UUID NOT NULL REFERENCES sailing_reviews(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sailing_id, email)
);

-- 5. RLS policies

-- sailing_companions: public read, auth write for own data
ALTER TABLE sailing_companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sailing_companions_select" ON sailing_companions
  FOR SELECT USING (true);

CREATE POLICY "sailing_companions_insert" ON sailing_companions
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM sailing_reviews WHERE id = sailing_id)
  );

CREATE POLICY "sailing_companions_delete" ON sailing_companions
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM sailing_reviews WHERE id = sailing_id)
  );

-- sailing_invites: public read, auth write for own data
ALTER TABLE sailing_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sailing_invites_select" ON sailing_invites
  FOR SELECT USING (true);

CREATE POLICY "sailing_invites_insert" ON sailing_invites
  FOR INSERT WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "sailing_invites_delete" ON sailing_invites
  FOR DELETE USING (auth.uid() = invited_by);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stateroom_reviews_sailing_id ON stateroom_reviews(sailing_id);
CREATE INDEX IF NOT EXISTS idx_dining_reviews_sailing_id ON dining_reviews(sailing_id);
CREATE INDEX IF NOT EXISTS idx_activity_reviews_sailing_id ON activity_reviews(sailing_id);
CREATE INDEX IF NOT EXISTS idx_sailing_companions_sailing_id ON sailing_companions(sailing_id);
CREATE INDEX IF NOT EXISTS idx_sailing_companions_companion_id ON sailing_companions(companion_id);
CREATE INDEX IF NOT EXISTS idx_sailing_invites_sailing_id ON sailing_invites(sailing_id);
