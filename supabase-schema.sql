-- Disney Trivia Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create full-text search index on questions
CREATE INDEX questions_search_idx ON questions USING gin(to_tsvector('english', question || ' ' || explanation));

-- User Progress table (for logged-in users)
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id, answered_at)
);

-- Quiz Sessions table
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for categories and questions
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Questions are viewable by everyone" ON questions
  FOR SELECT USING (true);

-- Users can only see/modify their own progress
CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz sessions" ON quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz sessions" ON quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed initial categories
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Disney Movies & Characters', 'movies', 'Test your knowledge of Disney animated classics, live-action films, and beloved characters', 'film'),
  ('Disney Parks & History', 'parks', 'Explore the magic of Disney theme parks, attractions, and Walt Disney''s legacy', 'castle'),
  ('Disney Cruise Line', 'cruise', 'All about Disney ships, ports of call, onboard activities, and Castaway Cay', 'ship'),
  ('Mixed/Random', 'mixed', 'A mix of questions from all categories to test your overall Disney knowledge', 'shuffle');

-- Note: Questions should be seeded separately using the seed-questions.json data
-- You can use the Supabase dashboard or a script to import the questions
