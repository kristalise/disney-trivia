-- Character Meetups: track character meet-and-greets per sailing
CREATE TABLE character_meetups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sailing_id UUID REFERENCES sailing_reviews(id) ON DELETE CASCADE NOT NULL,
  character_id TEXT NOT NULL,
  photo_url TEXT,
  notes TEXT,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sailing_id, character_id)
);

-- Tags: when user tags a friend, a record links that meetup to the friend
CREATE TABLE character_meetup_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meetup_id UUID REFERENCES character_meetups(id) ON DELETE CASCADE NOT NULL,
  tagged_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meetup_id, tagged_user_id)
);

-- Indexes
CREATE INDEX idx_character_meetups_user_sailing ON character_meetups(user_id, sailing_id);
CREATE INDEX idx_character_meetups_character ON character_meetups(character_id);
CREATE INDEX idx_character_meetups_user_character ON character_meetups(user_id, character_id);
CREATE INDEX idx_character_meetup_tags_user ON character_meetup_tags(tagged_user_id);

-- RLS for character_meetups
ALTER TABLE character_meetups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetups"
  ON character_meetups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view meetups they are tagged in"
  ON character_meetups FOR SELECT
  USING (
    id IN (
      SELECT meetup_id FROM character_meetup_tags
      WHERE tagged_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meetups"
  ON character_meetups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetups"
  ON character_meetups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetups"
  ON character_meetups FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for character_meetup_tags
ALTER TABLE character_meetup_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meetup owners can manage tags"
  ON character_meetup_tags FOR ALL
  USING (
    meetup_id IN (
      SELECT id FROM character_meetups
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tagged users can view their tags"
  ON character_meetup_tags FOR SELECT
  USING (tagged_user_id = auth.uid());
