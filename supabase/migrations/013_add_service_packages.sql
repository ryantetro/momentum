-- ============================================================================
-- Migration 013: Add Service Packages Table
-- This migration creates a service_packages table to store photographer's
-- pricing packages for automatic inquiry conversion.
-- ============================================================================

-- Create service_packages table
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('wedding', 'portrait', 'event')),
  total_price DECIMAL(10, 2) NOT NULL,
  deposit_percentage DECIMAL(5, 4) NULL, -- e.g., 0.2000 for 20%
  deposit_amount DECIMAL(10, 2) NULL, -- Fixed deposit amount (alternative to percentage)
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique partial index to ensure only one default package per service type per photographer
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_packages_unique_default 
ON service_packages(photographer_id, service_type) 
WHERE is_default = TRUE;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_service_packages_photographer_id ON service_packages(photographer_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_service_type ON service_packages(service_type);
CREATE INDEX IF NOT EXISTS idx_service_packages_default ON service_packages(photographer_id, service_type, is_default) WHERE is_default = TRUE;

-- Add comment
COMMENT ON TABLE service_packages IS 'Stores photographer pricing packages for automatic inquiry conversion';
COMMENT ON COLUMN service_packages.deposit_percentage IS 'Percentage of total_price (e.g., 0.20 for 20%). If set, deposit_amount is calculated.';
COMMENT ON COLUMN service_packages.deposit_amount IS 'Fixed deposit amount. If set, takes precedence over deposit_percentage.';
COMMENT ON COLUMN service_packages.is_default IS 'If true, this package is auto-selected when converting inquiries of matching service_type';

-- Enable RLS
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Photographers can view their own packages
CREATE POLICY "Photographers can view own service packages"
  ON service_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM photographers
      WHERE photographers.id = service_packages.photographer_id
      AND photographers.user_id = auth.uid()
    )
  );

-- Photographers can insert their own packages
CREATE POLICY "Photographers can insert own service packages"
  ON service_packages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photographers
      WHERE photographers.id = service_packages.photographer_id
      AND photographers.user_id = auth.uid()
    )
  );

-- Photographers can update their own packages
CREATE POLICY "Photographers can update own service packages"
  ON service_packages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM photographers
      WHERE photographers.id = service_packages.photographer_id
      AND photographers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photographers
      WHERE photographers.id = service_packages.photographer_id
      AND photographers.user_id = auth.uid()
    )
  );

-- Photographers can delete their own packages
CREATE POLICY "Photographers can delete own service packages"
  ON service_packages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM photographers
      WHERE photographers.id = service_packages.photographer_id
      AND photographers.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_service_packages_updated_at();

