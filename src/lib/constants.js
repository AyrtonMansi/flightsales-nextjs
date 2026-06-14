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

export const SAMPLE_LISTINGS = [
  { id: 1, title: "2018 Cirrus SR22T GTS", price: 895000, manufacturer: "Cirrus", model: "SR22T GTS", year: 2018, category: "Single Engine Piston", condition: "Pre-Owned", state: "VIC", city: "Moorabbin", ttaf: 420, eng_hours: 420, eng_tbo: 2000, avionics: "Garmin Perspective+", rego: "VH-XRT", useful_load: 454, range_nm: 930, fuel_burn: 68, cruise_kts: 213, ifr: true, retractable: false, pressurised: false, glass_cockpit: true, images: 12, featured: true, dealer: "Southern Aviation Group", dealer_id: 1, created: "2026-03-18", description: "Pristine condition with FIKI, A/C, and full TKS. One owner, always hangared. Complete logbooks. Next annual due Sep 2026.", specs: { engine: "Continental TSIO-550-K", propeller: "Hartzell 3-blade composite", seats: 4, mtow_kg: 1542, wingspan_m: 11.68, parachute: "CAPS equipped" }},
  { id: 2, title: "2005 Cessna 182T Skylane", price: 385000, manufacturer: "Cessna", model: "182T Skylane", year: 2005, category: "Single Engine Piston", condition: "Pre-Owned", state: "NSW", city: "Bankstown", ttaf: 1850, eng_hours: 620, eng_tbo: 2000, avionics: "Garmin G1000", rego: "VH-DMK", useful_load: 419, range_nm: 820, fuel_burn: 52, cruise_kts: 145, ifr: true, retractable: false, pressurised: false, glass_cockpit: true, images: 9, featured: true, dealer: null, dealer_id: null, created: "2026-03-15", description: "Well maintained 182T with G1000 and GFC700 autopilot. Engine overhauled 2022 by Lycoming. Ideal touring aircraft. Fresh annual.", specs: { engine: "Lycoming IO-540-AB1A5", propeller: "McCauley 3-blade", seats: 4, mtow_kg: 1406, wingspan_m: 10.97, parachute: null }},
  { id: 3, title: "2022 Tecnam P2012 Traveller", price: 2450000, manufacturer: "Tecnam", model: "P2012 Traveller", year: 2022, category: "Multi Engine Piston", condition: "Pre-Owned", state: "QLD", city: "Archerfield", ttaf: 280, eng_hours: 280, eng_tbo: 2000, avionics: "Garmin G1000 NXi", rego: "VH-TWN", useful_load: 1134, range_nm: 950, fuel_burn: 120, cruise_kts: 194, ifr: true, retractable: false, pressurised: false, glass_cockpit: true, images: 15, featured: true, dealer: "Queensland Aircraft Sales", dealer_id: 2, created: "2026-03-20", description: "Exceptional 11-seat commuter. Perfect for charter operations. Low time, full de-ice, cargo pod. Revenue-ready.", specs: { engine: "2x Lycoming TEO-540-C1A", propeller: "2x MT 4-blade", seats: 11, mtow_kg: 3680, wingspan_m: 14.24, parachute: null }},
  { id: 4, title: "2015 Diamond DA42-VI Twin Star", price: 620000, manufacturer: "Diamond", model: "DA42-VI", year: 2015, category: "Multi Engine Piston", condition: "Pre-Owned", state: "VIC", city: "Essendon", ttaf: 1100, eng_hours: 1100, eng_tbo: 1800, avionics: "Garmin G1000 NXi", rego: "VH-JET", useful_load: 386, range_nm: 1100, fuel_burn: 42, cruise_kts: 180, ifr: true, retractable: true, pressurised: false, glass_cockpit: true, images: 8, featured: false, dealer: "Southern Aviation Group", dealer_id: 1, created: "2026-03-12", description: "Jet-A burning twin with incredible fuel economy. Garmin GFC700 AP, synthetic vision, ADSB-In/Out. Training or touring.", specs: { engine: "2x Austro AE300", propeller: "2x MT 3-blade", seats: 4, mtow_kg: 1999, wingspan_m: 13.42, parachute: null }},
  { id: 5, title: "2020 Pipistrel Velis Electro", price: 280000, manufacturer: "Pipistrel", model: "Velis Electro", year: 2020, category: "LSA", condition: "Pre-Owned", state: "SA", city: "Parafield", ttaf: 310, eng_hours: 310, eng_tbo: null, avionics: "Garmin G3X Touch", rego: "VH-ELE", useful_load: 172, range_nm: 54, fuel_burn: 0, cruise_kts: 90, ifr: false, retractable: false, pressurised: false, glass_cockpit: true, images: 6, featured: false, dealer: null, dealer_id: null, created: "2026-03-10", description: "World's first type-certified electric aircraft. Zero emissions, minimal operating costs. Perfect for flight training.", specs: { engine: "Pipistrel E-811 Electric", propeller: "3-blade fixed", seats: 2, mtow_kg: 600, wingspan_m: 10.71, parachute: null }},
  { id: 6, title: "2019 Robinson R44 Raven II", price: 575000, manufacturer: "Robinson", model: "R44 Raven II", year: 2019, category: "Helicopter", condition: "Pre-Owned", state: "WA", city: "Jandakot", ttaf: 890, eng_hours: 890, eng_tbo: 2200, avionics: "Garmin GTN 650Xi", rego: "VH-HLR", useful_load: 381, range_nm: 300, fuel_burn: 64, cruise_kts: 110, ifr: false, retractable: false, pressurised: false, glass_cockpit: false, images: 10, featured: true, dealer: "Rotorwest Aviation", dealer_id: 3, created: "2026-03-19", description: "Low-time R44 II with pop-out floats, cargo hook, leather interior. Ideal mustering, charter, or private use. Full 12-year inspection completed 2025.", specs: { engine: "Lycoming IO-540-AE1A5", propeller: "2-blade main rotor", seats: 4, mtow_kg: 1134, wingspan_m: null, parachute: null }},
  { id: 7, title: "2024 Sling TSi", price: 345000, manufacturer: "Sling", model: "TSi", year: 2024, category: "Single Engine Piston", condition: "New", state: "VIC", city: "Tyabb", ttaf: 0, eng_hours: 0, eng_tbo: 2400, avionics: "Garmin G3X Touch dual screen", rego: "VH-NEW", useful_load: 310, range_nm: 1050, fuel_burn: 32, cruise_kts: 155, ifr: true, retractable: false, pressurised: false, glass_cockpit: true, images: 14, featured: true, dealer: "Sling Australia", dealer_id: 4, created: "2026-03-21", description: "Brand new factory-built TSi with Rotax 915iS turbo. Incredible range and efficiency. Full warranty. Delivery available Australia-wide.", specs: { engine: "Rotax 915iS", propeller: "Airmaster AP332", seats: 4, mtow_kg: 1000, wingspan_m: 9.3, parachute: null }},
  { id: 8, title: "1975 Beechcraft Baron 58", price: 295000, manufacturer: "Beechcraft", model: "Baron 58", year: 1975, category: "Multi Engine Piston", condition: "Pre-Owned", state: "QLD", city: "Toowoomba", ttaf: 5200, eng_hours: 820, eng_tbo: 1700, avionics: "Garmin GTN 750Xi + GTN 650Xi", rego: "VH-BRN", useful_load: 780, range_nm: 1050, fuel_burn: 108, cruise_kts: 190, ifr: true, retractable: true, pressurised: false, glass_cockpit: false, images: 11, featured: false, dealer: null, dealer_id: null, created: "2026-03-08", description: "Classic Baron with modern avionics upgrade. Both engines mid-time since factory reman. Known ice, full de-ice boots. A serious travelling machine.", specs: { engine: "2x Continental IO-550-C", propeller: "2x Hartzell 2-blade", seats: 6, mtow_kg: 2449, wingspan_m: 11.53, parachute: null }},
  { id: 9, title: "2021 Jabiru J230-D", price: 165000, manufacturer: "Jabiru", model: "J230-D", year: 2021, category: "LSA", condition: "Pre-Owned", state: "NSW", city: "Cessnock", ttaf: 180, eng_hours: 180, eng_tbo: 2000, avionics: "Dynon SkyView HDX", rego: "VH-JAB", useful_load: 210, range_nm: 700, fuel_burn: 18, cruise_kts: 118, ifr: false, retractable: false, pressurised: false, glass_cockpit: true, images: 7, featured: false, dealer: null, dealer_id: null, created: "2026-03-05", description: "Australian-made, incredibly low operating costs. Dynon dual-screen glass panel. Always hangared, meticulously maintained.", specs: { engine: "Jabiru 3300A", propeller: "Jabiru 2-blade", seats: 2, mtow_kg: 600, wingspan_m: 9.14, parachute: null }},
  { id: 10, title: "2016 Pilatus PC-12 NG", price: 4850000, manufacturer: "Pilatus", model: "PC-12 NG", year: 2016, category: "Turboprop", condition: "Pre-Owned", state: "NSW", city: "Sydney (Kingsford Smith)", ttaf: 2100, eng_hours: 2100, eng_tbo: 5000, avionics: "Honeywell Apex", rego: "VH-PCN", useful_load: 1400, range_nm: 1560, fuel_burn: 250, cruise_kts: 280, ifr: true, retractable: true, pressurised: true, glass_cockpit: true, images: 18, featured: true, dealer: "Executive Aviation Group", dealer_id: 5, created: "2026-03-16", description: "Immaculate PC-12 NG with executive 8-seat interior. Enrolled in JSSI engine program. Fresh paint and interior 2024. The ultimate owner-flown turboprop.", specs: { engine: "Pratt & Whitney PT6A-67P", propeller: "Hartzell 4-blade", seats: 9, mtow_kg: 4740, wingspan_m: 16.28, parachute: null }},
  { id: 11, title: "2023 BRM Aero Bristell Classic", price: 198000, manufacturer: "BRM Aero", model: "Bristell Classic", year: 2023, category: "LSA", condition: "New", state: "VIC", city: "Bacchus Marsh", ttaf: 12, eng_hours: 12, eng_tbo: 2000, avionics: "Garmin G3X Touch", rego: "VH-BSL", useful_load: 228, range_nm: 750, fuel_burn: 19, cruise_kts: 132, ifr: false, retractable: false, pressurised: false, glass_cockpit: true, images: 9, featured: false, dealer: "Australian Light Aircraft", dealer_id: 6, created: "2026-03-14", description: "Brand new Bristell with Rotax 912iS. Stunning low-wing design with incredible performance. Full factory warranty.", specs: { engine: "Rotax 912iS", propeller: "DUC 3-blade ground adjustable", seats: 2, mtow_kg: 600, wingspan_m: 8.13, parachute: null }},
  { id: 12, title: "1990 Mooney M20J 201", price: 175000, manufacturer: "Mooney", model: "M20J 201", year: 1990, category: "Single Engine Piston", condition: "Pre-Owned", state: "TAS", city: "Launceston", ttaf: 3400, eng_hours: 450, eng_tbo: 2000, avionics: "Aspen EFD1000 + Garmin 430W", rego: "VH-MNY", useful_load: 348, range_nm: 900, fuel_burn: 38, cruise_kts: 168, ifr: true, retractable: true, pressurised: false, glass_cockpit: false, images: 8, featured: false, dealer: null, dealer_id: null, created: "2026-03-01", description: "The fastest aircraft per dollar in GA. Fresh engine with 450 SMOH. Speed mods, gap seals. Great cross-country machine for the budget-conscious pilot.", specs: { engine: "Lycoming IO-360-A3B6D", propeller: "Hartzell 2-blade CS", seats: 4, mtow_kg: 1243, wingspan_m: 10.67, parachute: null }},
];

export const DEALERS = [
  { id: 1, name: "Southern Aviation Group", location: "Moorabbin, VIC", listings: 14, rating: 4.8, since: 2015, logo: "SAG", speciality: "Cirrus, Diamond, Mooney" },
  { id: 2, name: "Queensland Aircraft Sales", location: "Archerfield, QLD", listings: 22, rating: 4.9, since: 2008, logo: "QAS", speciality: "Multi-engine, Turboprop" },
  { id: 3, name: "Rotorwest Aviation", location: "Jandakot, WA", listings: 8, rating: 4.7, since: 2012, logo: "RW", speciality: "Robinson, Bell Helicopters" },
  { id: 4, name: "Sling Australia", location: "Tyabb, VIC", listings: 6, rating: 5.0, since: 2019, logo: "SA", speciality: "Sling Aircraft (Authorised Dealer)" },
  { id: 5, name: "Executive Aviation Group", location: "Sydney, NSW", listings: 11, rating: 4.9, since: 2003, logo: "EAG", speciality: "Turboprop, Jet, High-value" },
  { id: 6, name: "Australian Light Aircraft", location: "Bacchus Marsh, VIC", listings: 9, rating: 4.6, since: 2017, logo: "ALA", speciality: "LSA, Ultralight, Recreational" },
];

export const NEWS_ARTICLES = [
  { id: 1, title: "CASA Approves New Electric Aircraft Category for Training Operations", date: "2026-03-20", category: "Regulation", excerpt: "The Civil Aviation Safety Authority has approved a new category of electric aircraft for use in pilot training, opening the door for flight schools to adopt zero-emission trainers.", read_time: 4 },
  { id: 2, title: "Market Report: Australian GA Aircraft Values Rise 12% in Q1 2026", date: "2026-03-18", category: "Market", excerpt: "Strong demand and limited supply continue to drive pre-owned aircraft prices upward across all categories, with single-engine pistons seeing the largest gains.", read_time: 6 },
  { id: 3, title: "Sling Aircraft Delivers 100th Australian-Assembled TSi", date: "2026-03-15", category: "Industry", excerpt: "Sling Australia's Tyabb facility has reached a major milestone with the delivery of its 100th locally assembled TSi, cementing the type's popularity in the Australian market.", read_time: 3 },
  { id: 4, title: "New Bankstown Airport Hangar Complex Opens with 40 Additional Bays", date: "2026-03-12", category: "Infrastructure", excerpt: "A $28M hangar development at Bankstown Airport has been completed, adding 40 new bays to address Sydney's chronic aircraft storage shortage.", read_time: 4 },
];
