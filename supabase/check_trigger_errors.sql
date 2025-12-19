-- ============================================================================
-- Check for trigger errors and test username insertion
-- ============================================================================

-- Check if there are any constraint issues
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'photographers'::regclass
  AND (conname LIKE '%username%' OR contype = 'u');

-- Check indexes on username
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'photographers'
  AND indexdef LIKE '%username%';

-- Test inserting a photographer with username manually
-- (This will help us see if there's a constraint issue)
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
  test_username TEXT := 'test-username-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
BEGIN
  -- Try to insert (this will fail because user_id doesn't exist, but we'll see the error)
  BEGIN
    INSERT INTO photographers (user_id, email, username)
    VALUES (test_user_id, 'test@example.com', test_username);
    RAISE NOTICE 'Manual insert test: SUCCESS (username: %)', test_username;
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE 'Manual insert test: Foreign key violation (expected - user does not exist)';
    WHEN unique_violation THEN
      RAISE NOTICE 'Manual insert test: Unique violation on username';
    WHEN OTHERS THEN
      RAISE NOTICE 'Manual insert test: Error - %', SQLERRM;
  END;
END $$;

-- Check the current trigger function code
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

