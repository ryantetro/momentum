-- Phase 5: Contract & Payments Schema Updates

-- Add contract_template column to photographers table
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS contract_template TEXT;

-- Update bookings table with new columns for Phase 5
-- Note: contract_text, contract_signed_at already exist, but we'll ensure they're correct

-- Add client_signature_name if it doesn't exist (rename from contract_signed_by if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'client_signature_name'
  ) THEN
    -- Check if contract_signed_by exists and rename it, otherwise add new column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'contract_signed_by'
    ) THEN
      ALTER TABLE bookings RENAME COLUMN contract_signed_by TO client_signature_name;
    ELSE
      ALTER TABLE bookings ADD COLUMN client_signature_name TEXT;
    END IF;
  END IF;
END $$;

-- Add deposit_amount column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2);

-- Update payment_status to support new values
-- First, drop the existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'bookings' 
    AND constraint_name LIKE '%payment_status%'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
  END IF;
END $$;

-- Add new constraint with updated values
ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'PENDING_DEPOSIT', 'DEPOSIT_PAID'));

-- Update default payment_status for new bookings
ALTER TABLE bookings
ALTER COLUMN payment_status SET DEFAULT 'PENDING_DEPOSIT';

-- Add index on payment_status for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Add index on contract_signed_at for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_contract_signed_at ON bookings(contract_signed_at);



