-- Phase 6.3: Booking Files Schema

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
-- Photographers can view files for their bookings
CREATE POLICY "Photographers can view files for own bookings"
  ON booking_files FOR SELECT
  USING (
    uploaded_by IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

-- Photographers can insert files for their bookings
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

-- Photographers can delete files they uploaded
CREATE POLICY "Photographers can delete own files"
  ON booking_files FOR DELETE
  USING (
    uploaded_by IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  );

-- Note: Client access will be handled via API route using portal token verification
-- The API route will use service role key to bypass RLS for client access

