-- Castaway Tips table
CREATE TABLE IF NOT EXISTS castaway_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  castaway_level TEXT NOT NULL CHECK (castaway_level IN ('new', 'silver', 'gold', 'platinum', 'pearl')),
  category TEXT NOT NULL CHECK (category IN ('Embarkation', 'Dining', 'Packing', 'Saving Money', 'Kids', 'First-Time')),
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  tip_text TEXT NOT NULL CHECK (char_length(tip_text) <= 2000),
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upvotes junction table
CREATE TABLE IF NOT EXISTS castaway_tip_upvotes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_id UUID NOT NULL REFERENCES castaway_tips(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tip_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_castaway_tips_level ON castaway_tips(castaway_level);
CREATE INDEX IF NOT EXISTS idx_castaway_tips_category ON castaway_tips(category);
CREATE INDEX IF NOT EXISTS idx_castaway_tips_upvotes ON castaway_tips(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_castaway_tip_upvotes_tip ON castaway_tip_upvotes(tip_id);

-- RLS
ALTER TABLE castaway_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE castaway_tip_upvotes ENABLE ROW LEVEL SECURITY;

-- Read access for all
CREATE POLICY "Anyone can read castaway tips" ON castaway_tips FOR SELECT USING (true);
CREATE POLICY "Anyone can read tip upvotes" ON castaway_tip_upvotes FOR SELECT USING (true);

-- Auth users can insert their own
CREATE POLICY "Auth users can insert tips" ON castaway_tips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can upvote" ON castaway_tip_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can remove own upvote" ON castaway_tip_upvotes FOR DELETE USING (auth.uid() = user_id);
