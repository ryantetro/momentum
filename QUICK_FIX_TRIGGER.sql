-- ============================================================================
-- QUICK FIX: Update the trigger function with better error handling
-- Copy and paste this entire file into your Supabase SQL Editor and run it
-- ============================================================================

-- Update handle_new_user() trigger to auto-generate username with error handling
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
      -- Log the error but try to continue
      RAISE WARNING 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
      
      -- Try to insert without username as fallback
      BEGIN
        INSERT INTO public.photographers (user_id, email)
        VALUES (NEW.id, NEW.email);
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- If even this fails, re-raise the error
          RAISE EXCEPTION 'Failed to create photographer profile: %', SQLERRM;
      END;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger is still attached
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';



