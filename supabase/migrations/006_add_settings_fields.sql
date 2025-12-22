-- Add settings fields to photographers table for unified settings page

-- Business Profile fields
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS studio_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Payment settings
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS pass_fees_to_client BOOLEAN DEFAULT true;

-- Contract settings
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS require_signature_audit BOOLEAN DEFAULT true;

-- Notification preferences
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS email_payment_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_contract_signed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_payout_notifications BOOLEAN DEFAULT true;

-- Add constraint for currency values
ALTER TABLE photographers
ADD CONSTRAINT photographers_default_currency_check 
CHECK (default_currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD') OR default_currency IS NULL);



