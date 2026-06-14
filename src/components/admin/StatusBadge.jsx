'use client';
import { LISTING_BADGE, ENQUIRY_BADGE, LEAD_BADGE } from '../../lib/statuses';

const TABLES = {
  listing: LISTING_BADGE,
  enquiry: ENQUIRY_BADGE,
  lead: LEAD_BADGE,
};

// Single-source-of-truth badge for a status string. Replaces inline color
// branches scattered through AdminPage and DashboardPage. The label is the
// status value capitalised; pass `label` to override.
export default function StatusBadge({ kind = 'listing', status, label }) {
  const table = TABLES[kind] || LISTING_BADGE;
  const style = table[status] || { bg: '#f3f4f6', fg: '#4b5563' };
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        background: style.bg,
        color: style.fg,
        textTransform: 'capitalize',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {label || status}
    </span>
  );
}
