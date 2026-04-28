'use client';
import Link from 'next/link';
import AircraftImage from './AircraftImage';
import { Icons } from './Icons';
import {
  formatPriceFull, formatHours, timeAgo, isJustListed, getCategoryDisplayName,
} from '../lib/format';

// Real <Link> anchor: middle-click / right-click / "copy link address" all
// work, the listing URL is in the rendered HTML for crawlers, and Next.js
// prefetches the route on viewport. Save / quick-look buttons inside use
// preventDefault + stopPropagation so clicking them doesn't navigate.
const ListingCard = ({ listing, onSave, saved, onQuickLook }) => {
  const dealerName = listing.dealer?.name || (typeof listing.dealer === 'string' ? listing.dealer : null);
  const isNew = isJustListed(listing);
  const location = [listing.city, listing.state].filter(Boolean).join(', ');
  const hasTT = listing.ttaf != null && listing.ttaf > 0;
  const hasSMOH = listing.eng_hours != null && listing.eng_hours > 0;

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) onSave(listing.id);
  };

  const handleQuickLook = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickLook) onQuickLook(listing);
  };

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`fs-card${listing.featured ? ' fs-card-featured' : ''}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div className="fs-card-image-wrap" style={{ position: "relative" }}>
        <AircraftImage listing={listing} />
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={handleSave}
            aria-label={saved ? "Unsave" : "Save"}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: saved ? "#000" : "rgba(255,255,255,0.95)",
              border: "1px solid var(--fs-line)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: saved ? "#fff" : "#000",
            }}
          >
            {saved ? Icons.heartFull : Icons.heart}
          </button>
          {onQuickLook && (
            <button
              onClick={handleQuickLook}
              className="fs-card-quicklook"
              aria-label="Quick look"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.95)",
                border: "1px solid var(--fs-line)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#000", opacity: 0, transition: "opacity 0.2s",
              }}
            >
              {Icons.eye}
            </button>
          )}
        </div>
      </div>
      <div className="fs-card-body">
        {listing.category && (
          <div className="fs-card-eyebrow">{getCategoryDisplayName(listing.category)}</div>
        )}
        <div className="fs-card-title">{listing.title}</div>
        <div className="fs-card-price">{formatPriceFull(listing.price)}</div>
        <dl className="fs-card-specs">
          <div className="fs-card-specs-row">
            <dt>Total time</dt>
            <dd>{hasTT ? formatHours(listing.ttaf) : '—'}</dd>
          </div>
          <div className="fs-card-specs-row">
            <dt>Engine SMOH</dt>
            <dd>{hasSMOH ? formatHours(listing.eng_hours) : '—'}</dd>
          </div>
          <div className="fs-card-specs-row">
            <dt>IFR</dt>
            <dd>{listing.ifr ? '✓' : '—'}</dd>
          </div>
          <div className="fs-card-specs-row">
            <dt>Glass cockpit</dt>
            <dd>{listing.glass_cockpit ? '✓' : '—'}</dd>
          </div>
        </dl>
        <div className="fs-card-dealer">
          {dealerName ? (
            <>
              {Icons.shield}
              <span>{dealerName}</span>
              {location && (
                <>
                  <span className="fs-card-dealer-sep">·</span>
                  <span className="fs-card-dealer-loc">{location}</span>
                </>
              )}
              <span style={{ marginLeft: 'auto', color: 'var(--fs-ink-4)', fontSize: 11.5 }}>
                {isNew ? "Just listed" : timeAgo(listing.created_at || listing.created)}
              </span>
            </>
          ) : (
            <>
              <span style={{ color: "var(--fs-ink-3)" }}>Private seller</span>
              {location && (
                <>
                  <span className="fs-card-dealer-sep">·</span>
                  <span className="fs-card-dealer-loc">{location}</span>
                </>
              )}
              <span style={{ marginLeft: 'auto', color: 'var(--fs-ink-4)', fontSize: 11.5 }}>
                {isNew ? "Just listed" : timeAgo(listing.created_at || listing.created)}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
