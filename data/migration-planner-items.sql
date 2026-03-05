-- Planner Items table — sailing-specific to-do checklist
CREATE TABLE planner_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sailing_id UUID REFERENCES sailing_reviews(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('venue', 'activity', 'dining')),
  item_id TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sailing_id, item_type, item_id)
);

ALTER TABLE planner_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planner items" ON planner_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own planner items" ON planner_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own planner items" ON planner_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own planner items" ON planner_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX planner_items_user_sailing_idx ON planner_items(user_id, sailing_id);
