// Dynamic Open Graph image endpoint.
// Used by listing share previews when the listing has no real photo (or
// when we want a branded card regardless). Renders a 1200x630 image at
// the edge using @vercel/og.
//
// Usage: /api/og?title=2024+Cessna+172&price=345000&location=Tyabb%2C+VIC

import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

const FALLBACK_TITLE = 'FlightSales';
const FALLBACK_TAGLINE = "Australia's marketplace for aircraft.";

function formatPrice(p) {
  const n = Number(p);
  if (!Number.isFinite(n) || n <= 0) return '';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0,
  }).format(n);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || FALLBACK_TITLE).slice(0, 80);
  const price = formatPrice(searchParams.get('price'));
  const location = (searchParams.get('location') || '').slice(0, 60);
  const tagline = (searchParams.get('tagline') || FALLBACK_TAGLINE).slice(0, 80);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          color: '#ffffff',
          padding: '64px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex' }}>
          FlightSales
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              marginBottom: 24,
              display: 'flex',
            }}
          >
            {title}
          </div>
          {price && (
            <div style={{ fontSize: 44, fontWeight: 700, color: '#fafafa', marginBottom: 12, display: 'flex' }}>
              {price}
            </div>
          )}
          {location && (
            <div style={{ fontSize: 24, color: '#a1a1aa', display: 'flex' }}>{location}</div>
          )}
          {!price && !location && (
            <div style={{ fontSize: 24, color: '#a1a1aa', display: 'flex' }}>{tagline}</div>
          )}
        </div>
        <div
          style={{
            fontSize: 18,
            color: '#71717a',
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #27272a',
            paddingTop: 24,
          }}
        >
          <div>flightsales.com.au</div>
          <div>Verified marketplace</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
