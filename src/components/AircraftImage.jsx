// AircraftImage extracted from FlightSalesApp monolith.
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Icons } from './Icons';

const AIRCRAFT_IMAGES = {
  1: "https://images.unsplash.com/photo-1559060017-445fb9722f2a?w=1200&q=80",   // Single engine on tarmac
  2: "https://images.unsplash.com/photo-1583362499848-bdef9d76dafd?w=1200&q=80",   // Cessna 172 wing
  3: "https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1200&q=80",   // Cirrus on ramp
  4: "https://images.unsplash.com/photo-1578925773951-d4f229478e8b?w=1200&q=80",   // Diamond twin
  5: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200&q=80",   // LSA on ground
  6: "https://images.unsplash.com/photo-1583275530834-0e88eed5b2cd?w=1200&q=80",   // Helicopter ground
  7: "https://images.unsplash.com/photo-1558444877-4d6ed0aef74e?w=1200&q=80",   // GA aircraft
  8: "https://images.unsplash.com/photo-1583265627959-fb7042f5133b?w=1200&q=80",   // Twin engine
  9: "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1200&q=80",   // Light sport
  10: "https://images.unsplash.com/photo-1580501170888-15c1a8e72fd2?w=1200&q=80",   // Turboprop
  11: "https://images.unsplash.com/photo-1559060017-445fb9722f2a?w=1200&q=80",   // GA piston
  12: "https://images.unsplash.com/photo-1583362499848-bdef9d76dafd?w=1200&q=80",   // GA wing
};

// --- AIRCRAFT IMAGE COMPONENT ---
const isJustListed = (listing) => {
  const d = listing.created_at || listing.created;
  if (!d) return false;
  return (Date.now() - new Date(d).getTime()) < 7 * 86400000;
};

const AircraftImage = ({ listing, className = "", size = "md", style = {}, showGallery = false }) => {
  // Card image (md) reduced from 220px → 180px so content has more visual weight
  const heights = { sm: "140px", md: "180px", lg: "400px", full: "100%" };
  const [imgIdx, setImgIdx] = useState(0);
  const seed = typeof listing.id === 'number' ? listing.id : (listing.id?.charCodeAt(0) % 12) + 1;
  const fallback = AIRCRAFT_IMAGES[seed] || AIRCRAFT_IMAGES[1];
  const images = (listing.images && listing.images.length > 0) ? listing.images : [fallback];
  const imageUrl = images[imgIdx] || images[0];
  const imgCount = images.length;

  return (
    <div className={className} style={{
      height: heights[size], position: "relative", overflow: "hidden",
      borderRadius: style.borderRadius || 0, background: '#1a1a1a', ...style
    }}>
      <Image
        src={imageUrl}
        alt={listing.title || 'Aircraft photo'}
        fill
        // Card grid is 3-up at desktop, 1-up under 768px. Sized so the browser
        // can pick the right responsive variant from next/image's optimiser.
        sizes={size === 'lg' || size === 'full'
          ? '(max-width: 1024px) 100vw, 1024px'
          : '(max-width: 768px) 100vw, 33vw'}
        // Don't lazy-load LCP imagery (large hero / detail). Card thumbs lazy.
        priority={size === 'lg' || size === 'full'}
        style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />

      {/* Badges — top left. Only "New" rendered for now; Featured tier is shown via card border. */}
      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {isJustListed(listing) && (
          <div style={{ background: "rgba(255,255,255,0.95)", color: "#000", fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: "var(--fs-radius-pill)", letterSpacing: "-0.005em" }}>New</div>
        )}
      </div>

      {/* Photo nav arrows — only in gallery mode */}
      {showGallery && imgCount > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + imgCount) % imgCount); }}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>‹</button>
          <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % imgCount); }}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>›</button>
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
            {images.map((_, i) => <div key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }} style={{ width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />)}
          </div>
        </>
      )}

      {/* Photo count — bottom right */}
      {!showGallery && imgCount > 0 && (
        <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.65)", color: "white", fontSize: "11px", padding: "3px 8px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px", backdropFilter: "blur(4px)" }}>
          {Icons.camera} {imgCount}
        </div>
      )}
    </div>
  );
};

export default AircraftImage;
export { AIRCRAFT_IMAGES };
