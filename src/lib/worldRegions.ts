// Worldwide region / country / sub-division data for the Location
// filter cascade. Mirrors the Make → Model pattern: pick a region to
// expand its countries, pick a country to expand its sub-divisions
// (states / provinces) where applicable.
//
// Country codes are ISO 3166-1 alpha-2; sub-divisions use the local
// abbreviation that matches what listings already store (AU uses
// state codes, US uses 2-letter state codes, CA uses 2-letter
// provinces). Countries without a sub-division list match the
// country alone — listings can still store free-text city.

export interface CountrySubdivision {
  code: string;   // canonical sub-division code stored on listings
  name: string;   // user-facing label
}

export interface Country {
  code: string;       // ISO 3166-1 alpha-2 (e.g. 'AU', 'US')
  name: string;       // 'Australia', 'United States'
  subdivisions?: CountrySubdivision[];
}

export interface Region {
  key: string;        // url-safe slug
  name: string;       // user-facing label
  countries: Country[];
}

// ── Sub-divisions ───────────────────────────────────────────────────

const AU_STATES: CountrySubdivision[] = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA',  name: 'Western Australia' },
  { code: 'SA',  name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT',  name: 'Northern Territory' },
];

const US_STATES: CountrySubdivision[] = [
  { code: 'AL', name: 'Alabama' },        { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },        { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },     { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },    { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },        { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },         { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },       { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },           { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },       { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },          { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },      { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },       { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },       { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },     { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },           { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },         { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },   { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },   { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },          { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },        { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },     { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },      { code: 'WY', name: 'Wyoming' },
];

const CA_PROVINCES: CountrySubdivision[] = [
  { code: 'AB', name: 'Alberta' },         { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },        { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland & Labrador' },
  { code: 'NS', name: 'Nova Scotia' },     { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' }, { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },    { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },         { code: 'YT', name: 'Yukon' },
];

const NZ_REGIONS: CountrySubdivision[] = [
  { code: 'AUK', name: 'Auckland' },       { code: 'WGN', name: 'Wellington' },
  { code: 'CAN', name: 'Canterbury' },     { code: 'WKO', name: 'Waikato' },
  { code: 'BOP', name: 'Bay of Plenty' },  { code: 'OTA', name: 'Otago' },
  { code: 'STL', name: 'Southland' },      { code: 'TAS', name: 'Tasman' },
  { code: 'HKB', name: 'Hawke’s Bay' }, { code: 'MWT', name: 'Manawatu-Whanganui' },
  { code: 'NTL', name: 'Northland' },      { code: 'TKI', name: 'Taranaki' },
  { code: 'GIS', name: 'Gisborne' },       { code: 'MBH', name: 'Marlborough' },
  { code: 'NSN', name: 'Nelson' },         { code: 'WTC', name: 'West Coast' },
];

// ── Regions ─────────────────────────────────────────────────────────
// Ordered so the most common aviation markets sit first within each
// region. The cascade defaults to showing top 3 REGIONS; the region
// matching the user's geo-IP is floated to the top automatically.

export const WORLD_REGIONS: Region[] = [
  {
    key: 'oceania',
    name: 'Oceania',
    countries: [
      { code: 'AU', name: 'Australia',          subdivisions: AU_STATES },
      { code: 'NZ', name: 'New Zealand',        subdivisions: NZ_REGIONS },
      { code: 'PG', name: 'Papua New Guinea' },
      { code: 'FJ', name: 'Fiji' },
    ],
  },
  {
    key: 'north-america',
    name: 'North America',
    countries: [
      { code: 'US', name: 'United States',      subdivisions: US_STATES },
      { code: 'CA', name: 'Canada',             subdivisions: CA_PROVINCES },
      { code: 'MX', name: 'Mexico' },
    ],
  },
  {
    key: 'europe',
    name: 'Europe',
    countries: [
      { code: 'GB', name: 'United Kingdom' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'IT', name: 'Italy' },
      { code: 'ES', name: 'Spain' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'AT', name: 'Austria' },
      { code: 'BE', name: 'Belgium' },
      { code: 'IE', name: 'Ireland' },
      { code: 'PT', name: 'Portugal' },
      { code: 'SE', name: 'Sweden' },
      { code: 'NO', name: 'Norway' },
      { code: 'FI', name: 'Finland' },
      { code: 'DK', name: 'Denmark' },
      { code: 'PL', name: 'Poland' },
      { code: 'CZ', name: 'Czechia' },
    ],
  },
  {
    key: 'asia',
    name: 'Asia',
    countries: [
      { code: 'SG', name: 'Singapore' },
      { code: 'JP', name: 'Japan' },
      { code: 'HK', name: 'Hong Kong' },
      { code: 'CN', name: 'China' },
      { code: 'KR', name: 'South Korea' },
      { code: 'IN', name: 'India' },
      { code: 'TH', name: 'Thailand' },
      { code: 'MY', name: 'Malaysia' },
      { code: 'ID', name: 'Indonesia' },
      { code: 'PH', name: 'Philippines' },
      { code: 'TW', name: 'Taiwan' },
      { code: 'VN', name: 'Vietnam' },
    ],
  },
  {
    key: 'middle-east',
    name: 'Middle East',
    countries: [
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'SA', name: 'Saudi Arabia' },
      { code: 'IL', name: 'Israel' },
      { code: 'QA', name: 'Qatar' },
      { code: 'KW', name: 'Kuwait' },
      { code: 'BH', name: 'Bahrain' },
      { code: 'OM', name: 'Oman' },
      { code: 'JO', name: 'Jordan' },
      { code: 'TR', name: 'Turkey' },
    ],
  },
  {
    key: 'africa',
    name: 'Africa',
    countries: [
      { code: 'ZA', name: 'South Africa' },
      { code: 'KE', name: 'Kenya' },
      { code: 'EG', name: 'Egypt' },
      { code: 'MA', name: 'Morocco' },
      { code: 'NG', name: 'Nigeria' },
      { code: 'TZ', name: 'Tanzania' },
      { code: 'MU', name: 'Mauritius' },
      { code: 'NA', name: 'Namibia' },
      { code: 'BW', name: 'Botswana' },
      { code: 'ZW', name: 'Zimbabwe' },
    ],
  },
  {
    key: 'south-america',
    name: 'South America',
    countries: [
      { code: 'BR', name: 'Brazil' },
      { code: 'AR', name: 'Argentina' },
      { code: 'CL', name: 'Chile' },
      { code: 'CO', name: 'Colombia' },
      { code: 'PE', name: 'Peru' },
      { code: 'UY', name: 'Uruguay' },
      { code: 'VE', name: 'Venezuela' },
      { code: 'EC', name: 'Ecuador' },
    ],
  },
];

// ── Lookups ─────────────────────────────────────────────────────────

const COUNTRY_TO_REGION: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const r of WORLD_REGIONS) {
    for (const c of r.countries) map[c.code] = r.key;
  }
  return map;
})();

export function regionKeyForCountry(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  return COUNTRY_TO_REGION[countryCode.toUpperCase()] || null;
}

// Order regions so the user's home region is first. Falls back to the
// natural WORLD_REGIONS order when no match is found (anon / unknown
// IP). Pure, deterministic; reorder happens in render-state, not in
// the source data.
export function orderRegionsForUser(userRegionKey: string | null | undefined): Region[] {
  if (!userRegionKey) return WORLD_REGIONS;
  const home = WORLD_REGIONS.find((r) => r.key === userRegionKey);
  if (!home) return WORLD_REGIONS;
  return [home, ...WORLD_REGIONS.filter((r) => r.key !== userRegionKey)];
}
