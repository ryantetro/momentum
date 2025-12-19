-- Migration 012: Automatic Username Generation at Signup
-- This migration adds automatic username generation for new photographers
-- and backfills usernames for existing photographers without one.

-- ============================================================================
-- 1. Create function to generate unique username from email
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_unique_username(email_address TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  clean_username TEXT;
  candidate_username TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 100;
  exists_check BOOLEAN;
  counter_length INTEGER;
  available_length INTEGER;
BEGIN
  -- Extract part before @
  base_username := SPLIT_PART(email_address, '@', 1);
  
  -- Handle edge case: empty or very short prefix
  IF base_username IS NULL OR LENGTH(base_username) = 0 THEN
    base_username := 'user';
  END IF;
  
  -- Clean username: lowercase, remove special chars, replace dots with hyphens
  clean_username := LOWER(base_username);
  clean_username := REGEXP_REPLACE(clean_username, '[^a-z0-9_-]', '', 'g');
  clean_username := REPLACE(clean_username, '.', '-');
  clean_username := REPLACE(clean_username, '+', '-');
  
  -- Remove consecutive hyphens
  WHILE clean_username LIKE '%-%-%' LOOP
    clean_username := REPLACE(clean_username, '--', '-');
  END LOOP;
  
  -- Remove leading/trailing hyphens
  clean_username := TRIM(BOTH '-' FROM clean_username);
  
  -- Ensure minimum length (3 chars)
  IF LENGTH(clean_username) < 3 THEN
    clean_username := clean_username || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3);
  END IF;
  
  -- Truncate to max length (30 chars) before adding suffix
  IF LENGTH(clean_username) > 27 THEN
    clean_username := SUBSTRING(clean_username FROM 1 FOR 27);
  END IF;
  
  -- Try base username first
  candidate_username := clean_username;
  
  -- Check for uniqueness and increment if needed
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM photographers 
      WHERE LOWER(username) = LOWER(candidate_username)
        AND username IS NOT NULL
    ) INTO exists_check;
    
    EXIT WHEN NOT exists_check OR counter >= max_attempts;
    
    counter := counter + 1;
    
    -- Calculate available space for counter
    counter_length := LENGTH(counter::TEXT);
    available_length := 30 - counter_length;
    
    IF LENGTH(clean_username) > available_length THEN
      candidate_username := SUBSTRING(clean_username FROM 1 FOR available_length) || counter::TEXT;
    ELSE
      candidate_username := clean_username || counter::TEXT;
    END IF;
  END LOOP;
  
  -- If we hit max attempts, append random suffix
  IF counter >= max_attempts THEN
    candidate_username := SUBSTRING(clean_username FROM 1 FOR 20) || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
  END IF;
  
  RETURN candidate_username;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_unique_username(TEXT) IS 
'Generates a unique username from an email address. Extracts the part before @, cleans it, and ensures uniqueness by appending numeric suffixes if needed.';

-- ============================================================================
-- 2. Update handle_new_user() trigger to auto-generate username
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Generate unique username
  generated_username := generate_unique_username(NEW.email);
  
  -- Insert photographer with auto-generated username
  INSERT INTO public.photographers (user_id, email, username)
  VALUES (NEW.id, NEW.email, generated_username);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates a photographer profile with a generated username when a new user signs up.';

-- ============================================================================
-- 3. Backfill usernames for existing photographers
-- ============================================================================

DO $$
DECLARE
  photographer_record RECORD;
  generated_username TEXT;
  update_count INTEGER := 0;
BEGIN
  FOR photographer_record IN 
    SELECT id, email FROM photographers WHERE username IS NULL
  LOOP
    BEGIN
      generated_username := generate_unique_username(photographer_record.email);
      
      UPDATE photographers
      SET username = generated_username
      WHERE id = photographer_record.id;
      
      update_count := update_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue with next record
        RAISE NOTICE 'Failed to generate username for photographer %: %', photographer_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Backfilled % usernames for existing photographers', update_count;
END $$;

-- ============================================================================
-- Migration complete
-- ============================================================================

