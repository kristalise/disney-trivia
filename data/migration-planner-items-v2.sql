-- Expand planner_items item_type constraint for new section types
ALTER TABLE planner_items DROP CONSTRAINT IF EXISTS planner_items_item_type_check;
ALTER TABLE planner_items ADD CONSTRAINT planner_items_item_type_check
  CHECK (item_type IN ('venue', 'activity', 'dining', 'stateroom', 'character', 'entertainment', 'shopping'));
