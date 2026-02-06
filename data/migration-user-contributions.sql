-- Migration: Add user contributions and reliability ratings

-- Add columns to questions table for user contributions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_user_contributed BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS contributed_by UUID REFERENCES auth.users(id);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cruise_name TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS contributed_at TIMESTAMPTZ DEFAULT NOW();

-- Add reliability tracking columns
ALTER TABLE questions ADD COLUMN IF NOT EXISTS reliability_score DECIMAL(3,2) DEFAULT 1.00;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS reliable_ratings INTEGER DEFAULT 0;

-- Create question ratings table
CREATE TABLE IF NOT EXISTS question_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- For anonymous users
  is_reliable BOOLEAN NOT NULL,
  suggested_correct_answer INTEGER, -- Index of suggested correct answer
  suggested_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, user_id),
  UNIQUE(question_id, session_id)
);

-- Create index for faster reliability queries
CREATE INDEX IF NOT EXISTS idx_question_ratings_question_id ON question_ratings(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_reliability ON questions(reliability_score);
CREATE INDEX IF NOT EXISTS idx_questions_user_contributed ON questions(is_user_contributed);

-- Function to update reliability score when a rating is added
CREATE OR REPLACE FUNCTION update_question_reliability()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions
  SET
    total_ratings = total_ratings + 1,
    reliable_ratings = reliable_ratings + CASE WHEN NEW.is_reliable THEN 1 ELSE 0 END,
    reliability_score = (reliable_ratings + CASE WHEN NEW.is_reliable THEN 1 ELSE 0 END)::DECIMAL / (total_ratings + 1)
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update reliability on new rating
DROP TRIGGER IF EXISTS trigger_update_reliability ON question_ratings;
CREATE TRIGGER trigger_update_reliability
AFTER INSERT ON question_ratings
FOR EACH ROW
EXECUTE FUNCTION update_question_reliability();

-- RLS policies for question_ratings
ALTER TABLE question_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can insert ratings
CREATE POLICY "Anyone can insert ratings" ON question_ratings
FOR INSERT WITH CHECK (true);

-- Anyone can view ratings
CREATE POLICY "Anyone can view ratings" ON question_ratings
FOR SELECT USING (true);

-- Users can only update their own ratings
CREATE POLICY "Users can update own ratings" ON question_ratings
FOR UPDATE USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- RLS policy for inserting user-contributed questions
CREATE POLICY "Anyone can insert questions" ON questions
FOR INSERT WITH CHECK (true);

-- Create a view for pending corrections (questions with low reliability and suggested answers)
CREATE OR REPLACE VIEW pending_corrections AS
SELECT
  q.id,
  q.question,
  q.options,
  q.correct_answer,
  q.reliability_score,
  q.total_ratings,
  array_agg(DISTINCT r.suggested_correct_answer) FILTER (WHERE r.suggested_correct_answer IS NOT NULL) as suggested_answers,
  array_agg(DISTINCT r.suggested_explanation) FILTER (WHERE r.suggested_explanation IS NOT NULL) as suggested_explanations
FROM questions q
LEFT JOIN question_ratings r ON q.id = r.question_id AND r.is_reliable = false
WHERE q.reliability_score < 0.7 AND q.total_ratings >= 3
GROUP BY q.id;
