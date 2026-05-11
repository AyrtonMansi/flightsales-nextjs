// Reference data for filter dropdowns + sample/seed data fallback.
// Kept in one place so pages and components can share without
// introducing circular imports back into FlightSalesApp.

export const MANUFACTURERS = ["Airbus", "American Champion", "Aquila", "AutoGyro", "Aviat", "Beechcraft", "Bell", "BRM Aero", "Cessna", "Cirrus", "CubCrafters", "DAHER", "Diamond", "Dynali", "Flight Design", "Grumman", "GippsAero", "Guimbal", "HondaJet", "Icon", "Jabiru", "Lancair", "Lockheed", "Magni", "Maule", "Mooney", "Pipistrel", "Piper", "Pilatus", "Quest", "Robinson", "Rockwell", "Rotorway", "Schweizer", "Sling", "Socata", "Stemme", "Tecnam", "Vans", "Vulcanair", "XtremeAir"];

// "Drone & eVTOL" is the umbrella for unmanned drones, manned drones,
// air-taxi vehicles (Joby, Lilium, Wisk), and the eVTOL category that's
// growing rapidly in AU. Keeping it as a single category for now —
// can split into "Drone" + "eVTOL / Air Taxi" later when listing
// volume justifies the granularity.
export const CATEGORIES = ["Single Engine Piston", "Multi Engine Piston", "Turboprop", "Light Jet", "Midsize Jet", "Heavy Jet", "Helicopter", "Gyrocopter", "Ultralight", "LSA", "Warbird", "Glider", "Amphibious/Seaplane", "Drone & eVTOL"];

export const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

export const CONDITIONS = ["New", "Pre-Owned", "Project/Restoration"];

export const PRICE_RANGES = [
  { label: "Under $100k", min: 0, max: 100000 },
  { label: "$100k - $200k", min: 100000, max: 200000 },
  { label: "$200k - $500k", min: 200000, max: 500000 },
  { label: "$500k - $1M", min: 500000, max: 1000000 },
  { label: "$1M - $3M", min: 1000000, max: 3000000 },
  { label: "$3M+", min: 3000000, max: null }
];

export const YEAR_RANGES = [
  { label: "2020+", min: 2020 },
  { label: "2015-2019", min: 2015, max: 2019 },
  { label: "2010-2014", min: 2010, max: 2014 },
  { label: "2000-2009", min: 2000, max: 2009 },
  { label: "1990-1999", min: 1990, max: 1999 },
  { label: "1980-1989", min: 1980, max: 1989 },
  { label: "Pre-1980", max: 1979 }
];

export const TTAF_RANGES = [
  { label: "Under 500 hrs", max: 500 },
  { label: "500-1000 hrs", min: 500, max: 1000 },
  { label: "1000-2000 hrs", min: 1000, max: 2000 },
  { label: "2000-5000 hrs", min: 2000, max: 5000 },
  { label: "5000+ hrs", min: 5000 }
];

export const SEAT_COUNTS = [1, 2, 4, 5, 6, 8, 9, 10, 11, 12];

export const ENGINE_TYPES = ["Piston", "Turboprop", "Jet", "Electric", "Rotary"];

export const AVIONICS_TYPES = ["Garmin G1000/G3000", "Garmin GTN Series", "Garmin G3X", "Honeywell", "Rockwell Collins", "Aspen EFD", "Dynon SkyView", "Traditional Steam Gauge", "Partial Panel"];

// Placeholder seed arrays (SAMPLE_LISTINGS, DEALERS, NEWS_ARTICLES) used
// to live here. They were displayed on production whenever the live DB
// returned zero rows — fine during dev, deceiving once the site went
// public. Removed pre-launch. Surfaces now render real empty states
// from the actual DB query.
//
// If you need fixture data for tests or local dev, add it under a
// non-imported file (e.g. tests/fixtures/) so it can't accidentally
// leak into production again.

export const SAMPLE_LISTINGS = [];
export const DEALERS = [];
export const NEWS_ARTICLES = [];
