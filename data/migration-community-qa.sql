-- Community Questions table
CREATE TABLE IF NOT EXISTS community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL CHECK (char_length(question_text) <= 500),
  topic TEXT NOT NULL CHECK (topic IN ('dining', 'staterooms', 'activities', 'general', 'first-sail')),
  upvotes INTEGER NOT NULL DEFAULT 0,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community Answers table
CREATE TABLE IF NOT EXISTS community_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL CHECK (char_length(answer_text) <= 2000),
  upvotes INTEGER NOT NULL DEFAULT 0,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upvote junction tables
CREATE TABLE IF NOT EXISTS community_question_upvotes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS community_answer_upvotes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES community_answers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, answer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_questions_topic ON community_questions(topic);
CREATE INDEX IF NOT EXISTS idx_community_questions_upvotes ON community_questions(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_community_questions_answered ON community_questions(is_answered);
CREATE INDEX IF NOT EXISTS idx_community_answers_question ON community_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_community_answers_upvotes ON community_answers(upvotes DESC);

-- RLS
ALTER TABLE community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_question_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_answer_upvotes ENABLE ROW LEVEL SECURITY;

-- Read access for all
CREATE POLICY "Anyone can read questions" ON community_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can read answers" ON community_answers FOR SELECT USING (true);
CREATE POLICY "Anyone can read question upvotes" ON community_question_upvotes FOR SELECT USING (true);
CREATE POLICY "Anyone can read answer upvotes" ON community_answer_upvotes FOR SELECT USING (true);

-- Auth users can insert
CREATE POLICY "Auth users can ask questions" ON community_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can answer" ON community_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can upvote questions" ON community_question_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can upvote answers" ON community_answer_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can remove question upvote" ON community_question_upvotes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Auth users can remove answer upvote" ON community_answer_upvotes FOR DELETE USING (auth.uid() = user_id);
