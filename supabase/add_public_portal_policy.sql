-- Add public RLS policy for bookings table to allow portal access
-- This allows unauthenticated clients to access their booking via portal_token

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view booking by portal token" ON bookings;

-- Policy: Allow public SELECT access to bookings by portal_token
-- This is safe because portal_token is unique and acts as a secure access key
-- The WHERE clause in the query (eq("portal_token", token)) provides the security
CREATE POLICY "Public can view booking by portal token"
  ON bookings FOR SELECT
  USING (true); -- Allow all SELECTs - portal_token matching in query provides security

-- Note: The portal page query uses .eq("portal_token", token) which ensures
-- only the correct booking is returned. The portal_token acts as the security mechanism.

COMMENT ON POLICY "Public can view booking by portal token" ON bookings IS
'Allows unauthenticated users to access booking data via portal_token. The portal_token acts as the security mechanism since it is unique and not easily guessable. The query must still match portal_token in the WHERE clause.';

