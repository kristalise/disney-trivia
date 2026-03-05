-- Migration: Companion Plan Sharing
-- Allow travel party members (sailing owner + companions) to view each other's planner data (read-only).
-- Plans remain independent — each user maintains their own checked/notes state.

-- 1. Index to speed up RLS subqueries on sailing_companions
CREATE INDEX IF NOT EXISTS idx_sailing_companions_companion_sailing
  ON sailing_companions(companion_id, sailing_id);

-- 2. planner_items — expand SELECT to include companions on the same sailing
DROP POLICY IF EXISTS "Users can view own planner items" ON planner_items;

CREATE POLICY "Users can view own or companion planner items"
  ON planner_items FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      -- Requesting user is a companion on the same sailing as the item owner
      SELECT 1 FROM sailing_companions sc
      WHERE sc.sailing_id = planner_items.sailing_id
        AND sc.companion_id = auth.uid()
        AND (
          -- Item belongs to the sailing owner
          planner_items.user_id = (SELECT sr.user_id FROM sailing_reviews sr WHERE sr.id = planner_items.sailing_id)
          -- Or item belongs to another companion on the same sailing
          OR EXISTS (
            SELECT 1 FROM sailing_companions sc2
            WHERE sc2.sailing_id = planner_items.sailing_id
              AND sc2.companion_id = planner_items.user_id
          )
        )
    )
    OR EXISTS (
      -- Requesting user is the sailing owner viewing a companion's items
      SELECT 1 FROM sailing_reviews sr
      WHERE sr.id = planner_items.sailing_id
        AND sr.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM sailing_companions sc
          WHERE sc.sailing_id = planner_items.sailing_id
            AND sc.companion_id = planner_items.user_id
        )
    )
  );

-- 3. pre_cruise_checklist — same pattern
DROP POLICY IF EXISTS "Users can view their own checklist items" ON pre_cruise_checklist;

CREATE POLICY "Users can view own or companion checklist items"
  ON pre_cruise_checklist FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM sailing_companions sc
      WHERE sc.sailing_id = pre_cruise_checklist.sailing_id
        AND sc.companion_id = auth.uid()
        AND (
          pre_cruise_checklist.user_id = (SELECT sr.user_id FROM sailing_reviews sr WHERE sr.id = pre_cruise_checklist.sailing_id)
          OR EXISTS (
            SELECT 1 FROM sailing_companions sc2
            WHERE sc2.sailing_id = pre_cruise_checklist.sailing_id
              AND sc2.companion_id = pre_cruise_checklist.user_id
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM sailing_reviews sr
      WHERE sr.id = pre_cruise_checklist.sailing_id
        AND sr.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM sailing_companions sc
          WHERE sc.sailing_id = pre_cruise_checklist.sailing_id
            AND sc.companion_id = pre_cruise_checklist.user_id
        )
    )
  );

-- 4. adventure_rotations — same pattern
DROP POLICY IF EXISTS "Users can read own adventure rotations" ON adventure_rotations;

CREATE POLICY "Users can view own or companion adventure rotations"
  ON adventure_rotations FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM sailing_companions sc
      WHERE sc.sailing_id = adventure_rotations.sailing_id
        AND sc.companion_id = auth.uid()
        AND (
          adventure_rotations.user_id = (SELECT sr.user_id FROM sailing_reviews sr WHERE sr.id = adventure_rotations.sailing_id)
          OR EXISTS (
            SELECT 1 FROM sailing_companions sc2
            WHERE sc2.sailing_id = adventure_rotations.sailing_id
              AND sc2.companion_id = adventure_rotations.user_id
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM sailing_reviews sr
      WHERE sr.id = adventure_rotations.sailing_id
        AND sr.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM sailing_companions sc
          WHERE sc.sailing_id = adventure_rotations.sailing_id
            AND sc.companion_id = adventure_rotations.user_id
        )
    )
  );
