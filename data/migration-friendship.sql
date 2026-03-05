-- Migration: Friendship (met_on_ship)
-- Auto-created when mutual follow detected + shared sailing

CREATE TABLE IF NOT EXISTS met_on_ship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sailing_id_a UUID NOT NULL REFERENCES sailing_reviews(id) ON DELETE CASCADE,
  sailing_id_b UUID NOT NULL REFERENCES sailing_reviews(id) ON DELETE CASCADE,
  ship_name TEXT NOT NULL,
  sail_date_overlap_start DATE NOT NULL,
  sail_date_overlap_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT met_on_ship_canonical_order CHECK (user_a < user_b),
  UNIQUE(user_a, user_b)
);

CREATE INDEX IF NOT EXISTS idx_met_on_ship_user_a ON met_on_ship(user_a);
CREATE INDEX IF NOT EXISTS idx_met_on_ship_user_b ON met_on_ship(user_b);

-- RLS
ALTER TABLE met_on_ship ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own met_on_ship records"
  ON met_on_ship FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Service can insert met_on_ship records"
  ON met_on_ship FOR INSERT
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
