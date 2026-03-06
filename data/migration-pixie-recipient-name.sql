-- Add recipient_name column to pixie_gift_recipients
-- Allows users to label who lives in each stateroom
ALTER TABLE pixie_gift_recipients
  ADD COLUMN IF NOT EXISTS recipient_name TEXT;
