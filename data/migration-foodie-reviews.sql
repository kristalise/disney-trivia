-- Foodie Reviews System
-- Tables: foodie_reviews, foodie_review_photos, foodie_review_companions, adventure_rotations

-- Reviews
CREATE TABLE foodie_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id TEXT NOT NULL,
  sailing_id UUID REFERENCES sailing_reviews(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sailing_id, venue_id)
);

-- Review photos (max 10 per review, enforced in API)
CREATE TABLE foodie_review_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES foodie_reviews(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visited-with companions (from sailing companions)
CREATE TABLE foodie_review_companions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES foodie_reviews(id) ON DELETE CASCADE NOT NULL,
  companion_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(review_id, companion_user_id)
);

-- Adventure rotation per sailing
CREATE TABLE adventure_rotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sailing_id UUID REFERENCES sailing_reviews(id) ON DELETE CASCADE NOT NULL,
  rotation INTEGER NOT NULL CHECK (rotation IN (1, 2)),
  UNIQUE(user_id, sailing_id)
);

-- Indexes
CREATE INDEX idx_foodie_reviews_venue ON foodie_reviews(venue_id);
CREATE INDEX idx_foodie_reviews_user ON foodie_reviews(user_id);
CREATE INDEX idx_foodie_reviews_sailing ON foodie_reviews(sailing_id);
CREATE INDEX idx_foodie_review_photos_review ON foodie_review_photos(review_id);
CREATE INDEX idx_foodie_review_companions_review ON foodie_review_companions(review_id);
CREATE INDEX idx_adventure_rotations_user_sailing ON adventure_rotations(user_id, sailing_id);

-- RLS Policies
ALTER TABLE foodie_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE foodie_review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE foodie_review_companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_rotations ENABLE ROW LEVEL SECURITY;

-- foodie_reviews: anyone can read, users can CUD own rows
CREATE POLICY "Anyone can read foodie reviews"
  ON foodie_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own foodie reviews"
  ON foodie_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own foodie reviews"
  ON foodie_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own foodie reviews"
  ON foodie_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- foodie_review_photos: anyone can read, managed via review ownership
CREATE POLICY "Anyone can read foodie review photos"
  ON foodie_review_photos FOR SELECT
  USING (true);

CREATE POLICY "Users can insert photos for own reviews"
  ON foodie_review_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM foodie_reviews WHERE id = review_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete photos for own reviews"
  ON foodie_review_photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM foodie_reviews WHERE id = review_id AND user_id = auth.uid()
  ));

-- foodie_review_companions: anyone can read, managed via review ownership
CREATE POLICY "Anyone can read foodie review companions"
  ON foodie_review_companions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert companions for own reviews"
  ON foodie_review_companions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM foodie_reviews WHERE id = review_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete companions for own reviews"
  ON foodie_review_companions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM foodie_reviews WHERE id = review_id AND user_id = auth.uid()
  ));

-- adventure_rotations: users can CUD own rows
CREATE POLICY "Users can read own adventure rotations"
  ON adventure_rotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adventure rotations"
  ON adventure_rotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adventure rotations"
  ON adventure_rotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own adventure rotations"
  ON adventure_rotations FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for foodie review photos
INSERT INTO storage.buckets (id, name, public) VALUES ('foodie-photos', 'foodie-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read foodie photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'foodie-photos');

CREATE POLICY "Authenticated users can upload foodie photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'foodie-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own foodie photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'foodie-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
