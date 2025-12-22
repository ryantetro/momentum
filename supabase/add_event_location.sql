-- Add event_location field to bookings table
-- This stores the venue/location address for the event

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS event_location TEXT;

-- Add index for searching by location
CREATE INDEX IF NOT EXISTS idx_bookings_event_location 
ON bookings(event_location) 
WHERE event_location IS NOT NULL;
