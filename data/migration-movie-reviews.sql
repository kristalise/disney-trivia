-- Movie Reviews table
-- Community reviews for Disney movies (separate from personal movie_checklist)

CREATE TABLE IF NOT EXISTS movie_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_movie_reviews_movie_id ON movie_reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_reviews_user_id ON movie_reviews(user_id);

-- RLS
ALTER TABLE movie_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "movie_reviews_select" ON movie_reviews
  FOR SELECT USING (true);

-- Authenticated users can insert their own reviews
CREATE POLICY "movie_reviews_insert" ON movie_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "movie_reviews_update" ON movie_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "movie_reviews_delete" ON movie_reviews
  FOR DELETE USING (auth.uid() = user_id);
