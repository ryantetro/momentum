-- ============================================================================
-- Debug and Fix Trigger - Run this in Supabase SQL Editor
-- This will help us identify and fix the trigger issue
-- ============================================================================

-- Step 1: Check current trigger function
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 2: Check if username column has UNIQUE constraint
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'photographers'::regclass
  AND conname LIKE '%username%';

-- Step 3: Check current trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 4: Create a simpler, more robust version of the trigger function
-- This version will handle errors better and log them
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
  username_attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  -- Try to generate and insert with username
  LOOP
    BEGIN
      -- Generate unique username
      generated_username := generate_unique_username(NEW.email);
      
      -- If we've tried multiple times, add a random suffix
      IF username_attempts > 0 THEN
        generated_username := generated_username || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
      END IF;
      
      -- Try to insert photographer with auto-generated username
      INSERT INTO public.photographers (user_id, email, username)
      VALUES (NEW.id, NEW.email, generated_username);
      
      -- Success! Exit the loop
      EXIT;
      
    EXCEPTION
      WHEN unique_violation THEN
        -- Username already exists, try again
        username_attempts := username_attempts + 1;
        IF username_attempts >= max_attempts THEN
          -- Too many attempts, use a random username
          generated_username := 'user-' || SUBSTRING(MD5(NEW.id::TEXT || NEW.email) FROM 1 FOR 12);
          BEGIN
            INSERT INTO public.photographers (user_id, email, username)
            VALUES (NEW.id, NEW.email, generated_username);
            EXIT;
          EXCEPTION
            WHEN OTHERS THEN
              -- Last resort: insert without username
              INSERT INTO public.photographers (user_id, email)
              VALUES (NEW.id, NEW.email);
              EXIT;
          END;
        END IF;
        -- Continue loop to try again
        CONTINUE;
        
      WHEN OTHERS THEN
        -- Some other error occurred
        -- Log it but try to insert without username as fallback
        RAISE WARNING 'Error in handle_new_user for user % (attempt %): %', 
          NEW.id, username_attempts, SQLERRM;
        
        -- Try inserting without username
        BEGIN
          INSERT INTO public.photographers (user_id, email)
          VALUES (NEW.id, NEW.email);
          EXIT;
        EXCEPTION
          WHEN OTHERS THEN
            -- If even this fails, we need to raise an error
            -- But we'll make it more informative
            RAISE EXCEPTION 'Failed to create photographer profile for user %: %. Original error: %', 
              NEW.id, SQLERRM, SQLERRM;
        END;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify the trigger is still attached (it should be)
-- If not, recreate it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE 'Trigger recreated';
  ELSE
    RAISE NOTICE 'Trigger already exists';
  END IF;
END $$;

-- Step 6: Test the username generation function
SELECT generate_unique_username('test@example.com') as test_username;

-- Step 7: Check for any existing photographers that might cause conflicts
SELECT COUNT(*) as total_photographers,
       COUNT(DISTINCT username) as unique_usernames,
       COUNT(*) - COUNT(DISTINCT username) as duplicate_usernames
FROM photographers
WHERE username IS NOT NULL;



