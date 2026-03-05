-- Migration: Create review tables for Secret Menu features
-- Run this in your Supabase SQL editor

-- ============================================================
-- 1. sailing_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS sailing_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ship_name TEXT NOT NULL,
  sail_start_date DATE NOT NULL,
  sail_end_date DATE NOT NULL,
  itinerary_name TEXT,
  embarkation_port TEXT NOT NULL,
  ports_of_call TEXT,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  service_rating INTEGER NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
  entertainment_rating INTEGER NOT NULL CHECK (entertainment_rating BETWEEN 1 AND 5),
  food_rating INTEGER NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
  review_text TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sailing_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sailing reviews"
  ON sailing_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own sailing reviews"
  ON sailing_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sailing reviews"
  ON sailing_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. dining_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS dining_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ship_name TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  dietary_restrictions TEXT[],
  dietary_accommodation_rating INTEGER CHECK (dietary_accommodation_rating BETWEEN 1 AND 5),
  review_text TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE dining_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dining reviews"
  ON dining_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own dining reviews"
  ON dining_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dining reviews"
  ON dining_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. activity_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ship_name TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  age_group_recommended TEXT[],
  review_text TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activity reviews"
  ON activity_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own activity reviews"
  ON activity_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity reviews"
  ON activity_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. cruise_hack_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS cruise_hack_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ship_name TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  hack_text TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('Must Try', 'Worth It', 'Skip It')),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cruise_hack_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cruise hack reviews"
  ON cruise_hack_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own cruise hack reviews"
  ON cruise_hack_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cruise hack reviews"
  ON cruise_hack_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. Storage bucket for review photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view review photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own review photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
