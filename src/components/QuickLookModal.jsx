'use client';
import AircraftImage from './AircraftImage';
import { Icons } from './Icons';
import { formatPriceFull, formatHours } from '../lib/format';

const QuickLookModal = ({ listing, onClose, onViewFull, onSave, saved, onEnquire }) => {
  if (!listing) return null;
  const dealerName = listing.dealer?.name || (typeof listing.dealer === 'string' ? listing.dealer : null);
  const location = [listing.city, listing.state].filter(Boolean).join(', ');
  const tags = [
    listing.ifr && "IFR",
    listing.glass_cockpit && "Glass cockpit",
    listing.pressurised && "Pressurised",
    listing.retractable && "Retractable",
  ].filter(Boolean);

  return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div
        className="fs-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 880, padding: 0, overflow: "hidden" }}
      >
        <div className="fs-grid-aside" style={{ minHeight: 480, gap: 0 }}>
          <div style={{ position: "relative", background: "#000" }}>
            <AircraftImage listing={listing} size="full" showGallery={true} style={{ height: "100%" }} />
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ position: "absolute", top: 16, left: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}
            >{Icons.x}</button>
          </div>
          <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 12, overflow: "auto" }}>
            {dealerName && (
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fs-ink-3)", display: "flex", alignItems: "center", gap: 6, letterSpacing: "-0.005em" }}>
                {Icons.shield}<span>{dealerName}</span>
              </div>
            )}
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2 }}>{listing.title}</h2>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--fs-ink)" }}>{formatPriceFull(listing.price)}</div>
            {location && (
              <div style={{ fontSize: 14, color: "var(--fs-ink-3)", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                {Icons.location}{location}
              </div>
            )}
            <div className="fs-grid-2" style={{ gap: "10px 16px", padding: "12px 0", borderTop: "1px solid var(--fs-line)", borderBottom: "1px solid var(--fs-line)" }}>
              {listing.ttaf > 0 && <div><div style={{ fontSize: 11, color: "var(--fs-ink-4)", fontWeight: 600 }}>TOTAL TIME</div><div style={{ fontSize: 14, fontWeight: 600 }}>{formatHours(listing.ttaf)}</div></div>}
              {listing.eng_hours > 0 && <div><div style={{ fontSize: 11, color: "var(--fs-ink-4)", fontWeight: 600 }}>ENGINE SMOH</div><div style={{ fontSize: 14, fontWeight: 600 }}>{formatHours(listing.eng_hours)}</div></div>}
              {listing.year && <div><div style={{ fontSize: 11, color: "var(--fs-ink-4)", fontWeight: 600 }}>YEAR</div><div style={{ fontSize: 14, fontWeight: 600 }}>{listing.year}</div></div>}
              {listing.condition && <div><div style={{ fontSize: 11, color: "var(--fs-ink-4)", fontWeight: 600 }}>CONDITION</div><div style={{ fontSize: 14, fontWeight: 600 }}>{listing.condition}</div></div>}
              {listing.cruise_kts && <div><div style={{ fontSize: 11, color: "var(--fs-ink-4)", fontWeight: 600 }}>CRUISE</div><div style={{ fontSize: 14, fontWeight: 600 }}>{listing.cruise_kts} kts</div></div>}
              {listing.range_nm && <div><div style={{ fontSize: 11, color: "var(--fs-ink-4)", fontWeight: 600 }}>RANGE</div><div style={{ fontSize: 14, fontWeight: 600 }}>{listing.range_nm} nm</div></div>}
            </div>
            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tags.map(t => (
                  <span key={t} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: "var(--fs-radius-sm)", background: "var(--fs-bg-2)", color: "var(--fs-ink)" }}>{t}</span>
                ))}
              </div>
            )}
            <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => onEnquire(listing)} className="fs-btn fs-btn-primary" style={{ width: "100%" }}>
                {Icons.mail} Contact seller
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onViewFull(listing)} className="fs-btn fs-btn-secondary" style={{ flex: 1 }}>
                  View full listing
                </button>
                <button
                  onClick={() => onSave(listing.id)}
                  aria-label={saved ? "Saved" : "Save"}
                  style={{ width: 48, borderRadius: "var(--fs-radius-pill)", background: "var(--fs-bg-2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: saved ? "var(--fs-ink)" : "var(--fs-ink-3)" }}
                >
                  {saved ? Icons.heartFull : Icons.heart}
                </button>
              </div>
            </div>
          </div>
        </div>
        <style>{`@media (max-width: 768px) { .fs-modal > div { grid-template-columns: 1fr !important; } }`}</style>
      </div>
    </div>
  );
};

export default QuickLookModal;
