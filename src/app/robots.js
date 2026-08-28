// Crawl rules. /admin, /auth, /dashboard and /api have no SEO value and
// either expose personalised content or are programmatic endpoints — so
// they're excluded explicitly to keep Google from wasting crawl budget
// or indexing dashboards.
//
// While the pre-launch password wall is up we disallow everything: there
// is nothing behind the gate a crawler can reach, so the only thing that
// could get indexed is the gate itself. This flips automatically when the
// gate comes down (see src/lib/siteGate.js) — one env var, no second step
// to forget on launch day.

import { isSiteGated } from '@/lib/siteGate';

const SITE = 'https://flightsales.com.au';

export default function robots() {
  if (isSiteGated()) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      host: SITE,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/auth/', '/dashboard', '/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
