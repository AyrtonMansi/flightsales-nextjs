import PageShell from '@/components/PageShell';
import { createClient } from '@supabase/supabase-js';

const SITE = 'https://flightsales.com.au';

// 5-min ISR — dealer profiles change infrequently.
export const revalidate = 300;

function makeServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchDealer(id) {
  const supabase = makeServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('dealers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = params;
  const dealer = await fetchDealer(id);
  if (!dealer) {
    return {
      title: 'Dealer not found | FlightSales',
      description: 'This dealer profile is no longer available.',
    };
  }
  const title = `${dealer.name} | FlightSales`;
  const description = `${dealer.name} — verified aircraft dealer${dealer.location ? ` in ${dealer.location}` : ''}. ${dealer.speciality || ''}`.trim();
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/dealers/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/dealers/${id}`,
      siteName: 'FlightSales',
      type: 'website',
    },
  };
}

// schema.org JSON-LD for the dealer — AutomotiveBusiness with rating/address.
function buildJsonLd(dealer) {
  if (!dealer) return null;
  const url = `${SITE}/dealers/${dealer.id}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    '@id': url,
    name: dealer.name,
    url,
    description: dealer.speciality || `${dealer.name} — verified aircraft dealer`,
    address: dealer.location
      ? { '@type': 'PostalAddress', addressLocality: dealer.location, addressCountry: 'AU' }
      : undefined,
    aggregateRating: dealer.rating
      ? { '@type': 'AggregateRating', ratingValue: dealer.rating, bestRating: 5, ratingCount: dealer.listings || 1 }
      : undefined,
  };
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
  return data;
}

export default async function Page({ params }) {
  const dealer = await fetchDealer(params.id);
  const jsonLd = buildJsonLd(dealer);
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PageShell
        initialPage="dealer-detail"
        initialDealerId={params.id}
        initialDealer={dealer || null}
      />
    </>
  );
}
