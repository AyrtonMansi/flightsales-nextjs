'use client';
import Link from 'next/link';
import AircraftImage from './AircraftImage';
import { Icons } from './Icons';
import { formatPriceFull, formatHours, timeAgo, isJustListed, getCategoryDisplayName } from '../lib/format';

const ListingCard = ({ listing, onSave, saved, onQuickLook }) => {
  const dealerName = listing.dealer?.name || (typeof listing.dealer === 'string' ? listing.dealer : null);
  const dealerVerified = listing.dealer && typeof listing.dealer === 'object' && listing.dealer.verified === true;
  const isNew = isJustListed(listing);
  const location = [listing.city, listing.state].filter(Boolean).join(', ');
  const hasTT = listing.ttaf != null && listing.ttaf > 0;
  const hasSMOH = listing.eng_hours != null && listing.eng_hours > 0;
  const eyebrow = [listing.year, listing.category ? getCategoryDisplayName(listing.category) : null].filter(Boolean).join(' · ');

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSave?.(listing.id);
  };

  const handleQuickLook = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickLook?.(listing);
  };

  return (
    <Link href={`/listings/${listing.id}`} className={`fs-card fs-card-refined${listing.featured ? ' fs-card-featured' : ''}`}>
      <div className="fs-card-image-wrap" style={{ position: 'relative' }}>
        <AircraftImage listing={listing} />
        {isNew && <span className="fs-card-fresh">Just listed</span>}
        <div className="fs-card-actions">
          <button onClick={handleSave} aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'} className={`fs-card-icon-btn${saved ? ' is-saved' : ''}`}>
            {saved ? Icons.heartFull : Icons.heart}
          </button>
          {onQuickLook && (
            <button onClick={handleQuickLook} className="fs-card-icon-btn fs-card-quicklook" aria-label={`Quick look at ${listing.title}`}>
              {Icons.eye}
            </button>
          )}
        </div>
      </div>

      <div className="fs-card-body fs-card-body-refined">
        {eyebrow && <div className="fs-card-eyebrow">{eyebrow}</div>}
        <div className="fs-card-title">{listing.title}</div>
        <div className="fs-card-price">{formatPriceFull(listing.price)}</div>

        {(hasTT || hasSMOH) && (
          <div className="fs-card-keyfacts" aria-label="Key aircraft details">
            {hasTT && <span><strong>{formatHours(listing.ttaf)}</strong> total time</span>}
            {hasSMOH && <span><strong>{formatHours(listing.eng_hours)}</strong> SMOH</span>}
          </div>
        )}

        <div className="fs-card-dealer fs-card-sellerline">
          <span className="fs-card-seller-name">
            {dealerVerified && <span className="fs-card-verified-icon" aria-label="Verified dealer">{Icons.shield}</span>}
            {dealerName || 'Private seller'}
          </span>
          {dealerVerified && <span className="fs-card-abn-pill" title="Dealer profile verified">Verified</span>}
          {listing.seller?.abn_verified_at && <span className="fs-card-abn-pill" title="Business ABN verified against ABR public data">ABR</span>}
          {location && <span className="fs-card-location">{location}</span>}
          {!isNew && <span className="fs-card-age">{timeAgo(listing.created_at || listing.created)}</span>}
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
