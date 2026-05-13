-- Fix: signup was failing with "Database error saving new user" because the
-- handle_new_user trigger raised an exception during the profile INSERT
-- (RLS check, missing column on a stale schema, etc.) and Supabase auth
-- propagates any trigger exception as a 500 to the client.
--
-- This migration:
--   1. Wraps the profile INSERT in BEGIN/EXCEPTION so a failure here can
--      never block signup. The auth.users row still gets created; the
--      profile is backfilled by the React app's ensureProfile() on first
--      sign-in if the trigger didn't manage to write it.
--   2. Honours phone + account_type metadata that the LoginPage register
--      form passes via auth.signUp's options.data (previously dropped, so
--      every business signup silently landed as 'private').
--   3. Sets explicit search_path and SECURITY DEFINER so the function
--      always runs against the public schema with owner privileges.
--
-- Paste this into the Supabase SQL editor on the live project. Existing
-- rows are not touched; only future signups are affected.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_account_type TEXT;
BEGIN
  meta_account_type := CASE
    WHEN NEW.raw_user_meta_data->>'account_type' = 'business' THEN 'business'
    ELSE 'private'
  END;

  BEGIN
    INSERT INTO profiles (id, email, full_name, phone, account_type, pending_dealer)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NULLIF(NEW.raw_user_meta_data->>'phone', ''),
      meta_account_type,
      meta_account_type = 'business'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
