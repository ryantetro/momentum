-- Add auto_reminders_enabled column to photographers table
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT false NOT NULL;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_photographers_auto_reminders_enabled 
ON photographers(auto_reminders_enabled) 
WHERE auto_reminders_enabled = true;

-- Add comment
COMMENT ON COLUMN photographers.auto_reminders_enabled IS 'Whether automated payment reminders are enabled for this photographer';

