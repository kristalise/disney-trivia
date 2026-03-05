-- Migration: Create stateroom_reviews table
-- Run this AFTER migration-reviews.sql and BEFORE migration-sailing-unified.sql

CREATE TABLE IF NOT EXISTS stateroom_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ship_name TEXT NOT NULL,
  stateroom_number INTEGER NOT NULL,
  sail_start_date DATE NOT NULL,
  sail_end_date DATE NOT NULL,
  stateroom_rating INTEGER NOT NULL CHECK (stateroom_rating BETWEEN 1 AND 5),
  sailing_rating INTEGER CHECK (sailing_rating BETWEEN 1 AND 5),
  num_passengers INTEGER NOT NULL CHECK (num_passengers BETWEEN 1 AND 20),
  adults INTEGER DEFAULT 0,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  occasions TEXT,
  boarding_port TEXT NOT NULL,
  ports_of_call TEXT,
  departure_port TEXT NOT NULL,
  purchased_from TEXT,
  price_paid NUMERIC(10,2),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ship_name, stateroom_number, sail_start_date)
);

CREATE INDEX IF NOT EXISTS idx_stateroom_reviews_ship_room ON stateroom_reviews(ship_name, stateroom_number);
CREATE INDEX IF NOT EXISTS idx_stateroom_reviews_user ON stateroom_reviews(user_id);

ALTER TABLE stateroom_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stateroom reviews"
  ON stateroom_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own stateroom reviews"
  ON stateroom_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stateroom reviews"
  ON stateroom_reviews FOR DELETE
  USING (auth.uid() = user_id);
