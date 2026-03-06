-- ============================================================
-- Fix Supabase Security Lints
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. Fix: Function search_path mutable — update_question_reliability
-- ============================================================
CREATE OR REPLACE FUNCTION update_question_reliability()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.questions
  SET
    total_ratings = total_ratings + 1,
    reliable_ratings = reliable_ratings + CASE WHEN NEW.is_reliable THEN 1 ELSE 0 END,
    reliability_score = (reliable_ratings + CASE WHEN NEW.is_reliable THEN 1 ELSE 0 END)::DECIMAL / (total_ratings + 1)
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 2. Fix: Function search_path mutable — handle_new_user
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, handle)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9_]', '', 'g'))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  INSERT INTO public.user_profiles (id, display_name, handle)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9_]', '', 'g')) || '_' || substr(gen_random_uuid()::text, 1, 4)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 3. Fix: Function search_path mutable — is_meetup_owner
-- ============================================================
-- Recreate with search_path set (preserving existing logic)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_meetup_owner') THEN
    EXECUTE (
      SELECT 'CREATE OR REPLACE FUNCTION public.is_meetup_owner(' ||
             pg_get_function_arguments(p.oid) || ') RETURNS ' ||
             pg_get_function_result(p.oid) || ' AS ' ||
             quote_literal(prosrc) ||
             ' LANGUAGE ' || l.lanname ||
             CASE WHEN p.prosecdef THEN ' SECURITY DEFINER' ELSE '' END ||
             ' SET search_path = public'
      FROM pg_proc p
      JOIN pg_language l ON p.prolang = l.oid
      WHERE p.proname = 'is_meetup_owner'
        AND p.pronamespace = 'public'::regnamespace
      LIMIT 1
    );
  END IF;
END $$;

-- ============================================================
-- 4. Fix: Function search_path mutable — is_tagged_in_meetup
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_tagged_in_meetup') THEN
    EXECUTE (
      SELECT 'CREATE OR REPLACE FUNCTION public.is_tagged_in_meetup(' ||
             pg_get_function_arguments(p.oid) || ') RETURNS ' ||
             pg_get_function_result(p.oid) || ' AS ' ||
             quote_literal(prosrc) ||
             ' LANGUAGE ' || l.lanname ||
             CASE WHEN p.prosecdef THEN ' SECURITY DEFINER' ELSE '' END ||
             ' SET search_path = public'
      FROM pg_proc p
      JOIN pg_language l ON p.prolang = l.oid
      WHERE p.proname = 'is_tagged_in_meetup'
        AND p.pronamespace = 'public'::regnamespace
      LIMIT 1
    );
  END IF;
END $$;

-- ============================================================
-- 5. Fix: RLS policy always true — question_ratings INSERT
--    Allow authenticated users or anonymous sessions (not wide open)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert ratings" ON question_ratings;
CREATE POLICY "Anyone can insert ratings" ON question_ratings
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR session_id IS NOT NULL);

-- ============================================================
-- 6. Fix: RLS policy always true — questions INSERT
--    Require authentication to insert questions
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert questions" ON questions;
CREATE POLICY "Anyone can insert questions" ON questions
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 7. Fix: RLS policy always true — waitlist INSERT
--    Drop the overly-permissive separate INSERT policy if it exists,
--    keep the service_role-only FOR ALL policy
-- ============================================================
DROP POLICY IF EXISTS "Service role can insert" ON waitlist;
-- Ensure the FOR ALL policy has a WITH CHECK clause too
DROP POLICY IF EXISTS "Service role full access to waitlist" ON waitlist;
CREATE POLICY "Service role full access to waitlist"
  ON waitlist FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 8. Leaked Password Protection
--    This must be enabled in the Supabase Dashboard:
--    Authentication > Settings > Password Security >
--    Enable "Leaked Password Protection"
-- ============================================================
-- (Cannot be set via SQL — see dashboard instructions above)
