-- ============================================================================
-- Minimal Trigger - Simplest possible version to debug
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  clean_username TEXT;
  candidate_username TEXT;
BEGIN
  -- Extract username from email
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  
  -- Clean it up
  clean_username := REGEXP_REPLACE(base_username, '[^a-z0-9-]', '', 'g');
  clean_username := TRIM(BOTH '-' FROM clean_username);
  
  -- Ensure minimum length
  IF LENGTH(clean_username) < 3 THEN
    clean_username := 'user' || clean_username;
  END IF;
  
  -- Truncate
  IF LENGTH(clean_username) > 25 THEN
    clean_username := SUBSTRING(clean_username FROM 1 FOR 25);
  END IF;
  
  -- Make it unique by adding user ID hash (guaranteed unique)
  candidate_username := clean_username || '-' || SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8);
  
  -- Insert with username
  INSERT INTO public.photographers (user_id, email, username)
  VALUES (NEW.id, NEW.email, candidate_username);
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    
    -- Fallback: insert without username
    BEGIN
      INSERT INTO public.photographers (user_id, email)
      VALUES (NEW.id, NEW.email);
      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create photographer: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify
SELECT 'Minimal trigger function created' as status;



