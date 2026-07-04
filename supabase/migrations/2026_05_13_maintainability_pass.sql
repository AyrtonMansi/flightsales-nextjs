-- Maintainability/scalability pass — no behavior change.
--
-- 1) protect_profile_columns() rewritten to loop over a single
--    protected_cols array instead of 16 hand-written IF blocks. Same
--    columns blocked, same service_role bypass, same error text —
--    just one array to edit instead of a forgettable new IF block
--    whenever a future sensitive column is added to profiles.
--
-- 2) Two missing indexes on aircraft:
--    - (status, created_at DESC): the hottest buyer-facing read path
--      (.eq('status','active').order('created_at desc')) only had a
--      single-column status index before this.
--    - (expires_at): the daily expire-listings cron scans this column
--      with no index today.
--
-- Paste into the Supabase SQL editor on the live project.

CREATE OR REPLACE FUNCTION protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  protected_cols CONSTANT TEXT[] := ARRAY[
    'role', 'is_dealer', 'abn', 'abn_verified_at', 'abn_business_name',
    'abn_entity_type', 'abn_status', 'abn_gst_registered', 'abn_postcode',
    'abn_state', 'pending_dealer', 'suspended_at', 'suspension_reason',
    'subscription_plan', 'subscription_status', 'dealer_id'
  ];
  col TEXT;
BEGIN
  caller_role := COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    ''
  );
  IF caller_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  FOREACH col IN ARRAY protected_cols LOOP
    IF (to_jsonb(NEW) ->> col) IS DISTINCT FROM (to_jsonb(OLD) ->> col) THEN
      IF col = 'abn' THEN
        RAISE EXCEPTION 'cannot modify profiles.abn directly (use /api/abn-verify)';
      ELSE
        RAISE EXCEPTION 'cannot modify profiles.%', col;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_aircraft_status_created ON aircraft(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aircraft_expires_at ON aircraft(expires_at);
