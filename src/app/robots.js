// Tells crawlers what to index. /admin, /dashboard, /login are noindex
// already via per-route metadata, but listing them here too keeps the
// signal explicit at the protocol level.

const SITE = 'https://flightsales.com.au';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/login', '/auth/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
