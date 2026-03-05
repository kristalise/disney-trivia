-- Movie Checklist table for tracking Disney movie watch status
CREATE TABLE movie_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('want_to_watch', 'watched')),
  rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

CREATE INDEX movie_checklist_user_idx ON movie_checklist (user_id);
CREATE INDEX movie_checklist_user_status_idx ON movie_checklist (user_id, status);

ALTER TABLE movie_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own checklist" ON movie_checklist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checklist" ON movie_checklist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checklist" ON movie_checklist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklist" ON movie_checklist FOR DELETE USING (auth.uid() = user_id);
