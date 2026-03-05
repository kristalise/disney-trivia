-- ============================================================
-- Handle-based Profile URLs Migration
-- ============================================================

-- 1. Add handle column to user_profiles
ALTER TABLE user_profiles ADD COLUMN handle TEXT UNIQUE;

-- 2. Index for fast handle lookups
CREATE INDEX idx_user_profiles_handle ON user_profiles (handle);

-- 3. Backfill existing users: derive handle from email username
UPDATE user_profiles
SET handle = lower(regexp_replace(split_part(u.email, '@', 1), '[^a-z0-9_]', '', 'g'))
FROM auth.users u
WHERE user_profiles.id = u.id
  AND user_profiles.handle IS NULL;

-- 4. Update the trigger to also generate a handle on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name, handle)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9_]', '', 'g'))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
