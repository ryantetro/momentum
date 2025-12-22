-- Migration 011: Add Client Notes
-- This migration adds a notes column to the clients table for internal photographer notes

-- Add notes column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN clients.notes IS 
'Internal notes for photographer to track client preferences, special requests, or other important information';

-- ============================================================================
-- Migration complete
-- ============================================================================



