-- Add social URL columns to movie_reviews and foodie_reviews
-- (These tables previously did not have social link columns)

ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS facebook_url TEXT;

ALTER TABLE foodie_reviews ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE foodie_reviews ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE foodie_reviews ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE foodie_reviews ADD COLUMN IF NOT EXISTS facebook_url TEXT;
