// Natural-language search query parser shared by HomePage and BuyPage.
// Extracted from a 1:1 duplicate that lived in both pages — single source of
// truth for "user types 'cheap cessna in vic under 200k' → structured filters".
//
// Intentionally regex-driven, not LLM-backed: no API cost, no latency,
// deterministic, runs offline. The cost is brittleness vs. weird phrasings,
// which is acceptable for a curated keyword set.

const STATE_PATTERNS = [
  [/\b(vic|victoria|melbourne)\b/, 'VIC'],
  [/\b(nsw|new south wales|sydney)\b/, 'NSW'],
  [/\b(qld|queensland|brisbane)\b/, 'QLD'],
  [/\b(wa|western australia|perth)\b/, 'WA'],
  [/\b(sa|south australia|adelaide)\b/, 'SA'],
  [/\b(tas|tasmania|hobart)\b/, 'TAS'],
  [/\b(nt|northern territory|darwin)\b/, 'NT'],
  [/\b(act|canberra)\b/, 'ACT'],
];

const MAKE_PATTERNS = [
  [/\b(cessna|182|172|152|206)\b/, 'Cessna'],
  [/\b(cirrus|sr22|sr20)\b/, 'Cirrus'],
  [/\b(piper|pa-28|pa28|archer|warrior)\b/, 'Piper'],
  [/\b(diamond|da40|da42)\b/, 'Diamond'],
  [/\b(robinson|r44|r22)\b/, 'Robinson'],
  [/\b(sling|tsi)\b/, 'Sling'],
  [/\b(pilatus|pc-12|pc12)\b/, 'Pilatus'],
  [/\b(beech|beechcraft|baron|bonanza)\b/, 'Beechcraft'],
  [/\b(jabiru)\b/, 'Jabiru'],
  [/\b(mooney)\b/, 'Mooney'],
  [/\b(tecnama?)\b/, 'Tecnam'],
  [/\b(bristell)\b/, 'BRM Aero'],
  [/\b(pipistrel)\b/, 'Pipistrel'],
];

// Word matches an explicit category keyword (vs. an inferred one from a model
// name). Used to decide whether to fall back to model-based inference.
const EXPLICIT_CATEGORY = /\b(single.engine|singleengine|single-engine|sep|multi.engine|multiengine|multi-engine|twin.engine|twin-engine|twin|turboprop|light.jet|midsize.jet|heavy.jet|business.jet|jet|helicopter|heli|chopper|rotor|lsa|light.sport|sport.aircraft|ultralight|trainer|glider|sailplane|gyrocopter|gyro|autogyro|drone|drones|quadcopter|uav|evtol|e-vtol|air.taxi|air-taxi)\b/;

const MODEL_TO_CATEGORY = [
  [/\b(172|152|182|206|cherokee|warrior|archer|sr20|sr22|da40|bonanza|mooney|tsi|sling|jabiru|cirrus)\b/, 'Single Engine Piston'],
  [/\b(da42|baron|seneca|310|aztec|seminole|duchess|navajo)\b/, 'Multi Engine Piston'],
  [/\b(pc-12|pc12|king.air|caravan|tbm|meridian|cheyenne|conquest)\b/, 'Turboprop'],
  [/\b(citation|hondajet|phenom|legacy|cj1|cj2|cj3|cj4|m2|mustang)\b/, 'Light Jet'],
  [/\b(r22|r44|r66|bell.206|bell.407|jetranger|longranger|ec120|ec130)\b/, 'Helicopter'],
  [/\b(tecnam|bristell|pipistrel|virus|sport.cruiser)\b/, 'LSA'],
];

function detectCategory(q) {
  if (/\b(helicopter|heli|chopper|rotor)\b/.test(q)) return 'Helicopter';
  if (/\b(single.engine|singleengine|single-engine|sep)\b/.test(q)) return 'Single Engine Piston';
  if (/\b(multi.engine|multiengine|multi-engine|twin.engine|twin-engine|twin)\b/.test(q)) return 'Multi Engine Piston';
  if (/\b(turboprop)\b/.test(q)) return 'Turboprop';
  if (/\b(light.jet|midsize.jet|heavy.jet|business.jet|jet)\b/.test(q)) {
    if (/\bmidsize\b/.test(q)) return 'Midsize Jet';
    if (/\bheavy\b/.test(q)) return 'Heavy Jet';
    return 'Light Jet';
  }
  if (/\b(lsa|light.sport|sport.aircraft|ultralight|trainer)\b/.test(q)) return 'LSA';
  if (/\b(glider|sailplane)\b/.test(q)) return 'Glider';
  if (/\b(gyrocopter|gyro|autogyro)\b/.test(q)) return 'Gyrocopter';
  if (/\b(drone|drones|quadcopter|uav|evtol|e-vtol|air.taxi|air-taxi)\b/.test(q)) return 'Drone & eVTOL';
  // No explicit category keyword — infer from model name. "Cessna 172" → SEP.
  if (!EXPLICIT_CATEGORY.test(q)) {
    for (const [pattern, value] of MODEL_TO_CATEGORY) {
      if (pattern.test(q)) return value;
    }
  }
  return '';
}

function detectPrice(q) {
  const underK = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+)\s*k/i);
  const underM = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);
  const overK = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+)\s*k/i);
  const overM = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);

  let minPrice = '';
  let maxPrice = '';
  if (underK) maxPrice = String(parseInt(underK[1], 10) * 1000);
  else if (underM) maxPrice = String(Math.round(parseFloat(underM[1]) * 1_000_000));
  if (overK) minPrice = String(parseInt(overK[1], 10) * 1000);
  else if (overM) minPrice = String(Math.round(parseFloat(overM[1]) * 1_000_000));

  // Range — only consider if no explicit under/over prefix was matched (those win).
  if (!underK && !underM && !overK && !overM) {
    const range = q.match(/\$?(\d+(?:\.\d+)?)\s*k?\s*(?:to|-|)\s*\$?(\d+(?:\.\d+)?)\s*(k|m)?/i);
    if (range) {
      let min = parseFloat(range[1]);
      let max = parseFloat(range[2]);
      const suffix = (range[3] || '').toLowerCase();
      if (suffix === 'k' || (min < 100 && !suffix)) { min *= 1000; max *= 1000; }
      else if (suffix === 'm' || min > 100) { min *= 1_000_000; max *= 1_000_000; }
      else { min *= 1000; max *= 1000; }
      minPrice = String(Math.round(min));
      maxPrice = String(Math.round(max));
    }
  }

  // Relative — only fill the gap they don't override.
  if (/\b(cheap|budget|affordable|inexpensive)\b/.test(q) && !maxPrice) maxPrice = '300000';
  else if (/\b(expensive|luxury|premium|high.end)\b/.test(q) && !minPrice) minPrice = '1000000';

  return { minPrice, maxPrice };
}

function detectHours(q) {
  const under = q.match(/(?:under|less than|below|max|maximum)\s*(\d+)\s*(?:hours?|hrs?|ttaf)/i);
  if (under) return under[1];
  if (/\b(low hours?|low.time)\b/i.test(q)) return '1000';
  return '';
}

export function parseAiQuery(query) {
  const q = (query || '').toLowerCase().trim();
  const filters = {
    cat: '',
    make: '',
    state: '',
    minPrice: '',
    maxPrice: '',
    maxHours: '',
    ifrOnly: false,
    glassOnly: false,
    cond: '',
    query,
  };

  for (const [pattern, value] of STATE_PATTERNS) {
    if (pattern.test(q)) { filters.state = value; break; }
  }
  for (const [pattern, value] of MAKE_PATTERNS) {
    if (pattern.test(q)) { filters.make = value; break; }
  }
  filters.cat = detectCategory(q);
  Object.assign(filters, detectPrice(q));
  filters.maxHours = detectHours(q);
  if (/\bifr|instrument\b/i.test(q)) filters.ifrOnly = true;
  if (/\bglass|g1000|garmin\b/i.test(q)) filters.glassOnly = true;
  // "new" but not "news" — common false positive.
  if (/\bnew\b/i.test(q) && !/\bnews\b/i.test(q)) filters.cond = 'New';
  if (/\b(pre-owned|used|second.hand)\b/i.test(q)) filters.cond = 'Pre-Owned';

  return filters;
}
