'use client';
import { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import AircraftImage from '../AircraftImage';
import ListingCard from '../ListingCard';
import EnquiryModal from '../EnquiryModal';
import AffiliateCTA from '../affiliates/AffiliateCTA';
import ReportListingModal from '../ReportListingModal';
import { useAircraft } from '../../lib/hooks';
import { formatPriceFull, formatHours, timeAgo, isJustListed } from '../../lib/format';
import { DEALERS } from '../../lib/constants';

const ListingDetail = ({ listing, onBack, savedIds, onSave, user, onSelectDealer }) => {
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);
  const { aircraft: similar } = useAircraft({ category: listing?.category, sortBy: 'newest' });

  // Fire view tracking once per mount. /api/views handles cookie-dedup
  // so reloads within 24h don't inflate the count. Failures are silent
  // — view counts are informational, not billable.
  useEffect(() => {
    if (!listing?.id) return;
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aircraftId: listing.id }),
    }).catch(() => {});
  }, [listing?.id]);

  if (!listing) return null;
  const l = listing;
  const rawDealer = l.dealer;
  const dealerName = (rawDealer && typeof rawDealer === 'object') ? rawDealer.name : (typeof rawDealer === 'string' ? rawDealer : null);
  // Resolve a navigable dealer object: prefer joined object, else fall back to DEALERS lookup by id/name
  const dealerObj = (rawDealer && typeof rawDealer === 'object')
    ? rawDealer
    : (DEALERS.find(d => d.id === l.dealer_id) || DEALERS.find(d => d.name === dealerName) || (dealerName ? { name: dealerName } : {}));
  const canOpenDealer = !!(onSelectDealer && (dealerObj.id || dealerObj.name));
  const isSaved = savedIds.has(l.id);
  // monthlyEst removed — was a naive l.price * 0.008 multiplier, not real amortisation

  const casaSpecs = [
    ["Year", l.year],
    ["Manufacturer", l.manufacturer],
    ["Model", l.model],
    l.rego && ["Registration", l.rego],
    ["Category", l.category],
    ["Condition", l.condition],
  ].filter(Boolean);

  const detailSpecs = [
    l.ttaf != null && ["Total Time Airframe", formatHours(l.ttaf)],
    l.eng_hours != null && ["Engine Hours (SMOH)", formatHours(l.eng_hours)],
    l.eng_tbo && ["Engine TBO", formatHours(l.eng_tbo)],
    l.specs?.engine && ["Engine", l.specs.engine],
    l.specs?.propeller && ["Propeller", l.specs.propeller],
    l.avionics && ["Avionics", l.avionics],
    l.specs?.seats && ["Seats", l.specs.seats],
    l.specs?.mtow_kg && ["MTOW", l.specs.mtow_kg + " kg"],
    l.specs?.wingspan_m && ["Wingspan", l.specs.wingspan_m + " m"],
    l.useful_load && ["Useful Load", l.useful_load + " kg"],
    l.range_nm && ["Range", l.range_nm + " nm"],
    l.cruise_kts && ["Cruise Speed", l.cruise_kts + " kts"],
    l.fuel_burn && ["Fuel Burn", l.fuel_burn + " L/hr"],
    ["IFR Capable", l.ifr ? "✓" : "—"],
    ["Retractable Gear", l.retractable ? "✓" : "—"],
    l.pressurised !== undefined && ["Pressurised", l.pressurised ? "✓" : "—"],
    ["Glass Cockpit", l.glass_cockpit ? "✓" : "—"],
    l.specs?.parachute && ["Parachute", l.specs.parachute],
  ].filter(Boolean);

  const similarListings = similar.filter(s => s.id !== l.id).slice(0, 3);

  return (
    <>
      <div className="fs-detail-header">
        <div className="fs-container">
          <div className="fs-detail-breadcrumb">
            <span onClick={onBack} style={{ cursor: "pointer" }}>Buy</span> {Icons.chevronRight}
            <span>{l.category}</span> {Icons.chevronRight}
            <span style={{ color: "var(--fs-ink)" }}>{l.title}</span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.03em", color: "var(--fs-ink)" }}>{l.title}</h1>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--fs-ink-3)", alignItems: "center", flexWrap: "wrap", fontWeight: 500, marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--fs-ink)", letterSpacing: "-0.02em" }}>{formatPriceFull(l.price)}</span>
            <span>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.location} {[l.city, l.state].filter(Boolean).join(', ')}</span>
            <span>·</span>
            <span>Listed {timeAgo(l.created_at || l.created)}</span>
            {dealerName && <span className="fs-tag">{Icons.shield} Verified Dealer</span>}
            {l.rego && <span className="fs-tag">CASA {l.rego}</span>}
            {l.ifr && <span className="fs-tag">IFR</span>}
            {isJustListed(l) && <span className="fs-tag" style={{ background: "var(--fs-green)", color: "#fff" }}>Just Listed</span>}
          </div>
        </div>
      </div>

      <div className="fs-container">
        <div className="fs-detail-layout">
          {/* Main content */}
          <div>
            <AircraftImage listing={l} size="lg" style={{ borderRadius: "var(--fs-radius)", marginBottom: 20 }} showGallery={true} />

            {l.description && (
              <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
                <h3>Description</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--fs-gray-600)", whiteSpace: "pre-line" }}>{l.description}</p>
              </div>
            )}

            <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
              <h3>Aircraft Details</h3>
              {casaSpecs.map(([label, value]) => (
                <div key={label} className="fs-detail-spec-row">
                  <span className="fs-detail-spec-label">{label}</span>
                  <span className="fs-detail-spec-value">{value}</span>
                </div>
              ))}
            </div>

            {detailSpecs.length > 0 && (
              <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
                <button
                  onClick={() => setShowDetailedSpecs(!showDetailedSpecs)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid var(--fs-line)",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "var(--fs-font)",
                    color: "var(--fs-ink)",
                  }}
                >
                  <span>Key Specifications</span>
                  <span style={{ fontSize: 12, color: "var(--fs-ink-3)", fontWeight: 500 }}>
                    {showDetailedSpecs ? "Hide" : `Show ${detailSpecs.length} specs`}
                  </span>
                </button>
                {showDetailedSpecs && detailSpecs.map(([label, value]) => (
                  <div key={label} className="fs-detail-spec-row">
                    <span className="fs-detail-spec-label">{label}</span>
                    <span className="fs-detail-spec-value" style={{ color: String(value).startsWith('✓') ? "var(--fs-green)" : undefined }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
              <h3>Cost of Ownership (est.)</h3>
              {[
                ["Annual Insurance", l.category === "Helicopter" ? "$12,000–$25,000" : l.category === "Turboprop" ? "$25,000–$60,000" : l.category === "Light Jet" ? "$40,000–$100,000" : "$5,000–$15,000"],
                ["Annual Inspection", l.category === "Helicopter" ? "$8,000–$15,000" : l.category === "Turboprop" ? "$15,000–$30,000" : l.category === "Light Jet" ? "$20,000–$50,000" : "$3,000–$8,000"],
                ["Hangar (monthly)", "$400–$1,200"],
                l.fuel_burn && ["Fuel per hour", `$${(l.fuel_burn * 2.8).toFixed(0)}`],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="fs-detail-spec-row">
                  <span className="fs-detail-spec-label">{label}</span>
                  <span className="fs-detail-spec-value">{value}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 12 }}>Estimates only. Based on Australian averages. Actual costs vary.</p>
            </div>

            {/* Similar aircraft */}
            {similarListings.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Similar {l.category} Aircraft</h3>
                <div className="fs-grid">
                  {similarListings.map(s => (
                    <ListingCard key={s.id} listing={s} onClick={() => { window.scrollTo(0,0); }} onSave={onSave} saved={savedIds.has(s.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="fs-detail-sidebar">
            <div className="fs-detail-price-card fs-detail-sticky">
              {l.rego && <div className="fs-detail-rego">{l.rego} &middot; {l.condition}</div>}

              <button className="fs-detail-cta fs-detail-cta-primary" onClick={() => setShowEnquiry(true)}>
                {Icons.mail}&nbsp; Contact Seller
              </button>
              <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => onSave(l.id)}>
                {isSaved ? Icons.heartFull : Icons.heart}&nbsp; {isSaved ? "Saved ✓" : "Save to Watchlist"}
              </button>

              {/* Trust signals — only show what's backed by real data */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--fs-line)", display: "flex", flexDirection: "column", gap: 10 }}>
                {l.rego && <div style={{ fontSize: 13, color: "var(--fs-ink-2)", display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}><span style={{ color: "var(--fs-green)" }}>{Icons.check}</span> CASA registered ({l.rego})</div>}
                {dealerName && <div style={{ fontSize: 13, color: "var(--fs-ink-2)", display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}><span style={{ color: "var(--fs-green)" }}>{Icons.check}</span> Verified dealer listing</div>}
              </div>
            </div>

            {dealerName && (
              <div className="fs-detail-specs">
                <h3>Seller</h3>
                <div
                  role={canOpenDealer ? "button" : undefined}
                  tabIndex={canOpenDealer ? 0 : undefined}
                  onClick={canOpenDealer ? () => onSelectDealer(dealerObj) : undefined}
                  onKeyDown={canOpenDealer ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDealer(dealerObj); } } : undefined}
                  style={{
                    display: "block",
                    margin: "-8px",
                    padding: "8px",
                    borderRadius: "var(--fs-radius-lg)",
                    cursor: canOpenDealer ? "pointer" : "default",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (canOpenDealer) e.currentTarget.style.background = "var(--fs-gray-50, #f6f6f6)"; }}
                  onMouseLeave={(e) => { if (canOpenDealer) e.currentTarget.style.background = "transparent"; }}
                  aria-label={canOpenDealer ? `View ${dealerName} profile` : undefined}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                    <div className="fs-dealer-avatar" style={{ width: 48, height: 48, fontSize: 14 }}>{(dealerObj.logo || dealerName?.slice(0,2))?.toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>{dealerName}</div>
                        {canOpenDealer && <span style={{ fontSize: 12, color: "var(--fs-ink-3)" }}>›</span>}
                      </div>
                      {dealerObj.location && <div style={{ fontSize: 13, color: "var(--fs-ink-3)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>{Icons.location} {dealerObj.location}</div>}
                    </div>
                  </div>
                  {dealerObj.rating && (
                    <div style={{ display: "flex", gap: 14, fontSize: 13, color: "var(--fs-ink-3)", fontWeight: 500 }}>
                      <span className="fs-dealer-rating">{Icons.star} {dealerObj.rating}</span>
                      {dealerObj.listings && <span>{dealerObj.listings} active listings</span>}
                    </div>
                  )}
                  {canOpenDealer && (
                    <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "var(--fs-ink-2)" }}>
                      View seller profile →
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle report-listing link at the bottom of the page — easy to
          reach from a buyer who senses something off, but not loud
          enough to imply distrust to honest sellers. */}
      <div style={{ textAlign: 'center', padding: '24px 16px 48px', fontSize: 12, color: 'var(--fs-ink-3)' }}>
        Something off about this listing?{' '}
        <button
          type="button"
          onClick={() => setShowReport(true)}
          style={{
            background: 'none', border: 'none', padding: 0, font: 'inherit',
            color: 'var(--fs-ink)', textDecoration: 'underline',
            textUnderlineOffset: 2, cursor: 'pointer',
          }}
        >Report it</button>.
      </div>

      {/* Partner CTAs — shown contextually based on listing price /
          category / state. Only renders cards for which an active
          partner matches; if no matches, renders nothing. */}
      <div className="fs-container" style={{ marginTop: 24, marginBottom: 24 }}>
        <AffiliateCTA listing={l} user={user} />
      </div>

      {showEnquiry && <EnquiryModal listing={l} onClose={() => setShowEnquiry(false)} user={user} />}
      {showReport && <ReportListingModal aircraftId={l.id} user={user} onClose={() => setShowReport(false)} />}
    </>
  );
};

export default ListingDetail;
