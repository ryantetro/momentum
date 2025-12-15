-- Phase 6.1: Payment Reminders Schema

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

