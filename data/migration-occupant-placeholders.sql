-- Migration: Support placeholder occupants in sailing_invites
-- Allows stateroom occupant allocation with placeholder names and optional email invites

-- 1. Make email nullable (currently NOT NULL)
ALTER TABLE sailing_invites ALTER COLUMN email DROP NOT NULL;

-- 2. Add placeholder_name for unregistered occupants (e.g. "Mom", "Uncle Bob")
ALTER TABLE sailing_invites ADD COLUMN placeholder_name TEXT;

-- 3. Add stateroom_number to assign placeholder to a specific room
ALTER TABLE sailing_invites ADD COLUMN stateroom_number INTEGER;

-- 4. Drop the old unique constraint on (sailing_id, email)
ALTER TABLE sailing_invites DROP CONSTRAINT IF EXISTS sailing_invites_sailing_id_email_key;

-- 5. Create partial unique index: only enforce uniqueness when email IS NOT NULL
CREATE UNIQUE INDEX sailing_invites_sailing_email_unique
  ON sailing_invites (sailing_id, email)
  WHERE email IS NOT NULL;

-- 6. Ensure at least one of email or placeholder_name is set
ALTER TABLE sailing_invites ADD CONSTRAINT sailing_invites_has_identifier
  CHECK (email IS NOT NULL OR placeholder_name IS NOT NULL);
