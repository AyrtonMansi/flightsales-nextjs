// Home route — server-fetches the Featured + Just Listed grids so the
// HTML response already contains them. Eliminates the skeleton flash and
// makes the most-trafficked content crawlable without JS execution.

import PageShell from '@/components/PageShell';
import { createClient } from '@supabase/supabase-js';

// 1-min ISR — home is the most-trafficked entry; cached HTML between
// updates avoids hammering Supabase on every request.
export const revalidate = 60;

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: "FlightSales | Australia's marketplace for aircraft",
  description: "Buy and sell aircraft with confidence. Verified listings, transparent pricing, real market data.",
  alternates: { canonical: SITE },
  openGraph: {
    title: "FlightSales | Australia's marketplace for aircraft",
    description: 'Buy and sell aircraft with confidence.',
    url: SITE,
    siteName: 'FlightSales',
    type: 'website',
    images: [{ url: `${SITE}/api/og?title=Find+your+next+aircraft`, width: 1200, height: 630 }],
  },
};

function makeServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchHomeData() {
  const supabase = makeServerClient();
  if (!supabase) return { featured: [], latest: [], totalListings: 0 };

  const [featuredRes, latestRes, countRes] = await Promise.all([
    supabase
      .from('aircraft')
      .select(`*, dealer:dealers(id, name, location, rating, verified)`)
      .eq('featured', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('aircraft')
      .select(`*, dealer:dealers(id, name, location, rating, verified)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('aircraft')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ]);

  return {
    featured: featuredRes.data || [],
    latest: latestRes.data || [],
    totalListings: countRes.count || 0,
  };
}

export default async function Page() {
  const homeData = await fetchHomeData();
  return <PageShell initialPage="home" initialHomeData={homeData} />;
}
