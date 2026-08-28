// Unit: transactional email HTML escaping.
//
// Regression test for an HTML-injection hole. Template bodies escaped their
// interpolated values, but the two shared helpers did not:
//
//   shell({ preheader })  ->  <div ...>${preheader}</div>        (raw)
//   btn(href, label)      ->  <a href="${href}">${label}</a>     (raw)
//
// Several preheaders interpolate user-controlled values (buyer name, aircraft
// title, saved-search name, partner name) and two btn() call sites append
// request-derived data to the href. Unescaped, a value containing a double
// quote breaks out of the href attribute — which plants an attacker-chosen
// link inside a genuinely DKIM-signed FlightSales email. That is a turnkey
// phishing kit, so these assertions guard the helpers, not the call sites.

import { test, expect } from '@playwright/test';
import { renderTemplate } from '../../src/lib/emailTemplates.js';

const XSS = '"><script>alert(1)</script><a href="https://phish.example/';

test.describe('email template escaping', () => {
  test('preheader escapes a user-controlled buyer name', () => {
    const { html } = renderTemplate('enquiry.seller', {
      buyerName: XSS,
      aircraftTitle: 'Cessna 172',
      buyerEmail: 'b@example.com',
      message: 'hi',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('btn() href cannot break out of the attribute', () => {
    const { html } = renderTemplate('enquiry.buyer', {
      buyerName: 'Ada',
      aircraftTitle: 'Cessna 172',
      // Lands in `${SITE}/listings/${v.aircraftId}` inside href="...".
      aircraftId: XSS,
    });
    expect(html).not.toContain('<script>');
    // The injected quote must be neutralised, not close the attribute.
    expect(html).not.toContain('href="https://phish.example/');
    expect(html).toContain('&quot;');
  });

  test('saved-search digest escapes the search name and the query string', () => {
    const { html } = renderTemplate('search.digest', {
      searchName: XSS,
      // Lands in `${SITE}/buy?${v.queryString}` inside href="...".
      queryString: XSS,
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('href="https://phish.example/');
    expect(html).toContain('&lt;script&gt;');
  });

  test('affiliate lead escapes the partner name in the preheader', () => {
    const { html } = renderTemplate('affiliate.lead', {
      partnerName: XSS,
      userName: XSS,
      partnerType: 'finance',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('ordinary copy still renders readably (escaping is not over-applied)', () => {
    const { html, subject } = renderTemplate('enquiry.seller', {
      buyerName: "Sean O'Brien",
      aircraftTitle: 'Cessna 172 & friends',
      buyerEmail: 'sean@example.com',
      message: 'Line one\nLine two',
    });
    // Apostrophes/ampersands are entity-encoded, which renders correctly.
    expect(html).toContain('&#39;');
    expect(html).toContain('&amp;');
    // Subject is plain text, so it keeps the raw characters.
    expect(subject).toContain('Cessna 172 & friends');
    // Message newlines still become <br> after escaping.
    expect(html).toContain('Line one<br>Line two');
  });
});
