-- Migration 009: Enhance Contracts and Settings Schema
-- This migration improves the contract_templates and photographers tables with:
-- - Contract templates: usage_count constraints, unique default per photographer, indexes
-- - Settings: additional currencies, indexes, documentation
-- - General: comments and performance optimizations

-- ============================================================================
-- 1. Contract Templates Enhancements
-- ============================================================================

-- Ensure usage_count has proper default and NOT NULL constraint
DO $$
BEGIN
  -- Set default if column exists but doesn't have default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contract_templates' AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE contract_templates
    ALTER COLUMN usage_count SET DEFAULT 0;
    
    -- Only set NOT NULL if column allows NULL
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contract_templates' 
      AND column_name = 'usage_count' 
      AND is_nullable = 'YES'
    ) THEN
      -- Update any NULL values to 0 first
      UPDATE contract_templates SET usage_count = 0 WHERE usage_count IS NULL;
      ALTER TABLE contract_templates ALTER COLUMN usage_count SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Add unique partial index to ensure only one default template per photographer
-- This prevents multiple default templates for the same photographer
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_templates_one_default 
ON contract_templates(photographer_id) 
WHERE is_default = true;

COMMENT ON INDEX idx_contract_templates_one_default IS 
'Ensures only one default contract template per photographer';

-- Add index on is_default for faster queries when filtering for default templates
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_default 
ON contract_templates(is_default) 
WHERE is_default = true;

COMMENT ON INDEX idx_contract_templates_is_default IS 
'Index on is_default flag for efficient default template queries';

-- Index on usage_count already exists from migration 007, but ensure it's optimal
-- (Already created, so this is just documentation)

-- ============================================================================
-- 2. Settings/Photographers Enhancements
-- ============================================================================

-- Update currency constraint to include more common currencies
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'photographers' 
    AND constraint_name = 'photographers_default_currency_check'
  ) THEN
    ALTER TABLE photographers DROP CONSTRAINT photographers_default_currency_check;
  END IF;
END $$;

-- Add updated constraint with more currency options
ALTER TABLE photographers
ADD CONSTRAINT photographers_default_currency_check 
CHECK (
  default_currency IS NULL 
  OR default_currency IN (
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 
    'JPY', 'NZD', 'CHF', 'SEK', 'NOK', 
    'DKK', 'PLN', 'MXN', 'BRL', 'ZAR'
  )
);

COMMENT ON CONSTRAINT photographers_default_currency_check ON photographers IS 
'Valid currency codes: USD, EUR, GBP, CAD, AUD, JPY, NZD, CHF, SEK, NOK, DKK, PLN, MXN, BRL, ZAR';

-- Add/update index on stripe_account_id for faster queries (when checking if payments are enabled)
-- Migration 004 already created an index, but we'll create a more efficient partial index
-- Drop old index if it exists and create optimized partial index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'photographers' 
    AND indexname = 'idx_photographers_stripe_account_id'
  ) THEN
    DROP INDEX IF EXISTS idx_photographers_stripe_account_id;
  END IF;
END $$;

-- Create optimized partial index (only indexes non-null values)
CREATE INDEX IF NOT EXISTS idx_photographers_stripe_account 
ON photographers(stripe_account_id) 
WHERE stripe_account_id IS NOT NULL;

COMMENT ON INDEX idx_photographers_stripe_account IS 
'Partial index on Stripe account ID for efficient payment status queries (only indexes non-null values)';

-- Add index on commonly queried boolean settings fields
-- These are used frequently in queries to check photographer preferences
CREATE INDEX IF NOT EXISTS idx_photographers_pass_fees 
ON photographers(pass_fees_to_client) 
WHERE pass_fees_to_client IS NOT NULL;

COMMENT ON INDEX idx_photographers_pass_fees IS 
'Index on pass_fees_to_client for efficient fee calculation queries';

-- ============================================================================
-- 3. Table Comments for Documentation
-- ============================================================================

-- Document contract_templates table
COMMENT ON TABLE contract_templates IS 
'Contract templates store reusable contract text with variables.
Variables: {{client_name}}, {{event_date}}, {{total_price}}, {{service_type}}
Each photographer can have multiple templates, but only one can be marked as default.
Usage count tracks how many times a template has been used in bookings.';

COMMENT ON COLUMN contract_templates.usage_count IS 
'Number of times this template has been used in bookings. Increments when template is assigned to a booking.';

COMMENT ON COLUMN contract_templates.is_default IS 
'If true, this template is the default for new bookings. Only one default per photographer allowed.';

COMMENT ON COLUMN contract_templates.content IS 
'Contract text content with variable placeholders. Variables are replaced when generating proposals.';

-- Document photographers table settings fields
COMMENT ON COLUMN photographers.studio_name IS 
'Business/studio name displayed to clients in proposals and invoices';

COMMENT ON COLUMN photographers.phone IS 
'Business phone number for client contact';

COMMENT ON COLUMN photographers.logo_url IS 
'URL to business logo image, displayed on client portal and invoices';

COMMENT ON COLUMN photographers.website IS 
'Business website URL';

COMMENT ON COLUMN photographers.social_links IS 
'JSONB object storing social media links. Format: {"instagram": "url", "facebook": "url", "twitter": "url"}';

COMMENT ON COLUMN photographers.default_currency IS 
'Default currency for pricing. Used when creating new bookings if not specified.';

COMMENT ON COLUMN photographers.pass_fees_to_client IS 
'If true, transaction fees are added to client total. If false, fees are deducted from photographer payout.';

COMMENT ON COLUMN photographers.require_signature_audit IS 
'If true, signature IP address and user agent are recorded for legal audit trail.';

COMMENT ON COLUMN photographers.email_payment_reminders IS 
'If true, photographer receives email notifications for payment reminders sent to clients.';

COMMENT ON COLUMN photographers.email_contract_signed IS 
'If true, photographer receives email notification when a contract is signed.';

COMMENT ON COLUMN photographers.email_payout_notifications IS 
'If true, photographer receives email notifications when payouts are processed.';

-- ============================================================================
-- 4. Function to Ensure Only One Default Template
-- ============================================================================

-- Create function to automatically unset other defaults when setting a new default
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated template is being set as default
  IF NEW.is_default = true THEN
    -- Unset all other default templates for the same photographer
    UPDATE contract_templates
    SET is_default = false
    WHERE photographer_id = NEW.photographer_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default template
DROP TRIGGER IF EXISTS trigger_ensure_single_default_template ON contract_templates;

CREATE TRIGGER trigger_ensure_single_default_template
  BEFORE INSERT OR UPDATE OF is_default ON contract_templates
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_template();

COMMENT ON FUNCTION ensure_single_default_template() IS 
'Automatically unsets other default templates when a new default is set for a photographer';

-- ============================================================================
-- Migration complete
-- ============================================================================

