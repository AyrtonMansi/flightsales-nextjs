// Allow all crawlers. Previously disallowed during the pre-launch
// phase. /admin, /auth, /dashboard and /api have no SEO value and
// either expose personalised content or are programmatic endpoints
// — exclude them explicitly so Google doesn't waste crawl budget
// or index dashboards.

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/auth/', '/dashboard', '/api/'],
      },
    ],
    sitemap: 'https://flightsales.com.au/sitemap.xml',
    host: 'https://flightsales.com.au',
  };
}
