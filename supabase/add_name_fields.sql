-- ============================================================================
-- Add first_name and last_name fields to photographers table
-- ============================================================================

-- Add first_name and last_name columns
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update trigger to use first_name and last_name from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  clean_username TEXT;
  candidate_username TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- Get first_name and last_name from user metadata
  first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  
  -- Generate username from first and last name if available
  IF first_name_val != '' AND last_name_val != '' THEN
    -- Combine first and last name
    base_username := LOWER(first_name_val || last_name_val);
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
    
    -- Make it unique by adding user ID hash
    candidate_username := clean_username || '-' || SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8);
  ELSE
    -- Fallback to email-based username if names not provided
    base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
    clean_username := REGEXP_REPLACE(base_username, '[^a-z0-9-]', '', 'g');
    clean_username := TRIM(BOTH '-' FROM clean_username);
    
    IF LENGTH(clean_username) < 3 THEN
      clean_username := 'user' || clean_username;
    END IF;
    
    IF LENGTH(clean_username) > 25 THEN
      clean_username := SUBSTRING(clean_username FROM 1 FOR 25);
    END IF;
    
    candidate_username := clean_username || '-' || SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8);
  END IF;
  
  -- Insert photographer with username and names
  INSERT INTO public.photographers (user_id, email, username, first_name, last_name)
  VALUES (NEW.id, NEW.email, candidate_username, 
          NULLIF(first_name_val, ''), 
          NULLIF(last_name_val, ''));
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    
    -- Fallback: insert without username
    BEGIN
      INSERT INTO public.photographers (user_id, email, first_name, last_name)
      VALUES (NEW.id, NEW.email, 
              NULLIF(first_name_val, ''), 
              NULLIF(last_name_val, ''));
      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create photographer: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify
SELECT 'Name fields and updated trigger function created' as status;



