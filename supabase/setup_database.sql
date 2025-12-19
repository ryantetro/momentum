-- ============================================================================
-- Momentum Database Setup
-- Run this entire file to set up your database from scratch
-- ============================================================================

-- Migration 001: Initial Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Photographers table (extends auth.users)
CREATE TABLE photographers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract templates table
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('wedding', 'portrait')),
  event_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  contract_template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  contract_text TEXT,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMPTZ,
  contract_signed_by TEXT,
  payment_milestones JSONB DEFAULT '[]'::jsonb,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  portal_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'contract_sent', 'contract_signed', 'payment_pending', 'completed')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_clients_photographer_id ON clients(photographer_id);
CREATE INDEX idx_bookings_photographer_id ON bookings(photographer_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_portal_token ON bookings(portal_token);
CREATE INDEX idx_contract_templates_photographer_id ON contract_templates(photographer_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Photographers policies
CREATE POLICY "Photographers can view own profile"
  ON photographers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Photographers can update own profile"
  ON photographers FOR UPDATE
  USING (auth.uid() = user_id);

-- Clients policies
CREATE POLICY "Photographers can view own clients"
  ON clients FOR SELECT
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can update own clients"
  ON clients FOR UPDATE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can delete own clients"
  ON clients FOR DELETE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

-- Contract templates policies
CREATE POLICY "Photographers can view own templates"
  ON contract_templates FOR SELECT
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can insert own templates"
  ON contract_templates FOR INSERT
  WITH CHECK (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can update own templates"
  ON contract_templates FOR UPDATE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can delete own templates"
  ON contract_templates FOR DELETE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Photographers can view own bookings"
  ON bookings FOR SELECT
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can update own bookings"
  ON bookings FOR UPDATE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can delete own bookings"
  ON bookings FOR DELETE
  USING (
    photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

-- Function to automatically create photographer profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.photographers (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create photographer profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_photographers_updated_at BEFORE UPDATE ON photographers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration 002: Contract & Payments Schema Updates
-- ============================================================================

-- Add contract_template column to photographers table
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS contract_template TEXT;

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

-- ============================================================================
-- Migration 003: Payment Reminders Schema
-- ============================================================================

-- Add payment_due_date column to bookings table (TIMESTAMP WITH TIME ZONE)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ;

-- Add client_email column for direct email access
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Add last_reminder_sent column to track reminder history (TIMESTAMP WITH TIME ZONE, NULLABLE)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ;

-- Add index on payment_due_date for efficient queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_due_date ON bookings(payment_due_date);

-- Add index on payment_status and payment_due_date for reminder queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reminder ON bookings(payment_status, payment_due_date) 
WHERE payment_status NOT IN ('paid', 'DEPOSIT_PAID');

-- ============================================================================
-- Migration 003: Booking Files Schema
-- ============================================================================

-- Create booking_files table
CREATE TABLE IF NOT EXISTS booking_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on booking_id for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_files_booking_id ON booking_files(booking_id);

-- Add index on uploaded_by for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_files_uploaded_by ON booking_files(uploaded_by);

-- Enable RLS
ALTER TABLE booking_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Photographers can view files for own bookings"
  ON booking_files FOR SELECT
  USING (
    uploaded_by IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can insert files for own bookings"
  ON booking_files FOR INSERT
  WITH CHECK (
    uploaded_by IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
    AND booking_id IN (
      SELECT id FROM bookings
      WHERE photographer_id = uploaded_by
    )
  );

CREATE POLICY "Photographers can delete own files"
  ON booking_files FOR DELETE
  USING (
    uploaded_by IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Migration 003: Custom Client Forms Schema
-- ============================================================================

-- Create client_forms table
CREATE TABLE IF NOT EXISTS client_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  form_fields JSONB DEFAULT '[]'::jsonb,
  form_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on booking_id for faster queries
CREATE INDEX IF NOT EXISTS idx_client_forms_booking_id ON client_forms(booking_id);

-- Enable RLS
ALTER TABLE client_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Photographers can view forms for own bookings"
  ON client_forms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = client_forms.booking_id
      AND bookings.photographer_id IN (
        SELECT id FROM photographers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Photographers can insert forms for own bookings"
  ON client_forms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = client_forms.booking_id
      AND bookings.photographer_id IN (
        SELECT id FROM photographers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Photographers can update forms for own bookings"
  ON client_forms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = client_forms.booking_id
      AND bookings.photographer_id IN (
        SELECT id FROM photographers WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- Migration 004: Add Stripe Account ID
-- ============================================================================

-- Add stripe_account_id column to photographers table for Stripe Connect integration
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_photographers_stripe_account_id ON photographers(stripe_account_id);

-- ============================================================================
-- Migration 005: Add Signature Audit Fields
-- ============================================================================

-- Add signature audit trail fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS signature_ip_address TEXT;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS signature_user_agent TEXT;

-- ============================================================================
-- Migration 006: Add Settings Fields
-- ============================================================================

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
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'photographers' 
    AND constraint_name = 'photographers_default_currency_check'
  ) THEN
    ALTER TABLE photographers DROP CONSTRAINT photographers_default_currency_check;
  END IF;
END $$;

ALTER TABLE photographers
ADD CONSTRAINT photographers_default_currency_check 
CHECK (default_currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD') OR default_currency IS NULL);

-- ============================================================================
-- Migration 007: Add Template Usage Count
-- ============================================================================

-- Add usage_count to contract_templates table
ALTER TABLE contract_templates
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_usage_count 
ON contract_templates(usage_count);

-- ============================================================================
-- Migration 008: Update Booking Constraints
-- ============================================================================

-- Update service_type constraint to include 'event'
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

ALTER TABLE bookings
ADD CONSTRAINT bookings_service_type_check 
CHECK (service_type IN ('wedding', 'portrait', 'event'));

-- Update status constraint to include 'PROPOSAL_SENT'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' 
    AND constraint_name = 'bookings_status_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('draft', 'contract_sent', 'contract_signed', 'payment_pending', 'completed', 'PROPOSAL_SENT'));

-- Ensure payment_status constraint includes all values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' 
    AND constraint_name = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_payment_status_check;
  END IF;
END $$;

ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'PENDING_DEPOSIT', 'DEPOSIT_PAID'));

-- Add deposit_amount validation constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' 
    AND constraint_name = 'bookings_deposit_amount_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_deposit_amount_check;
  END IF;
END $$;

ALTER TABLE bookings
ADD CONSTRAINT bookings_deposit_amount_check 
CHECK (
  deposit_amount IS NULL 
  OR (
    deposit_amount >= 0 
    AND deposit_amount <= total_price
  )
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status)
WHERE payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_status_payment ON bookings(status, payment_status)
WHERE status IS NOT NULL AND payment_status IS NOT NULL;

-- ============================================================================
-- Migration 009: Enhance Contracts and Settings
-- ============================================================================

-- Ensure usage_count has proper default and NOT NULL constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contract_templates' AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE contract_templates
    ALTER COLUMN usage_count SET DEFAULT 0;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contract_templates' 
      AND column_name = 'usage_count' 
      AND is_nullable = 'YES'
    ) THEN
      UPDATE contract_templates SET usage_count = 0 WHERE usage_count IS NULL;
      ALTER TABLE contract_templates ALTER COLUMN usage_count SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Add unique partial index to ensure only one default template per photographer
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_templates_one_default 
ON contract_templates(photographer_id) 
WHERE is_default = true;

-- Add index on is_default for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_default 
ON contract_templates(is_default) 
WHERE is_default = true;

-- Update currency constraint to include more common currencies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'photographers' 
    AND constraint_name = 'photographers_default_currency_check'
  ) THEN
    ALTER TABLE photographers DROP CONSTRAINT photographers_default_currency_check;
  END IF;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_photographers_stripe_account 
ON photographers(stripe_account_id) 
WHERE stripe_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_photographers_pass_fees 
ON photographers(pass_fees_to_client) 
WHERE pass_fees_to_client IS NOT NULL;

-- Create function to automatically unset other defaults when setting a new default
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE contract_templates
    SET is_default = false
    WHERE photographer_id = NEW.photographer_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_template ON contract_templates;

CREATE TRIGGER trigger_ensure_single_default_template
  BEFORE INSERT OR UPDATE OF is_default ON contract_templates
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_template();

-- ============================================================================
-- Migration 010: Add Inquiry Support
-- ============================================================================

-- Add username column (unique, for public inquiry links)
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_photographers_username_unique 
ON photographers(LOWER(username)) 
WHERE username IS NOT NULL;

-- Create regular index for fast lookups
CREATE INDEX IF NOT EXISTS idx_photographers_username 
ON photographers(username) 
WHERE username IS NOT NULL;

-- Add inquiry_message column to store client's message from inquiry form
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS inquiry_message TEXT;

-- Update status constraint to include "Inquiry"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' 
    AND constraint_name = 'bookings_status_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('draft', 'contract_sent', 'contract_signed', 'payment_pending', 'completed', 'PROPOSAL_SENT', 'Inquiry'));

-- Add indexes for inquiry queries
CREATE INDEX IF NOT EXISTS idx_bookings_status_inquiry 
ON bookings(status) 
WHERE status = 'Inquiry';

CREATE INDEX IF NOT EXISTS idx_bookings_photographer_status 
ON bookings(photographer_id, status) 
WHERE status IN ('Inquiry', 'draft');

-- ============================================================================
-- Migration 011: Add Client Notes
-- ============================================================================

-- Add notes column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================================
-- Migration 012: Automatic Username Generation at Signup
-- ============================================================================

-- Create function to generate unique username from email
CREATE OR REPLACE FUNCTION generate_unique_username(email_address TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  clean_username TEXT;
  candidate_username TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 100;
  exists_check BOOLEAN;
  counter_length INTEGER;
  available_length INTEGER;
BEGIN
  -- Extract part before @
  base_username := SPLIT_PART(email_address, '@', 1);
  
  -- Handle edge case: empty or very short prefix
  IF base_username IS NULL OR LENGTH(base_username) = 0 THEN
    base_username := 'user';
  END IF;
  
  -- Clean username: lowercase, remove special chars, replace dots with hyphens
  clean_username := LOWER(base_username);
  clean_username := REGEXP_REPLACE(clean_username, '[^a-z0-9_-]', '', 'g');
  clean_username := REPLACE(clean_username, '.', '-');
  clean_username := REPLACE(clean_username, '+', '-');
  
  -- Remove consecutive hyphens
  WHILE clean_username LIKE '%-%-%' LOOP
    clean_username := REPLACE(clean_username, '--', '-');
  END LOOP;
  
  -- Remove leading/trailing hyphens
  clean_username := TRIM(BOTH '-' FROM clean_username);
  
  -- Ensure minimum length (3 chars)
  IF LENGTH(clean_username) < 3 THEN
    clean_username := clean_username || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3);
  END IF;
  
  -- Truncate to max length (30 chars) before adding suffix
  IF LENGTH(clean_username) > 27 THEN
    clean_username := SUBSTRING(clean_username FROM 1 FOR 27);
  END IF;
  
  -- Try base username first
  candidate_username := clean_username;
  
  -- Check for uniqueness and increment if needed
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM photographers 
      WHERE LOWER(username) = LOWER(candidate_username)
        AND username IS NOT NULL
    ) INTO exists_check;
    
    EXIT WHEN NOT exists_check OR counter >= max_attempts;
    
    counter := counter + 1;
    
    -- Calculate available space for counter
    counter_length := LENGTH(counter::TEXT);
    available_length := 30 - counter_length;
    
    IF LENGTH(clean_username) > available_length THEN
      candidate_username := SUBSTRING(clean_username FROM 1 FOR available_length) || counter::TEXT;
    ELSE
      candidate_username := clean_username || counter::TEXT;
    END IF;
  END LOOP;
  
  -- If we hit max attempts, append random suffix
  IF counter >= max_attempts THEN
    candidate_username := SUBSTRING(clean_username FROM 1 FOR 20) || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
  END IF;
  
  RETURN candidate_username;
END;
$$ LANGUAGE plpgsql;

-- Update handle_new_user() trigger to auto-generate username
-- Using minimal approach with user ID hash for guaranteed uniqueness
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  clean_username TEXT;
  candidate_username TEXT;
BEGIN
  -- Extract username from email
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  
  -- Clean it up
  clean_username := REGEXP_REPLACE(base_username, '[^a-z0-9-]', '', 'g');
  clean_username := TRIM(BOTH '-' FROM clean_username);
  
  -- Ensure minimum length
  IF LENGTH(clean_username) < 3 THEN
    clean_username := 'user' || clean_username;
  END IF;
  
  -- Truncate
  IF LENGTH(clean_username) > 25 THEN
    clean_username := SUBSTRING(clean_username FROM 1 FOR 25);
  END IF;
  
  -- Make it unique by adding user ID hash (guaranteed unique since user IDs are UUIDs)
  candidate_username := clean_username || '-' || SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8);
  
  -- Insert with username
  INSERT INTO public.photographers (user_id, email, username)
  VALUES (NEW.id, NEW.email, candidate_username);
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    
    -- Fallback: insert without username
    BEGIN
      INSERT INTO public.photographers (user_id, email)
      VALUES (NEW.id, NEW.email);
      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create photographer: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill usernames for existing photographers
DO $$
DECLARE
  photographer_record RECORD;
  generated_username TEXT;
  update_count INTEGER := 0;
BEGIN
  FOR photographer_record IN 
    SELECT id, email FROM photographers WHERE username IS NULL
  LOOP
    BEGIN
      generated_username := generate_unique_username(photographer_record.email);
      
      UPDATE photographers
      SET username = generated_username
      WHERE id = photographer_record.id;
      
      update_count := update_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to generate username for photographer %: %', photographer_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Backfilled % usernames for existing photographers', update_count;
END $$;

-- ============================================================================
-- Database Setup Complete!
-- ============================================================================

