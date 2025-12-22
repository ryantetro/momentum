-- ============================================================================
-- Migration 014: Fix contract_signed_by Column
-- This migration ensures both contract_signed_by and client_signature_name exist
-- for backward compatibility
-- ============================================================================

-- Add contract_signed_by if it doesn't exist (for backward compatibility)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS contract_signed_by TEXT;

-- Ensure client_signature_name exists
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS client_signature_name TEXT;

-- Create a trigger to keep both columns in sync when client_signature_name is updated
CREATE OR REPLACE FUNCTION sync_contract_signed_by()
RETURNS TRIGGER AS $$
BEGIN
  -- If client_signature_name is set and contract_signed_by is null, sync it
  IF NEW.client_signature_name IS NOT NULL AND NEW.contract_signed_by IS NULL THEN
    NEW.contract_signed_by := NEW.client_signature_name;
  END IF;
  -- If contract_signed_by is set and client_signature_name is null, sync it
  IF NEW.contract_signed_by IS NOT NULL AND NEW.client_signature_name IS NULL THEN
    NEW.client_signature_name := NEW.contract_signed_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_contract_signed_by_trigger ON bookings;

-- Create trigger
CREATE TRIGGER sync_contract_signed_by_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_signed_by();

COMMENT ON COLUMN bookings.contract_signed_by IS 'Legacy column - kept for backward compatibility. Use client_signature_name instead.';
COMMENT ON COLUMN bookings.client_signature_name IS 'Primary column for storing the client signature name.';



