-- Phase 6.2: Custom Client Forms Schema

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
-- Photographers can view forms for their bookings
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

-- Photographers can insert forms for their bookings
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

-- Photographers can update forms for their bookings
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

-- Clients can update form_data via portal token (this will be handled in API route with service role)
-- For now, we'll allow updates through the API route which will use service role key

