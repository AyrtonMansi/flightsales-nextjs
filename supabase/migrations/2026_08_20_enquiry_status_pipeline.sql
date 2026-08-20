-- Widen enquiries.status to cover the seller-dashboard and admin-lead
-- pipeline statuses the UI already offers.
--
-- The enquiries table backs two different UIs that both write pipeline
-- statuses beyond the original new/read/replied/spam/archived set:
--   - Seller dashboard (DashboardPage.jsx): new/contacted/negotiating/sold/archived
--   - Admin Leads tab (LeadsTab.jsx, lib/statuses.js LEAD_STATUS):
--     new/contacted/qualified/assigned/converted/lost
-- Every one of those writes was silently rejected by the original CHECK
-- constraint (updateStatus() discarded the error and optimistically
-- updated local state, so it looked like it saved until the next reload).
-- This widens the constraint to the full union actually used in the app
-- instead of narrowing the UI back down to five generic values.
--
-- Paste into the Supabase SQL editor on the live project.

ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_status_check;

ALTER TABLE enquiries ADD CONSTRAINT enquiries_status_check
  CHECK (status IN (
    'new', 'read', 'replied', 'spam', 'archived',       -- original
    'contacted', 'negotiating', 'sold',                  -- seller dashboard
    'qualified', 'assigned', 'converted', 'lost'          -- admin leads
  ));
