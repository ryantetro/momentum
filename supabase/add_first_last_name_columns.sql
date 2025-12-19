-- ============================================================================
-- Add first_name and last_name columns to photographers table
-- Run this migration if you see "column photographers.first_name does not exist"
-- ============================================================================

-- Add first_name and last_name columns
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Verify columns were added
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'photographers' 
  AND column_name IN ('first_name', 'last_name');

