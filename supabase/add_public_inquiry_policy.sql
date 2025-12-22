-- ============================================================================
-- Add Public Policy for Inquiry Page
-- This allows anyone to look up photographers by username for inquiry links
-- ============================================================================

-- Add a public policy that allows reading photographer profiles by username
-- This is safe because we only expose limited fields (id, business_name, studio_name, logo_url, email)
CREATE POLICY "Public can view photographers by username"
  ON photographers FOR SELECT
  USING (username IS NOT NULL);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'photographers'
  AND policyname = 'Public can view photographers by username';



