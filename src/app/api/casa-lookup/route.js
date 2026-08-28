import { supabase } from '@/lib/supabase';
import { rateLimit, callerIp } from '@/lib/ratelimit';
import { adminClient } from '@/lib/requireAdmin';

// CASA Aircraft Register scraper with caching
export async function GET(request) {
  const ip = callerIp(request);

  // Upstash-backed in prod (consistent across serverless instances),
  // in-memory fallback in dev — same shared limiter every other route uses.
  const rl = await rateLimit(`casa-lookup:${ip}`, { limit: 10, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return Response.json(
      { error: 'Rate limit exceeded. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const rego = searchParams.get('rego')?.toUpperCase().trim();

  // Validate rego format (VH-XXX)
  if (!rego || !/^VH-[A-Z]{3}$/.test(rego)) {
    return Response.json(
      { error: 'Invalid registration format. Use VH-ABC format.' },
      { status: 400 }
    );
  }

  try {
    // Check cache first (24 hour TTL) — works regardless of whether the
    // live scraper is available, so previously-looked-up regos still
    // auto-fill on serverless deploys.
    const { data: cached } = await supabase
      .from('casa_cache')
      .select('*')
      .eq('rego', rego)
      .gt('cached_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (cached) {
      // Success response — cache at the edge for 24h, SWR for a week.
      // The DB cache hits already, so the edge cache means a recurring
      // visitor with the same rego skips both Supabase AND the slow
      // Playwright scrape entirely.
      return Response.json(
        {
          ...cached.data,
          _source: 'cache',
          _cached_at: cached.cached_at,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        },
      );
    }

    // Live scrape uses headless Chromium, which doesn't ship on Vercel
    // serverless. We still try it — works locally and on long-running
    // hosts — but if it can't launch a browser, return 503 with a
    // machine-readable available:false flag so the SellPage can fall
    // back to manual entry without showing a scary "lookup failed"
    // error to the user.
    let data;
    try {
      data = await scrapeCASA(rego);
    } catch (scrapeErr) {
      const msg = String(scrapeErr?.message || '');
      const isUnavailable =
        msg.includes("Executable doesn't exist") ||
        msg.includes('chromium') ||
        msg.includes('chrome-headless-shell') ||
        msg.includes('ENOENT');
      if (isUnavailable) {
        return Response.json(
          {
            error: 'Rego lookup is temporarily unavailable. Please enter aircraft details manually below.',
            available: false,
          },
          { status: 503 }
        );
      }
      throw scrapeErr;
    }

    if (!data) {
      return Response.json(
        { error: 'Aircraft not found in CASA register' },
        { status: 404 }
      );
    }

    // Cache the result. Written with the service-role client so the
    // casa_cache INSERT policy can be locked down to service_role only.
    // It previously granted INSERT to any `authenticated` user (despite
    // being named "Service role can insert"), which let any signed-up
    // user pre-poison the cache for a rego someone else was about to
    // list — the /sell form auto-fills make/model/MTOW straight from
    // whatever is cached here. Cache writes are best-effort: a failure
    // must not break the lookup we just performed for the user.
    try {
      const writer = adminClient();
      if (writer) {
        await writer.from('casa_cache').insert({
          rego,
          data,
          cached_at: new Date().toISOString(),
        });
      }
    } catch { /* cache write is non-critical */ }

    return Response.json(
      {
        ...data,
        _source: 'casa',
        _cached_at: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      },
    );

  } catch (error) {
    console.error('CASA lookup error:', error);
    return Response.json(
      { error: 'Failed to lookup aircraft. Please try again or enter manually.' },
      { status: 500 }
    );
  }
}

async function scrapeCASA(rego) {
  // Dynamic import playwright (server-side only)
  const { chromium } = await import('playwright-core');
  
  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set timeout
    page.setDefaultTimeout(15000);
    
    // Navigate to CASA Aircraft Register
    await page.goto(`https://www.casa.gov.au/search-center/aircraft-register`, {
      waitUntil: 'networkidle'
    });
    
    // Look for search input and enter rego
    // Note: CASA may have different selectors - adjust as needed
    const searchInput = await page.$('input[name="search"]') || 
                       await page.$('input[placeholder*="search" i]') ||
                       await page.$('input[type="search"]');
    
    if (searchInput) {
      await searchInput.fill(rego);
      await searchInput.press('Enter');
      await page.waitForTimeout(3000); // Wait for results
    }
    
    // Try to find aircraft details page link
    const resultLink = await page.$(`a[href*="${rego}" i]`) ||
                      await page.$(`text=${rego}`);
    
    if (resultLink) {
      await resultLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Extract aircraft data
    const aircraftData = await page.evaluate(() => {
      const getText = (selectors) => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return el.textContent?.trim() || null;
        }
        return null;
      };
      
      return {
        manufacturer: getText([
          '[data-field="manufacturer"]',
          '.field-manufacturer .field-value',
          'td:contains("Manufacturer") + td',
          '.aircraft-manufacturer'
        ]),
        model: getText([
          '[data-field="model"]',
          '.field-model .field-value', 
          'td:contains("Model") + td',
          '.aircraft-model'
        ]),
        year: getText([
          '[data-field="year"]',
          '.field-year .field-value',
          'td:contains("Year") + td',
          '.manufacture-year'
        ]),
        serialNumber: getText([
          '[data-field="serial"]',
          '.field-serial .field-value',
          'td:contains("Serial") + td',
          '.serial-number'
        ]),
        engineType: getText([
          '[data-field="engine"]',
          '.field-engine .field-value',
          'td:contains("Engine") + td',
          '.engine-type'
        ]),
        mtow: getText([
          '[data-field="mtow"]',
          '.field-mtow .field-value',
          'td:contains("MTOW") + td',
          '.max-takeoff-weight'
        ]),
        category: getText([
          '[data-field="category"]',
          '.field-category .field-value',
          'td:contains("Category") + td',
          '.aircraft-category'
        ]),
        registration: getText([
          '[data-field="registration"]',
          '.field-registration .field-value',
          'h1',
          '.registration-mark'
        ]),
        // Additional fields
        propeller: getText([
          '[data-field="propeller"]',
          '.field-propeller .field-value'
        ]),
        seats: getText([
          '[data-field="seats"]',
          '.field-seats .field-value',
          'td:contains("Seats") + td'
        ]),
        // Parse useful load if available
        usefulLoad: getText([
          '[data-field="useful_load"]',
          '.field-useful-load .field-value'
        ])
      };
    });
    
    // Clean up the data
    return cleanAircraftData(aircraftData);
    
  } finally {
    await browser.close();
  }
}

function cleanAircraftData(raw) {
  const cleaned = {};
  
  // Manufacturer mapping
  if (raw.manufacturer) {
    const manuMap = {
      'CESSNA': 'Cessna',
      'CIRRUS': 'Cirrus',
      'PIPER': 'Piper',
      'DIAMOND': 'Diamond',
      'MOONEY': 'Mooney',
      'BEECHCRAFT': 'Beechcraft',
      'ROBINSON': 'Robinson',
      'BELL': 'Bell',
      'TECNAM': 'Tecnam',
      'PILATUS': 'Pilatus'
    };
    cleaned.manufacturer = manuMap[raw.manufacturer.toUpperCase()] || raw.manufacturer;
  }
  
  // Model
  if (raw.model) {
    cleaned.model = raw.model;
  }
  
  // Year - extract number
  if (raw.year) {
    const yearMatch = raw.year.match(/\d{4}/);
    if (yearMatch) cleaned.year = parseInt(yearMatch[0]);
  }
  
  // Serial number
  if (raw.serialNumber) {
    cleaned.serialNumber = raw.serialNumber;
  }
  
  // Engine type
  if (raw.engineType) {
    cleaned.engineType = raw.engineType;
    // Try to extract engine model
    const engineMatch = raw.engineType.match(/(IO-540|TSIO-550|O-360|IO-360|PT6A|Lycoming|Continental)/i);
    if (engineMatch) cleaned.engineModel = engineMatch[0];
  }
  
  // MTOW - extract number
  if (raw.mtow) {
    const mtowMatch = raw.mtow.match(/([\d,]+)/);
    if (mtowMatch) cleaned.mtow_kg = parseInt(mtowMatch[1].replace(/,/g, ''));
  }
  
  // Category mapping
  if (raw.category) {
    const catMap = {
      'SINGLE ENGINE': 'Single Engine Piston',
      'MULTI ENGINE': 'Multi Engine Piston',
      'HELICOPTER': 'Helicopter',
      'TURBOPROP': 'Turboprop',
      'LIGHT SPORT': 'LSA',
      'GLIDER': 'Glider'
    };
    cleaned.category = catMap[raw.category.toUpperCase()] || raw.category;
  }
  
  // Seats
  if (raw.seats) {
    const seatsMatch = raw.seats.match(/\d+/);
    if (seatsMatch) cleaned.seats = parseInt(seatsMatch[0]);
  }
  
  // Registration
  cleaned.registration = raw.registration;
  
  // Return null if no useful data found
  if (Object.keys(cleaned).length === 0 || !cleaned.manufacturer) {
    return null;
  }
  
  return cleaned;
}

