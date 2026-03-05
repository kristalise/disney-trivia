-- Make sailing review rating columns nullable to support future (unreviewed) sailings
-- Run this migration against your Supabase database

ALTER TABLE sailing_reviews ALTER COLUMN overall_rating DROP NOT NULL;
ALTER TABLE sailing_reviews ALTER COLUMN service_rating DROP NOT NULL;
ALTER TABLE sailing_reviews ALTER COLUMN entertainment_rating DROP NOT NULL;
ALTER TABLE sailing_reviews ALTER COLUMN food_rating DROP NOT NULL;

-- Drop the old CHECK constraints and re-add them to allow NULL
ALTER TABLE sailing_reviews DROP CONSTRAINT IF EXISTS sailing_reviews_overall_rating_check;
ALTER TABLE sailing_reviews DROP CONSTRAINT IF EXISTS sailing_reviews_service_rating_check;
ALTER TABLE sailing_reviews DROP CONSTRAINT IF EXISTS sailing_reviews_entertainment_rating_check;
ALTER TABLE sailing_reviews DROP CONSTRAINT IF EXISTS sailing_reviews_food_rating_check;

ALTER TABLE sailing_reviews ADD CONSTRAINT sailing_reviews_overall_rating_check CHECK (overall_rating IS NULL OR overall_rating BETWEEN 1 AND 5);
ALTER TABLE sailing_reviews ADD CONSTRAINT sailing_reviews_service_rating_check CHECK (service_rating IS NULL OR service_rating BETWEEN 1 AND 5);
ALTER TABLE sailing_reviews ADD CONSTRAINT sailing_reviews_entertainment_rating_check CHECK (entertainment_rating IS NULL OR entertainment_rating BETWEEN 1 AND 5);
ALTER TABLE sailing_reviews ADD CONSTRAINT sailing_reviews_food_rating_check CHECK (food_rating IS NULL OR food_rating BETWEEN 1 AND 5);

-- Add UPDATE RLS policy if not exists (needed for editing sailings)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sailing_reviews' AND policyname = 'Users can update own sailing reviews'
  ) THEN
    CREATE POLICY "Users can update own sailing reviews" ON sailing_reviews FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END
$$;
