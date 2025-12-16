-- Add stripe_account_id column to photographers table for Stripe Connect integration
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_photographers_stripe_account_id ON photographers(stripe_account_id);

