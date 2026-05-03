// Tiny RFC4180-ish CSV parser. Handles quoted fields, embedded
// commas/newlines/quotes inside quotes. No external dep — most CSVs
// from Controller / PlaneSales / Excel-as-CSV stay inside what this
// supports. If a file fails this parser, the user can still paste
// the data row-by-row through the manual /sell form.

export function parseCsv(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const out = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; continue; }
      if (c === '"') { inQuotes = false; continue; }
      field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') {
      row.push(field); field = '';
      // Skip blank lines (tail newlines from Excel exports)
      if (row.length > 1 || row[0] !== '') out.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') out.push(row);
  }
  return out;
}

// Heuristic header → field-name mapping. Maps common spreadsheet
// headers that PlaneSales / Controller / Excel exports use to our
// listing schema. Returns { manufacturer: 0, model: 1, … } for the
// columns we recognise; unknown columns get omitted (user can
// remap manually in the preview UI).
export function inferHeaderMap(headerRow) {
  const m = {};
  headerRow.forEach((raw, idx) => {
    const h = String(raw || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (!h) return;
    if (m.manufacturer == null && /^(make|manufacturer|brand)$/.test(h))           m.manufacturer = idx;
    else if (m.model == null && /^(model|variant|aircrafttype)$/.test(h))          m.model = idx;
    else if (m.year == null && /^(year|yom|yearbuilt)$/.test(h))                   m.year = idx;
    else if (m.price == null && /^(price|askingprice|askprice|usdprice|aud)$/.test(h)) m.price = idx;
    else if (m.rego == null && /^(rego|registration|tail|reg|nnumber)$/.test(h))   m.rego = idx;
    else if (m.category == null && /^(category|class|type|aircraftclass)$/.test(h)) m.category = idx;
    else if (m.condition == null && /^(condition|status)$/.test(h))                m.condition = idx;
    else if (m.state == null && /^(state|location|region)$/.test(h))               m.state = idx;
    else if (m.city == null && /^(city|town|airport)$/.test(h))                    m.city = idx;
    else if (m.ttaf == null && /^(ttaf|hours|airframe|tt|airframetime)$/.test(h))  m.ttaf = idx;
    else if (m.eng_hours == null && /^(enghours|engtime|smoh|sinceoverhaul)$/.test(h)) m.eng_hours = idx;
    else if (m.eng_tbo == null && /^(tbo|enginetbo)$/.test(h))                     m.eng_tbo = idx;
    else if (m.engineType == null && /^(engine|enginetype|powerplant|engmodel)$/.test(h)) m.engineType = idx;
    else if (m.avionics == null && /^(avionics|panel|nav)$/.test(h))               m.avionics = idx;
    else if (m.description == null && /^(description|notes|comments|details)$/.test(h)) m.description = idx;
  });
  return m;
}

// Apply the header-map to each data row and produce typed listing-
// shaped objects ready for the preview grid.
export function rowsToListings(headerRow, dataRows) {
  const map = inferHeaderMap(headerRow);
  return dataRows.map((row, i) => {
    const get = (k) => map[k] != null ? String(row[map[k]] ?? '').trim() : '';
    const numeric = (k) => {
      const raw = get(k);
      if (!raw) return null;
      const cleaned = raw.replace(/[^0-9.\-]/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    };
    return {
      _row: i + 2,                            // 1-based + header row
      manufacturer: get('manufacturer') || null,
      model:        get('model')        || null,
      year:         numeric('year'),
      price:        numeric('price'),
      rego:         get('rego')         || null,
      category:     get('category')     || null,
      condition:    get('condition')    || 'Pre-Owned',
      state:        get('state')        || null,
      city:         get('city')         || null,
      ttaf:         numeric('ttaf'),
      eng_hours:    numeric('eng_hours'),
      eng_tbo:      numeric('eng_tbo'),
      engineType:   get('engineType')   || null,
      avionics:     get('avionics')     || null,
      description:  get('description')  || null,
    };
  });
}
