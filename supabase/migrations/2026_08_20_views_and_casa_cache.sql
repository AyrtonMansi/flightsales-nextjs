-- Two pre-launch fixes: an actually-atomic view counter, and closing a
-- cache-poisoning hole on casa_cache.
--
-- Paste into the Supabase SQL editor on the live project.

-- 1. increment_view_count()
--
-- /api/views has always called this RPC first and silently fallen back to a
-- read-modify-write when it errored... but the function was never actually
-- created, so the fallback ran on every single view: three round trips per
-- request, and a lost-update race where concurrent views on the same listing
-- overwrite each other's increments (so a popular listing under-counts
-- exactly when it matters most).
CREATE OR REPLACE FUNCTION increment_view_count(aircraft_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE aircraft
     SET view_count = COALESCE(view_count, 0) + 1
   WHERE id = aircraft_id;
$$;

-- Only the server route (service role) should be able to bump counters.
REVOKE EXECUTE ON FUNCTION increment_view_count(UUID) FROM PUBLIC, anon, authenticated;

-- 2. casa_cache INSERT policy
--
-- The existing policy is named "Service role can insert CASA cache" but
-- actually grants INSERT to any `authenticated` user with WITH CHECK (true).
-- casa_cache backs the /sell registration lookup, which auto-fills
-- manufacturer / model / MTOW / seats straight from the cached row — so any
-- signed-up user could pre-poison the cache for a rego someone else was about
-- to list and corrupt their listing data.
--
-- The route now writes with the service-role client (which bypasses RLS
-- entirely), so no authenticated-user INSERT grant is needed at all.
DROP POLICY IF EXISTS "Service role can insert CASA cache" ON casa_cache;

-- Public read stays as-is: the cache holds nothing but public CASA register
-- data, and reads are what make repeat lookups fast.
