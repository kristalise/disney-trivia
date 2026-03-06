-- Add xiaohongshu_url column to all tables that have social URL columns

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS xiaohongshu_url TEXT;
ALTER TABLE venue_reviews ADD COLUMN IF NOT EXISTS xiaohongshu_url TEXT;
ALTER TABLE activity_reviews ADD COLUMN IF NOT EXISTS xiaohongshu_url TEXT;
ALTER TABLE dining_reviews ADD COLUMN IF NOT EXISTS xiaohongshu_url TEXT;
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS xiaohongshu_url TEXT;
ALTER TABLE foodie_reviews ADD COLUMN IF NOT EXISTS xiaohongshu_url TEXT;
