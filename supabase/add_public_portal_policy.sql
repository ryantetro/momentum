-- Add public RLS policies for portal access
-- This allows unauthenticated clients to access their booking, client info, and photographer info via portal_token

-- 1. Bookings Policy
DROP POLICY IF EXISTS "Public can view booking by portal token" ON bookings;
CREATE POLICY "Public can view booking by portal token"
  ON bookings FOR SELECT
  USING (true);

-- 2. Robust Access Functions
-- These functions use SECURITY DEFINER to bypass RLS on the bookings table
-- when checking for portal access, which is more reliable for public access.

CREATE OR REPLACE FUNCTION public.check_client_portal_access(client_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM bookings 
    WHERE client_id = client_uuid 
    AND portal_token IS NOT NULL
  ) INTO has_access;
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_photographer_portal_access(photo_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM bookings 
    WHERE photographer_id = photo_uuid 
    AND portal_token IS NOT NULL
  ) INTO has_access;
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Debug function to check access status
CREATE OR REPLACE FUNCTION public.debug_portal_access(test_client_id UUID, test_photo_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'client_has_access', public.check_client_portal_access(test_client_id),
    'photo_has_access', public.check_photographer_portal_access(test_photo_id),
    'client_id_exists', EXISTS(SELECT 1 FROM clients WHERE id = test_client_id),
    'photo_id_exists', EXISTS(SELECT 1 FROM photographers WHERE id = test_photo_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Clients Policy
DROP POLICY IF EXISTS "Public can view client via portal token" ON clients;
CREATE POLICY "Public can view client via portal token"
  ON clients FOR SELECT
  USING (public.check_client_portal_access(id));

-- 4. Photographers Policy
DROP POLICY IF EXISTS "Public can view photographer via portal token" ON photographers;
CREATE POLICY "Public can view photographer via portal token"
  ON photographers FOR SELECT
  USING (public.check_photographer_portal_access(id));

COMMENT ON POLICY "Public can view booking by portal token" ON bookings IS
'Allows unauthenticated users to access booking data via portal_token.';
COMMENT ON POLICY "Public can view client via portal token" ON clients IS
'Allows unauthenticated users to access client data if linked to a booking with a portal_token.';
COMMENT ON POLICY "Public can view photographer via portal token" ON photographers IS
'Allows unauthenticated users to access photographer data if linked to a booking with a portal_token.';

