-- ============================================================================
-- Fix Username Generation Function - Performance Issue
-- The function is timing out, likely due to inefficient uniqueness checks
-- ============================================================================

-- Drop and recreate with better performance
CREATE OR REPLACE FUNCTION generate_unique_username(email_address TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  clean_username TEXT;
  candidate_username TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 50;
  exists_check BOOLEAN;
BEGIN
  -- Extract base username from email (part before @)
  base_username := LOWER(SPLIT_PART(email_address, '@', 1));
  
  -- Remove invalid characters, keep only alphanumeric and hyphens
  clean_username := REGEXP_REPLACE(base_username, '[^a-z0-9-]', '', 'g');
  
  -- Remove leading/trailing hyphens
  clean_username := TRIM(BOTH '-' FROM clean_username);
  
  -- Ensure minimum length
  IF LENGTH(clean_username) < 3 THEN
    clean_username := 'user' || clean_username;
  END IF;
  
  -- Truncate to max length (accounting for counter)
  IF LENGTH(clean_username) > 25 THEN
    clean_username := SUBSTRING(clean_username FROM 1 FOR 25);
  END IF;
  
  -- Try the base username first
  candidate_username := clean_username;
  
  -- Check if it exists and generate unique one
  LOOP
    -- Use a more efficient EXISTS check
    SELECT NOT EXISTS (
      SELECT 1 FROM photographers 
      WHERE username = candidate_username
    ) INTO exists_check;
    
    -- If username doesn't exist, we're done
    IF exists_check THEN
      EXIT;
    END IF;
    
    -- Increment counter
    counter := counter + 1;
    
    -- If we've tried too many times, use a random suffix
    IF counter >= max_attempts THEN
      candidate_username := clean_username || '-' || SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8);
      -- One final check
      SELECT NOT EXISTS (
        SELECT 1 FROM photographers 
        WHERE username = candidate_username
      ) INTO exists_check;
      
      IF exists_check THEN
        EXIT;
      END IF;
      
      -- If still exists, use timestamp-based suffix
      candidate_username := clean_username || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
      EXIT; -- Force exit, this should be unique
    END IF;
    
    -- Append counter to username
    IF LENGTH(clean_username) + LENGTH(counter::TEXT) <= 30 THEN
      candidate_username := clean_username || counter::TEXT;
    ELSE
      -- Truncate and append
      candidate_username := SUBSTRING(clean_username FROM 1 FOR 30 - LENGTH(counter::TEXT)) || counter::TEXT;
    END IF;
  END LOOP;
  
  RETURN candidate_username;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT generate_unique_username('test@example.com') as test_username;

-- Test with multiple calls to ensure it's fast
DO $$
DECLARE
  i INTEGER;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  test_username TEXT;
BEGIN
  start_time := clock_timestamp();
  
  FOR i IN 1..10 LOOP
    test_username := generate_unique_username('test' || i || '@example.com');
  END LOOP;
  
  end_time := clock_timestamp();
  
  RAISE NOTICE 'Generated 10 usernames in % milliseconds', 
    EXTRACT(MILLISECONDS FROM (end_time - start_time));
END $$;

