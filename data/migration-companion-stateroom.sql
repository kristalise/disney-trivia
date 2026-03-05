-- Add stateroom_number to sailing_companions so guests can be assigned to specific rooms
ALTER TABLE sailing_companions ADD COLUMN stateroom_number integer;
