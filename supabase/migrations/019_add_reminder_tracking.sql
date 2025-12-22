-- Add reminder tracking columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0 NOT NULL;

-- Add index for efficient querying of bookings needing reminders
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent_at 
ON bookings(reminder_sent_at) 
WHERE reminder_sent_at IS NULL;

-- Add index for querying bookings by event date for reminder cron job
CREATE INDEX IF NOT EXISTS idx_bookings_event_date_reminders 
ON bookings(event_date, reminder_sent_at, payment_status);

-- Add comments
COMMENT ON COLUMN bookings.reminder_sent_at IS 'Timestamp when the first reminder was sent';
COMMENT ON COLUMN bookings.last_reminder_sent_at IS 'Timestamp when the most recent reminder was sent';
COMMENT ON COLUMN bookings.reminder_count IS 'Number of reminders sent for this booking';



