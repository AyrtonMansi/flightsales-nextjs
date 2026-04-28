// Format helpers extracted from the FlightSalesApp monolith.
// Kept as pure functions (no React imports) so they can be used in
// server components, client components, or unit tests interchangeably.

export const formatPriceFull = (p) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(p);

export const formatHours = (h) => h ? h.toLocaleString() + " hrs" : "N/A";

export const timeAgo = (d) => {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days/7)} weeks ago`;
  if (days < 60) return "1 month ago";
  if (days < 365) return `${Math.floor(days/30)} months ago`;
  if (days < 730) return "1 year ago";
  return `${Math.floor(days/365)} years ago`;
};

export const isJustListed = (listing) => {
  const d = listing?.created_at || listing?.created;
  if (!d) return false;
  return (Date.now() - new Date(d).getTime()) < 7 * 86400000;
};
