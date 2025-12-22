-- ============================================================================
-- Simple, Fast Trigger Fix
-- This version generates username inline to avoid function call overhead
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  clean_username TEXT;
  candidate_username TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 20;
  username_exists BOOLEAN;
BEGIN
  -- Extract and clean username from email (inline, no function call)
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  clean_username := REGEXP_REPLACE(base_username, '[^a-z0-9-]', '', 'g');
  clean_username := TRIM(BOTH '-' FROM clean_username);
  
  -- Ensure minimum length
  IF LENGTH(clean_username) < 3 THEN
    clean_username := 'user' || clean_username;
  END IF;
  
  -- Truncate to reasonable length
  IF LENGTH(clean_username) > 25 THEN
    clean_username := SUBSTRING(clean_username FROM 1 FOR 25);
  END IF;
  
  -- Try to find a unique username
  candidate_username := clean_username;
  
  LOOP
    -- Quick check if username exists (using index if available)
    SELECT EXISTS(
      SELECT 1 FROM photographers 
      WHERE username = candidate_username
      LIMIT 1
    ) INTO username_exists;
    
    -- If available, use it
    IF NOT username_exists THEN
      EXIT;
    END IF;
    
    -- Increment counter
    counter := counter + 1;
    
    -- If too many attempts, use random suffix
    IF counter >= max_attempts THEN
      candidate_username := clean_username || '-' || SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 8);
      -- This should be unique (uses user ID + timestamp)
      EXIT;
    END IF;
    
    -- Append counter
    IF LENGTH(clean_username) + LENGTH(counter::TEXT) <= 30 THEN
      candidate_username := clean_username || counter::TEXT;
    ELSE
      candidate_username := SUBSTRING(clean_username FROM 1 FOR 30 - LENGTH(counter::TEXT)) || counter::TEXT;
    END IF;
  END LOOP;
  
  -- Insert with username
  INSERT INTO public.photographers (user_id, email, username)
  VALUES (NEW.id, NEW.email, candidate_username);
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- If anything fails, try without username as absolute fallback
    BEGIN
      INSERT INTO public.photographers (user_id, email)
      VALUES (NEW.id, NEW.email);
      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        -- If even this fails, we must raise
        RAISE EXCEPTION 'Failed to create photographer profile: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify trigger is attached
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Test: This should show the trigger is ready
SELECT 'Trigger function updated successfully' as status;



