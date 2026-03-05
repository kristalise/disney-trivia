-- Venue Reviews table for the Venue Explorer system
CREATE TABLE venue_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id TEXT NOT NULL,
  ship_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  atmosphere_rating INTEGER CHECK (atmosphere_rating >= 1 AND atmosphere_rating <= 5),
  theming_rating INTEGER CHECK (theming_rating >= 1 AND theming_rating <= 5),
  visited_with TEXT[],
  review_text TEXT,
  photo_url TEXT,
  sailing_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX venue_reviews_venue_idx ON venue_reviews (venue_id);
CREATE INDEX venue_reviews_ship_venue_idx ON venue_reviews (ship_name, venue_id);
CREATE INDEX venue_reviews_user_idx ON venue_reviews (user_id);

ALTER TABLE venue_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venue reviews viewable by everyone" ON venue_reviews FOR SELECT USING (true);
CREATE POLICY "Auth users can insert venue reviews" ON venue_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own venue reviews" ON venue_reviews FOR UPDATE USING (auth.uid() = user_id);
