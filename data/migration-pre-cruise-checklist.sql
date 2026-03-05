-- Migration: Pre-Cruise Checklist
-- Free-text sailing-scoped checklist (separate from planner_items which references data IDs)

CREATE TABLE IF NOT EXISTS pre_cruise_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sailing_id UUID NOT NULL REFERENCES sailing_reviews(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('items_to_purchase', 'items_to_pack', 'pixie_dust_prep', 'fish_extender')),
  label TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pre_cruise_checklist_user_sailing
  ON pre_cruise_checklist(user_id, sailing_id);

-- RLS
ALTER TABLE pre_cruise_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklist items"
  ON pre_cruise_checklist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklist items"
  ON pre_cruise_checklist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist items"
  ON pre_cruise_checklist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist items"
  ON pre_cruise_checklist FOR DELETE
  USING (auth.uid() = user_id);
