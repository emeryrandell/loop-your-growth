-- Backfill existing Daily Reflection entries to be proper notes
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