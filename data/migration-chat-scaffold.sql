-- Migration: Chat Scaffold
-- Tables only — no app code yet. For future internet-less chat feature.

CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'sailing_group', 'fe_group')),
  phase TEXT NOT NULL DEFAULT 'pre_cruise' CHECK (phase IN ('pre_cruise', 'on_cruise', 'post_cruise')),
  sailing_id UUID REFERENCES sailing_reviews(id) ON DELETE SET NULL,
  fe_group_id UUID REFERENCES fe_groups(id) ON DELETE SET NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at);

-- RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their chat rooms"
  ON chat_rooms FOR SELECT
  USING (id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view room memberships"
  ON chat_room_members FOR SELECT
  USING (room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view messages in their rooms"
  ON chat_messages FOR SELECT
  USING (room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can send messages to their rooms"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
  );
