-- Add 'note' as an allowed status value for user_challenges
ALTER TABLE user_challenges DROP CONSTRAINT IF EXISTS user_challenges_status_check;

-- Recreate the constraint to include 'note' as an allowed status
ALTER TABLE user_challenges ADD CONSTRAINT user_challenges_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'snoozed'::text, 'skipped'::text, 'note'::text]));

-- Now backfill existing Daily Reflection entries to be proper notes
UPDATE user_challenges 
SET 
  status = 'note',
  custom_category = 'Note',
  custom_title = 'Note'
WHERE 
  created_by = 'user' 
  AND custom_description IS NOT NULL 
  AND status != 'note'
  AND (custom_title = 'Daily Reflection' OR custom_title IS NULL);