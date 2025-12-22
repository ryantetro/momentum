-- Migration 008: Update Booking Constraints for New Features
-- This migration updates CHECK constraints to support all booking features:
-- - Adds 'event' service type
-- - Adds 'PROPOSAL_SENT' status
-- - Ensures payment_status includes all values (already done in 002, but making it idempotent)
-- - Adds deposit_amount validation
-- - Adds performance indexes

-- ============================================================================
-- 1. Update service_type constraint to include 'event'
-- ============================================================================
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' 
    AND constraint_name = 'bookings_service_type_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_service_type_check;
  END IF;
END $$;

-- Add new constraint with 'event' included
ALTER TABLE bookings
ADD CONSTRAINT bookings_service_type_check 
CHECK (service_type IN ('wedding', 'portrait', 'event'));

COMMENT ON CONSTRAINT bookings_service_type_check ON bookings IS 
'Valid service types: wedding, portrait, event';

-- ============================================================================
-- 2. Update status constraint to include 'PROPOSAL_SENT'
-- ============================================================================
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' 
    AND constraint_name = 'bookings_status_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;

-- Add new constraint with 'PROPOSAL_SENT' included
ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('draft', 'contract_sent', 'contract_signed', 'payment_pending', 'completed', 'PROPOSAL_SENT'));

COMMENT ON CONSTRAINT bookings_status_check ON bookings IS 
'Valid booking statuses: draft, contract_sent, contract_signed, payment_pending, completed, PROPOSAL_SENT';

-- ============================================================================
-- 3. Ensure payment_status constraint includes all values
-- (This was already done in migration 002, but making it idempotent)
-- ============================================================================
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' 
    AND constraint_name = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_payment_status_check;
  END IF;
END $$;

-- Add constraint with all payment status values
ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'PENDING_DEPOSIT', 'DEPOSIT_PAID'));

COMMENT ON CONSTRAINT bookings_payment_status_check ON bookings IS 
'Valid payment statuses: pending, partial, paid, overdue, PENDING_DEPOSIT, DEPOSIT_PAID';

-- ============================================================================
-- 4. Add deposit_amount validation constraint
-- ============================================================================
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' 
    AND constraint_name = 'bookings_deposit_amount_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_deposit_amount_check;
  END IF;
END $$;

-- Add constraint to ensure deposit_amount is valid
-- Allow NULL (for backward compatibility) or ensure it's >= 0 and <= total_price
ALTER TABLE bookings
ADD CONSTRAINT bookings_deposit_amount_check 
CHECK (
  deposit_amount IS NULL 
  OR (
    deposit_amount >= 0 
    AND deposit_amount <= total_price
  )
);

COMMENT ON CONSTRAINT bookings_deposit_amount_check ON bookings IS 
'Deposit amount must be NULL, or between 0 and total_price (inclusive)';

-- ============================================================================
-- 5. Add performance indexes
-- ============================================================================

-- Index on status for filtering bookings by status
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)
WHERE status IS NOT NULL;

COMMENT ON INDEX idx_bookings_status IS 
'Index on booking status for efficient filtering and queries';

-- Index on payment_status (may already exist from migration 002, but making it idempotent)
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status)
WHERE payment_status IS NOT NULL;

COMMENT ON INDEX idx_bookings_payment_status IS 
'Index on payment status for efficient filtering and queries';

-- Composite index for common query patterns (status + payment_status)
CREATE INDEX IF NOT EXISTS idx_bookings_status_payment ON bookings(status, payment_status)
WHERE status IS NOT NULL AND payment_status IS NOT NULL;

COMMENT ON INDEX idx_bookings_status_payment IS 
'Composite index for queries filtering by both status and payment_status';

-- ============================================================================
-- 6. Add table comments for documentation
-- ============================================================================
COMMENT ON TABLE bookings IS 
'Bookings table stores all photography bookings with contract, payment, and status information.
Service types: wedding, portrait, event
Statuses: draft, contract_sent, PROPOSAL_SENT, contract_signed, payment_pending, completed
Payment statuses: pending, PENDING_DEPOSIT, DEPOSIT_PAID, partial, paid, overdue';

-- ============================================================================
-- Migration complete
-- ============================================================================



