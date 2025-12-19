-- Migration 010: Add Inquiry Support
-- This migration adds support for public inquiry forms and lead capture:
-- - Adds username field to photographers for public inquiry links
-- - Adds inquiry_message field to bookings to store client messages
-- - Ensures "Inquiry" status is supported (verify it's in constraint)
-- - Adds indexes for performance

-- ============================================================================
-- 1. Add username to photographers table
-- ============================================================================

-- Add username column (unique, for public inquiry links)
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index on username (case-insensitive)
-- First, create a unique constraint using a unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_photographers_username_unique 
ON photographers(LOWER(username)) 
WHERE username IS NOT NULL;

-- Create regular index for fast lookups
CREATE INDEX IF NOT EXISTS idx_photographers_username 
ON photographers(username) 
WHERE username IS NOT NULL;

COMMENT ON COLUMN photographers.username IS 
'Public username for inquiry links. Must be unique, 3-30 characters, alphanumeric with hyphens/underscores only. Used in URL: /inquiry/[username]';

-- ============================================================================
-- 2. Add inquiry_message to bookings table
-- ============================================================================

-- Add inquiry_message column to store client's message from inquiry form
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS inquiry_message TEXT;

COMMENT ON COLUMN bookings.inquiry_message IS 
'Message submitted by client through public inquiry form. Only populated for inquiries.';

-- ============================================================================
-- 3. Verify "Inquiry" status is in constraint
-- ============================================================================

-- Update status constraint to include "Inquiry"
-- Migration 008 added PROPOSAL_SENT but not Inquiry, so we need to add it
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

-- Add constraint with all status values including Inquiry
ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('draft', 'contract_sent', 'contract_signed', 'payment_pending', 'completed', 'PROPOSAL_SENT', 'Inquiry'));

COMMENT ON CONSTRAINT bookings_status_check ON bookings IS 
'Valid booking statuses: draft, contract_sent, contract_signed, payment_pending, completed, PROPOSAL_SENT, Inquiry';

-- ============================================================================
-- 4. Add indexes for inquiry queries
-- ============================================================================

-- Index on status for filtering inquiries (may already exist, but ensure it's optimal)
CREATE INDEX IF NOT EXISTS idx_bookings_status_inquiry 
ON bookings(status) 
WHERE status = 'Inquiry';

COMMENT ON INDEX idx_bookings_status_inquiry IS 
'Index for efficient filtering of inquiry bookings';

-- Composite index for photographer + status queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_bookings_photographer_status 
ON bookings(photographer_id, status) 
WHERE status IN ('Inquiry', 'draft');

COMMENT ON INDEX idx_bookings_photographer_status IS 
'Composite index for queries filtering by photographer and status (inquiries and drafts)';

-- ============================================================================
-- 5. Update bookings table comment
-- ============================================================================

COMMENT ON TABLE bookings IS 
'Bookings table stores all photography bookings including inquiries, drafts, and active bookings.
Statuses: draft, Inquiry, contract_sent, PROPOSAL_SENT, contract_signed, payment_pending, completed
Inquiries are leads submitted through public inquiry form and can be converted to bookings.';

-- ============================================================================
-- Migration complete
-- ============================================================================

