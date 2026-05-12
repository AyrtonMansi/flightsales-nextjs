-- Fix: handle_new_user was ignoring phone + account_type from auth.signUp's
-- options.data, so users who picked "Business" at signup silently landed as
-- 'private' accounts and never reached the dealer admin queue.
--
-- Paste this into the Supabase SQL editor on the live project to update the
-- trigger function. Existing rows aren't touched; only future signups are
-- affected.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_account_type TEXT;
BEGIN
  meta_account_type := CASE
    WHEN NEW.raw_user_meta_data->>'account_type' = 'business' THEN 'business'
    ELSE 'private'
  END;

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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
