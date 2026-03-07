-- Migration: Pixie Dusting
-- Fish Extender groups, gift identities, recipients, delivery tracking

-- FE Groups
CREATE TABLE IF NOT EXISTS fe_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailing_id UUID NOT NULL REFERENCES sailing_reviews(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fe_groups_sailing ON fe_groups(sailing_id);
CREATE INDEX IF NOT EXISTS idx_fe_groups_creator ON fe_groups(creator_id);

-- FE Group Members
CREATE TABLE IF NOT EXISTS fe_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES fe_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stateroom_number INTEGER NOT NULL,
  display_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fe_group_members_group ON fe_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_fe_group_members_user ON fe_group_members(user_id);

-- Pixie Gifts (gift type identities per sailing)
CREATE TABLE IF NOT EXISTS pixie_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sailing_id UUID NOT NULL REFERENCES sailing_reviews(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎁',
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pixie_gifts_user_sailing ON pixie_gifts(user_id, sailing_id);

-- Pixie Gift Recipients (staterooms to deliver each gift to)
CREATE TABLE IF NOT EXISTS pixie_gift_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES pixie_gifts(id) ON DELETE CASCADE,
  stateroom_number INTEGER NOT NULL,
  delivered BOOLEAN NOT NULL DEFAULT false,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(gift_id, stateroom_number)
);

CREATE INDEX IF NOT EXISTS idx_pixie_gift_recipients_gift ON pixie_gift_recipients(gift_id);

-- Pixie Dust Log ("Dusted by" tracking)
CREATE TABLE IF NOT EXISTS pixie_dust_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duster_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duster_stateroom INTEGER NOT NULL,
  target_stateroom INTEGER NOT NULL,
  sailing_id UUID NOT NULL REFERENCES sailing_reviews(id) ON DELETE CASCADE,
  ship_name TEXT NOT NULL,
  gift_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(duster_user_id, target_stateroom, sailing_id)
);

CREATE INDEX IF NOT EXISTS idx_pixie_dust_log_sailing ON pixie_dust_log(sailing_id);
CREATE INDEX IF NOT EXISTS idx_pixie_dust_log_target ON pixie_dust_log(target_stateroom, sailing_id);

-- RLS policies

ALTER TABLE fe_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE fe_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixie_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixie_gift_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixie_dust_log ENABLE ROW LEVEL SECURITY;

-- FE Groups: members can view, creator can insert/delete
CREATE POLICY "Members can view their groups"
  ON fe_groups FOR SELECT
  USING (
    auth.uid() = creator_id
    OR id IN (SELECT group_id FROM fe_group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create groups"
  ON fe_groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete groups"
  ON fe_groups FOR DELETE
  USING (auth.uid() = creator_id);

-- FE Group Members
-- NOTE: Avoid self-referencing fe_group_members in its own SELECT policy (causes circular RLS).
-- Instead: allow users to see their own rows + all members of groups they created.
-- The API uses a two-step approach: first get group_ids from own rows, then query members.
CREATE POLICY "Members can view group members"
  ON fe_group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT id FROM fe_groups WHERE creator_id = auth.uid())
  );

CREATE POLICY "Users can join groups"
  ON fe_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON fe_group_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON fe_group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Pixie Gifts
CREATE POLICY "Users can view their own gifts"
  ON pixie_gifts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create gifts"
  ON pixie_gifts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gifts"
  ON pixie_gifts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gifts"
  ON pixie_gifts FOR DELETE
  USING (auth.uid() = user_id);

-- Pixie Gift Recipients
CREATE POLICY "Users can view recipients of their gifts"
  ON pixie_gift_recipients FOR SELECT
  USING (gift_id IN (SELECT id FROM pixie_gifts WHERE user_id = auth.uid()));

CREATE POLICY "Users can add recipients to their gifts"
  ON pixie_gift_recipients FOR INSERT
  WITH CHECK (gift_id IN (SELECT id FROM pixie_gifts WHERE user_id = auth.uid()));

CREATE POLICY "Users can update recipients of their gifts"
  ON pixie_gift_recipients FOR UPDATE
  USING (gift_id IN (SELECT id FROM pixie_gifts WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete recipients of their gifts"
  ON pixie_gift_recipients FOR DELETE
  USING (gift_id IN (SELECT id FROM pixie_gifts WHERE user_id = auth.uid()));

-- Pixie Dust Log: recipients can see dust logs for their stateroom
CREATE POLICY "Dusters can view their own logs"
  ON pixie_dust_log FOR SELECT
  USING (auth.uid() = duster_user_id);

CREATE POLICY "Anyone on sailing can view dust logs for their stateroom"
  ON pixie_dust_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sailing_reviews sr
      WHERE sr.id = pixie_dust_log.sailing_id
        AND sr.user_id = auth.uid()
        AND pixie_dust_log.target_stateroom = ANY(sr.stateroom_numbers)
    )
  );

CREATE POLICY "Users can insert dust logs"
  ON pixie_dust_log FOR INSERT
  WITH CHECK (auth.uid() = duster_user_id);
