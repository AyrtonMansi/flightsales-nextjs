import { createClient } from '@supabase/supabase-js';

const SITE = 'https://flightsales.com.au';

function makeServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Sitemap enumerates only routes that actually exist.
// Static pages are listed inline; dynamic listing and dealer URLs are pulled
// from Supabase at build time so Google crawls real listings, not 404s.
export default async function sitemap() {
  const now = new Date();

  const staticRoutes = [
    { url: SITE, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/buy`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/sell`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/dealers`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/news`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/contact`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ].map(r => ({ ...r, lastModified: now }));

  let dynamicRoutes = [];
  const supabase = makeServerClient();
  if (supabase) {
    const { data: listings } = await supabase
      .from('aircraft')
      .select('id, updated_at')
      .eq('status', 'active');
    if (Array.isArray(listings)) {
      dynamicRoutes.push(
        ...listings.map(l => ({
          url: `${SITE}/listings/${l.id}`,
          lastModified: l.updated_at ? new Date(l.updated_at) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        }))
      );
    }

    const { data: dealers } = await supabase
      .from('dealers')
      .select('id')
      .eq('verified', true);
    if (Array.isArray(dealers)) {
      dynamicRoutes.push(
        ...dealers.map(d => ({
          url: `${SITE}/dealers/${d.id}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.6,
        }))
      );
    }
  }

  return [...staticRoutes, ...dynamicRoutes];
}
