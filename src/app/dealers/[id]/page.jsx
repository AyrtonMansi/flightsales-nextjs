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

export default async function Page({ params }) {
  const dealer = await fetchDealer(params.id);
  return (
    <ErrorBoundary>
      <FlightSalesApp
        initialPage="dealer-detail"
        initialDealerId={params.id}
        initialDealer={dealer || null}
      />
    </ErrorBoundary>
  );
}
