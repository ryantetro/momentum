-- ============================================================================
-- Fix Trigger Diagnostic and Repair Script
-- Run this in your Supabase SQL Editor to diagnose and fix trigger issues
-- ============================================================================

-- Step 1: Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 2: Check if the function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 3: Check if username column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'photographers' 
  AND column_name = 'username';

-- Step 4: Drop and recreate the trigger (if needed)
-- Uncomment the lines below if you need to recreate the trigger

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Test the function directly
-- This should return a username
SELECT generate_unique_username('test@example.com') as test_username;

-- Step 6: Check for any errors in the function
-- The function should handle errors gracefully, but let's verify it exists
DO $$
BEGIN
  PERFORM generate_unique_username('test@example.com');
  RAISE NOTICE 'Username generation function works correctly';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in username generation: %', SQLERRM;
END $$;

-- Step 7: Add better error handling to the trigger function
-- This version will log errors instead of failing silently
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  BEGIN
    -- Generate unique username
    generated_username := generate_unique_username(NEW.email);
    
    -- Insert photographer with auto-generated username
    INSERT INTO public.photographers (user_id, email, username)
    VALUES (NEW.id, NEW.email, generated_username);
    
    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
      
      -- Try to insert without username as fallback
      BEGIN
        INSERT INTO public.photographers (user_id, email)
        VALUES (NEW.id, NEW.email);
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- If even this fails, log and re-raise
          RAISE EXCEPTION 'Failed to create photographer profile: %', SQLERRM;
      END;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Verify the trigger is attached
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

