// Smoke: SEO surface.
//
// Asserts that the routes Block B/D shipped actually emit the metadata in the
// HTML response (server-rendered, before JS executes). This is the regression
// test for "we added generateMetadata but it silently broke" — and proves the
// home page is crawlable without JS.

import { test, expect } from '@playwright/test';

test.describe('SEO', () => {
  test('home HTML contains title + canonical + OG tags', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBeLessThan(400);
    const html = await res.text();

    expect(html).toContain('<title>');
    expect(html).toMatch(/FlightSales/);
    expect(html).toMatch(/<link[^>]+rel="canonical"/);
    expect(html).toMatch(/<meta[^>]+property="og:title"/);
  });

  test('robots.txt is served', async ({ request }) => {
    // robots.js currently disallows all crawlers during the pre-launch
    // phase. Test asserts the file is served + identifies user agents;
    // when launch flips robots back to allow, add the Sitemap matcher.
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-Agent/i);
  });

  test('sitemap.xml is served', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/xml/);
  });
});
