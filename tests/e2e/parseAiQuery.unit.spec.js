// Pure-function tests for the natural-language search parser. Co-located
// under tests/unit/ — same Playwright runner so we don't need a second
// framework for a single file. Playwright Test runs any *.spec.js outside
// `tests/e2e/` happily; we just don't need a browser, so no `page` fixture.

import { test, expect } from '@playwright/test';
import { parseAiQuery } from '../../src/lib/parseAiQuery.js';

test.describe('parseAiQuery', () => {
  test('returns a populated filter object even for empty input', () => {
    const f = parseAiQuery('');
    expect(f.cat).toBe('');
    expect(f.make).toBe('');
    expect(f.state).toBe('');
    expect(f.minPrice).toBe('');
    expect(f.maxPrice).toBe('');
    expect(f.ifrOnly).toBe(false);
  });

  test('detects state aliases', () => {
    expect(parseAiQuery('cessna in melbourne').state).toBe('VIC');
    expect(parseAiQuery('helicopter sydney').state).toBe('NSW');
    expect(parseAiQuery('plane in qld').state).toBe('QLD');
    expect(parseAiQuery('perth WA').state).toBe('WA');
  });

  test('detects manufacturer by brand or model', () => {
    expect(parseAiQuery('cessna 172').make).toBe('Cessna');
    expect(parseAiQuery('SR22').make).toBe('Cirrus');
    expect(parseAiQuery('PA-28').make).toBe('Piper');
    expect(parseAiQuery('robinson r44').make).toBe('Robinson');
  });

  test('detects category from explicit keyword', () => {
    expect(parseAiQuery('helicopter').cat).toBe('Helicopter');
    expect(parseAiQuery('twin engine').cat).toBe('Multi Engine Piston');
    expect(parseAiQuery('turboprop').cat).toBe('Turboprop');
    expect(parseAiQuery('midsize jet').cat).toBe('Midsize Jet');
    expect(parseAiQuery('LSA').cat).toBe('LSA');
  });

  test('infers category from model when no explicit keyword', () => {
    // "Cessna 172" alone → SEP. No explicit category word in the query.
    expect(parseAiQuery('cessna 172').cat).toBe('Single Engine Piston');
    // R44 alone → Helicopter
    expect(parseAiQuery('low hours r44').cat).toBe('Helicopter');
    // PC-12 → Turboprop
    expect(parseAiQuery('pc12 for sale').cat).toBe('Turboprop');
  });

  test('explicit category wins over model inference', () => {
    // R44 is a helicopter, but if user types "helicopter" the explicit
    // path is what we honor. (Both happen to map the same way here, but
    // the test guards against the inference path overriding the explicit
    // one in the future.)
    expect(parseAiQuery('helicopter robinson').cat).toBe('Helicopter');
  });

  test('parses "under $X" price', () => {
    expect(parseAiQuery('under 200k').maxPrice).toBe('200000');
    expect(parseAiQuery('less than $1.5m').maxPrice).toBe('1500000');
    expect(parseAiQuery('up to 500k').maxPrice).toBe('500000');
  });

  test('parses "over $X" price', () => {
    expect(parseAiQuery('over 500k').minPrice).toBe('500000');
    expect(parseAiQuery('more than $2m').minPrice).toBe('2000000');
  });

  test('parses relative price terms', () => {
    expect(parseAiQuery('cheap cessna').maxPrice).toBe('300000');
    expect(parseAiQuery('luxury jet').minPrice).toBe('1000000');
  });

  test('parses hours constraint', () => {
    expect(parseAiQuery('under 500 hours').maxHours).toBe('500');
    expect(parseAiQuery('low hours cirrus').maxHours).toBe('1000');
  });

  test('detects feature flags', () => {
    expect(parseAiQuery('IFR cessna').ifrOnly).toBe(true);
    expect(parseAiQuery('glass panel').glassOnly).toBe(true);
    expect(parseAiQuery('g1000 cirrus').glassOnly).toBe(true);
  });

  test('"new" is detected as condition; "news" is not', () => {
    expect(parseAiQuery('new sling').cond).toBe('New');
    // The "news" false-positive guard — "aviation news" should not match "new".
    expect(parseAiQuery('aviation news').cond).toBe('');
  });

  test('detects pre-owned synonyms', () => {
    expect(parseAiQuery('used cessna').cond).toBe('Pre-Owned');
    expect(parseAiQuery('pre-owned cirrus').cond).toBe('Pre-Owned');
  });

  test('combined query: cheap cessna in vic with low hours and IFR', () => {
    const f = parseAiQuery('cheap cessna in vic with low hours and IFR');
    expect(f.make).toBe('Cessna');
    expect(f.state).toBe('VIC');
    expect(f.maxPrice).toBe('300000');
    expect(f.maxHours).toBe('1000');
    expect(f.ifrOnly).toBe(true);
  });

  test('handles null/undefined defensively', () => {
    expect(parseAiQuery(null).query).toBeNull();
    expect(parseAiQuery(undefined).query).toBeUndefined();
    expect(parseAiQuery(null).state).toBe('');
  });
});
