-- Migration: Fix self-referencing RLS policy on fe_group_members
-- The original policy referenced fe_group_members in its own SELECT policy,
-- causing circular RLS evaluation and empty results / errors.
--
-- Fix: Use a SECURITY DEFINER function to safely check group membership
-- without triggering recursive RLS.

-- Step 1: Create a helper function that bypasses RLS to check membership
CREATE OR REPLACE FUNCTION is_fe_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM fe_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- Step 2: Drop the broken policy
DROP POLICY IF EXISTS "Members can view group members" ON fe_group_members;

-- Step 3: Create the fixed policy using the helper function
CREATE POLICY "Members can view group members"
  ON fe_group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT id FROM fe_groups WHERE creator_id = auth.uid())
    OR is_fe_group_member(group_id, auth.uid())
  );
