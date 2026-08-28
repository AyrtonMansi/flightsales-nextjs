-- SECURITY: stop serving partner secrets to anonymous visitors.
--
-- The `affiliates` table mixes public branding columns with genuinely
-- sensitive ones — api_credential_secret ("encrypted; admin-only"),
-- lead_webhook_url, api_endpoint_url, commission_pct, contract_url,
-- contact_email, and notes ("admin-only").
--
-- It also carried a blanket row policy:
--     CREATE POLICY "Active affiliates are publicly readable"
--       ON affiliates FOR SELECT USING (status = 'active');
--
-- RLS is ROW-level, not column-level, so that policy exposed every column
-- of every active partner. The browser hook (useActiveAffiliates) issued a
-- plain `.select('*')` with the anon key, which means those secrets were
-- already in the network response of a logged-out /partners page load and
-- every listing-detail page that renders a partner CTA. No exploit needed
-- — open devtools, read the JSON.
--
-- Fix: publish an explicit allow-list view for public consumption and make
-- the base table admin-only.
--
-- Note on view semantics: this view is intentionally left with the default
-- (definer) permissions rather than security_invoker. That is the whole
-- point — it is a controlled, column-limited window onto a table the
-- caller can no longer read directly. The `status = 'active'` filter is
-- baked into the view so it cannot be bypassed by the caller. Supabase's
-- security linter may flag definer views generically; this one is
-- deliberate and its exposed surface is the column list below.
--
-- Paste into the Supabase SQL editor on the live project.

-- 1. Public, column-limited view. Branding + targeting fields only.
DROP VIEW IF EXISTS affiliates_public;
CREATE VIEW affiliates_public AS
  SELECT
    id,
    slug,
    name,
    type,
    logo_url,
    website_url,
    description,
    cta_text,
    min_listing_price,
    max_listing_price,
    categories,
    states,
    display_priority
  FROM affiliates
  WHERE status = 'active';

GRANT SELECT ON affiliates_public TO anon, authenticated;

-- 2. Revoke the blanket public read on the base table. Admins keep full
--    access through the existing "Admins manage affiliates" FOR ALL policy,
--    and server routes that need the lead-delivery columns
--    (/api/affiliate-leads) already use the service-role client, which
--    bypasses RLS entirely.
DROP POLICY IF EXISTS "Active affiliates are publicly readable" ON affiliates;

-- Belt and braces: even if a future policy re-opens rows, the anon role
-- has no table-level privilege to read them.
REVOKE SELECT ON affiliates FROM anon;
