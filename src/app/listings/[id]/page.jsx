// Real Next.js dynamic route for an individual listing.
// Server-renders SEO metadata (title, description, OG image) from Supabase
// and hands off to the existing FlightSalesApp client component for the UI.

import FlightSalesApp from '@/components/FlightSalesApp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { createClient } from '@supabase/supabase-js';

const SITE = 'https://flightsales.com.au';

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
  const ogImage = listing.images?.[0];
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
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function Page({ params }) {
  const listing = await fetchListing(params.id);
  return (
    <ErrorBoundary>
      <FlightSalesApp
        initialPage="detail"
        initialListingId={params.id}
        initialListing={listing || null}
      />
    </ErrorBoundary>
  );
}
