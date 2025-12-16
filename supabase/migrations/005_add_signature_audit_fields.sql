-- Add signature audit trail fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS signature_ip_address TEXT;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS signature_user_agent TEXT;

