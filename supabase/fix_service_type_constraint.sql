-- ============================================================================
-- Fix service_type constraint to include 'event'
-- The inquiry form allows 'event' but the constraint only allows 'wedding' and 'portrait'
-- ============================================================================

-- Drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' 
    AND constraint_name = 'bookings_service_type_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_service_type_check;
  END IF;
END $$;

-- Add constraint with all service types including 'event'
ALTER TABLE bookings
ADD CONSTRAINT bookings_service_type_check 
CHECK (service_type IN ('wedding', 'portrait', 'event'));

COMMENT ON CONSTRAINT bookings_service_type_check ON bookings IS 
'Valid service types: wedding, portrait, event';

