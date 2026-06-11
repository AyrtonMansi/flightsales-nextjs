'use client';
import { useState } from 'react';
import { useActiveAffiliates } from '../../lib/hooks';
import AffiliateLeadModal from './AffiliateLeadModal';

// Surfaces 1-2 partner CTAs contextually on a listing detail page.
// Filters by listing price + category + state; shows the highest
// display_priority match per type. By default we pick one finance
// + one insurance card — the two highest-intent moments at the
// point of sale. Pass `types` to override.
//
// Single source of truth for which partner shows up: useActiveAffiliates
// already runs the targeting filters server+client side.

export default function AffiliateCTA({ listing, types = ['finance', 'insurance'], user }) {
  const filters = listing
    ? { listingPrice: listing.price, listingCategory: listing.category, listingState: listing.state }
    : {};

  return (
    <div className="fs-affiliate-stack">
      {types.map((t) => (
        <AffiliateCardForType key={t} type={t} filters={filters} listing={listing} user={user} />
      ))}
    </div>
  );
}

function AffiliateCardForType({ type, filters, listing, user }) {
  const { affiliates } = useActiveAffiliates({ type, ...filters });
  const top = affiliates[0];
  if (!top) return null;
  return <AffiliateCard partner={top} listing={listing} user={user} />;
}

export function AffiliateCard({ partner, listing, user }) {
  const [open, setOpen] = useState(false);
  if (!partner) return null;

  return (
    <>
      <div className="fs-affiliate-card">
        {partner.logo_url ? (
          <img className="fs-affiliate-card-logo" src={partner.logo_url} alt={partner.name} />
        ) : (
          <div className="fs-affiliate-card-logo fs-affiliate-card-logo-fallback">
            {partner.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="fs-affiliate-card-body">
          <p className="fs-affiliate-card-eyebrow">{prettyType(partner.type)} · Partner</p>
          <h4 className="fs-affiliate-card-name">{partner.name}</h4>
          {partner.description && (
            <p className="fs-affiliate-card-desc">{partner.description}</p>
          )}
        </div>
        <button
          type="button"
          className="fs-affiliate-card-cta"
          onClick={() => setOpen(true)}
        >
          {partner.cta_text || 'Get a quote'} →
        </button>
      </div>

      {open && (
        <AffiliateLeadModal
          partner={partner}
          listing={listing}
          user={user}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function prettyType(t) {
  switch (t) {
    case 'finance':     return 'Finance';
    case 'insurance':   return 'Insurance';
    case 'escrow':      return 'Escrow';
    case 'maintenance': return 'Maintenance';
    case 'training':    return 'Training';
    case 'inspection':  return 'Inspection';
    case 'transport':   return 'Transport';
    default:            return 'Partner';
  }
}
