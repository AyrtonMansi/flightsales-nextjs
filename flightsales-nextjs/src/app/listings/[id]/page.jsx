// Real Next.js dynamic route for an individual listing.
// Server-renders SEO metadata (title, description, OG image, JSON-LD)
// from Supabase and hands off to the client app via PageShell for the UI.

import PageShell from '@/components/PageShell';
import { createClient } from '@supabase/supabase-js';

const SITE = 'https://flightsales.com.au';

// 5-min ISR — listings change infrequently; serving cached HTML between
// updates eliminates a Supabase round-trip on every detail-page request.
export const revalidate = 300;

function makeServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchListing(id) {
  const supabase = makeServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('aircraft')
    .select(`*, dealer:dealers(id, name, location, rating, verified)`)
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = params;
  const listing = await fetchListing(id);
  if (!listing) {
    return {
      title: 'Listing not found | FlightSales',
      description: 'This aircraft listing is no longer available.',
    };
  }
  const priceTxt = listing.price ? ` — $${listing.price.toLocaleString()}` : '';
  const locTxt = [listing.city, listing.state].filter(Boolean).join(', ');
  const title = `${listing.title}${priceTxt} | FlightSales`;
  const description = `${listing.year || ''} ${listing.manufacturer || ''} ${listing.model || ''}`.trim()
    + (locTxt ? ` for sale in ${locTxt}.` : ' for sale.')
    + (listing.description ? ` ${listing.description.slice(0, 140)}` : '');
  // Prefer the listing's actual photo; fall back to a generated OG card so
  // every listing has a presentable share preview even with no images.
  const ogParams = new URLSearchParams({
    title: listing.title || 'Aircraft for sale',
    price: String(listing.price || ''),
    location: locTxt,
  }).toString();
  const ogImage = listing.images?.[0] || `${SITE}/api/og?${ogParams}`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/listings/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/listings/${id}`,
      siteName: 'FlightSales',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

// schema.org JSON-LD for the listing — Vehicle as the primary type with a
// nested Product/Offer so Google can show price + availability in rich
// results. Server-rendered into the HTML; no JS required to read.
function buildJsonLd(listing) {
  if (!listing) return null;
  const url = `${SITE}/listings/${listing.id}`;
  const image = listing.images?.[0];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    '@id': url,
    name: listing.title,
    description: listing.description || `${listing.year || ''} ${listing.manufacturer || ''} ${listing.model || ''}`.trim(),
    url,
    vehicleModelDate: listing.year ? String(listing.year) : undefined,
    brand: listing.manufacturer ? { '@type': 'Brand', name: listing.manufacturer } : undefined,
    model: listing.model || undefined,
    image: image || undefined,
    mileageFromOdometer: listing.ttaf
      ? { '@type': 'QuantitativeValue', value: listing.ttaf, unitCode: 'HUR' }
      : undefined,
    offers: listing.price
      ? {
          '@type': 'Offer',
          url,
          priceCurrency: 'AUD',
          price: listing.price,
          availability: listing.status === 'sold'
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
          seller: listing.dealer?.name
            ? { '@type': 'Organization', name: listing.dealer.name }
            : { '@type': 'Person', name: 'Private seller' },
        }
      : undefined,
  };
  // Strip undefined values for cleaner output
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
  return data;
}

export default async function Page({ params }) {
  const listing = await fetchListing(params.id);
  const jsonLd = buildJsonLd(listing);
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PageShell
        initialPage="detail"
        initialListingId={params.id}
        initialListing={listing || null}
      />
    </>
  );
}
