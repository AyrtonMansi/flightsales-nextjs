// GET /api/geo
// Returns the caller's ISO 3166-1 alpha-2 country code.
//
// Vercel sets `x-vercel-ip-country` on every request based on
// MaxMind's IP database. No third-party service, no rate limit, no
// PII stored. When the header is absent (local dev / non-Vercel
// hosts), the route returns `country: null` and the client falls
// back to its default ordering.

import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'edge';
// Short TTL — the user's IP geo rarely changes within a session, and
// long caching saves us re-reading the same header repeatedly.
export const revalidate = 0;

export function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') || null;
  const region  = req.headers.get('x-vercel-ip-country-region') || null;
  const city    = req.headers.get('x-vercel-ip-city') || null;
  return NextResponse.json(
    { country, region, city },
    {
      // Cache per-IP for 5 minutes at the edge so a chatty client
      // doesn't hammer the route, but stale-while-revalidate keeps
      // the response fresh if the user actually moves.
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
        'Vary': 'x-vercel-ip-country',
      },
    },
  );
}
