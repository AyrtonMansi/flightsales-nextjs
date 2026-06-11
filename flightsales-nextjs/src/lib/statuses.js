// Single source of truth for status enums + their badge styles. Replaces
// hardcoded strings scattered across DashboardPage / AdminPage / hooks.
//
// Why keep styles here too: badge colors are derived from the status name,
// so co-locating them prevents drift (e.g. "active" reads green in one place,
// neutral in another). Components import LISTING_BADGE[status] instead of
// branching inline.

export const LISTING_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  SOLD: 'sold',
  ARCHIVED: 'archived',
};

export const LISTING_STATUSES = Object.values(LISTING_STATUS);

export const ENQUIRY_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  NEGOTIATING: 'negotiating',
  CLOSED: 'closed',
};

export const ENQUIRY_STATUSES = Object.values(ENQUIRY_STATUS);

export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  ASSIGNED: 'assigned',
  CONVERTED: 'converted',
  LOST: 'lost',
};

export const LEAD_STATUSES = Object.values(LEAD_STATUS);

// Tailwind-ish neutral pairings — kept inline (not classes) because the rest
// of this codebase avoids a CSS framework. Background, foreground.
const GREEN = { bg: '#dcfce7', fg: '#166534' };
const AMBER = { bg: '#fef3c7', fg: '#92400e' };
const NEUTRAL = { bg: '#f3f4f6', fg: '#4b5563' };
const SLATE = { bg: '#e2e8f0', fg: '#475569' };
const BLUE = { bg: '#dbeafe', fg: '#1e40af' };

export const LISTING_BADGE = {
  draft: SLATE,
  pending: AMBER,
  active: GREEN,
  sold: NEUTRAL,
  archived: NEUTRAL,
};

export const ENQUIRY_BADGE = {
  new: GREEN,
  contacted: BLUE,
  negotiating: AMBER,
  closed: NEUTRAL,
};

export const LEAD_BADGE = {
  new: GREEN,
  contacted: BLUE,
  qualified: AMBER,
  assigned: AMBER,
  converted: GREEN,
  lost: NEUTRAL,
};
