-- ============================================================================
-- Migration 015: Remove Service Type Constraints
-- This migration removes CHECK constraints on service_type columns to allow
-- free-form text values (e.g., "Sports", "Corporate", "Real Estate", etc.)
-- ============================================================================

-- Remove CHECK constraint from bookings table
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

-- Remove CHECK constraint from service_packages table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'service_packages' 
    AND constraint_name = 'service_packages_service_type_check'
  ) THEN
    ALTER TABLE service_packages DROP CONSTRAINT service_packages_service_type_check;
  END IF;
END $$;

-- Add comment explaining the change
COMMENT ON COLUMN bookings.service_type IS 'Free-form service type (e.g., Wedding, Sports, Corporate, Portrait, Event, etc.)';
COMMENT ON COLUMN service_packages.service_type IS 'Free-form service type (e.g., Wedding, Sports, Corporate, Portrait, Event, etc.)';

