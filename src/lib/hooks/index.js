// Barrel re-export. Every consumer that imports from
// '../../lib/hooks' (or any relative depth) keeps working without a
// change because Next/Webpack resolves the directory to this index.
//
// Each named export below moved to a per-domain module in the same
// directory:
//   - aircraft.js       — useAircraft, useFeaturedAircraft, useLatestAircraft
//   - dealers.js        — useDealers
//   - news.ts           — useNews (TypeScript pilot)
//   - auth.js           — useAuth
//   - profile.js        — useProfile
//   - listings.js       — useMyListings, createListing, updateListing,
//                         reportListing, uploadImage
//   - enquiries.js      — useMyEnquiries, submitEnquiry
//   - saves.js          — useSavedAircraft
//   - notifications.js  — useNotifications
//   - leads.js          — submitLead
//   - admin.js          — useAdminListings, useAdminUsers,
//                         useAdminEnquiries, useAdminAudit,
//                         useDealerApplications, useNewsArticles
//   - affiliates.js     — useActiveAffiliates, useAffiliates,
//                         useAffiliateLeads
//
// New code should import directly from the per-domain module
// (`from '../../lib/hooks/admin'`) so the dependency graph is honest
// and tree-shaking can drop unused modules from each consumer's
// bundle. This barrel exists for back-compat only.

export { useAircraft, useFeaturedAircraft, useLatestAircraft } from './aircraft';
export { useDealers } from './dealers';
export { useNews } from './news';
export { useAuth } from './auth';
export { useProfile } from './profile';
export { useMyListings, createListing, updateListing, reportListing, uploadImage } from './listings';
export { useMyEnquiries, submitEnquiry } from './enquiries';
export { useSavedAircraft } from './saves';
export { useNotifications } from './notifications';
export { submitLead } from './leads';
export {
  useAdminListings,
  useAdminUsers,
  useAdminEnquiries,
  useAdminAudit,
  useDealerApplications,
  useNewsArticles,
} from './admin';
export { useActiveAffiliates, useAffiliates, useAffiliateLeads } from './affiliates';
