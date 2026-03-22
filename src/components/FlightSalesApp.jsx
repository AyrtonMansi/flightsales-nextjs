import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ============================================================
// FLIGHTSALES.COM.AU — PRODUCTION AVIATION MARKETPLACE
// ============================================================

// --- DATA LAYER ---
const MANUFACTURERS = ["Airbus", "American Champion", "Aquila", "AutoGyro", "Aviat", "Beechcraft", "Bell", "BRM Aero", "Cessna", "Cirrus", "CubCrafters", "DAHER", "Diamond", "Dynali", "Flight Design", "Grumman", "GippsAero", "Guimbal", "HondaJet", "Icon", "Jabiru", "Lancair", "Lockheed", "Magni", "Maule", "Mooney", "Pipistrel", "Piper", "Pilatus", "Quest", "Robinson", "Rockwell", "Rotorway", "Schweizer", "Sling", "Socata", "Stemme", "Tecnam", "Vans", "Vulcanair", "XtremeAir"];

const CATEGORIES = ["Single Engine Piston", "Multi Engine Piston", "Turboprop", "Light Jet", "Midsize Jet", "Heavy Jet", "Helicopter", "Gyrocopter", "Ultralight", "LSA", "Warbird", "Glider", "Amphibious/Seaplane"];

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

const CONDITIONS = ["New", "Pre-Owned", "Project/Restoration"];

const PRICE_RANGES = [
  { label: "Under $100k", min: 0, max: 100000 },
  { label: "$100k - $200k", min: 100000, max: 200000 },
  { label: "$200k - $500k", min: 200000, max: 500000 },
  { label: "$500k - $1M", min: 500000, max: 1000000 },
  { label: "$1M - $3M", min: 1000000, max: 3000000 },
  { label: "$3M+", min: 3000000, max: null }
];

const YEAR_RANGES = [
  { label: "2020+", min: 2020 },
  { label: "2015-2019", min: 2015, max: 2019 },
  { label: "2010-2014", min: 2010, max: 2014 },
  { label: "2000-2009", min: 2000, max: 2009 },
  { label: "1990-1999", min: 1990, max: 1999 },
  { label: "1980-1989", min: 1980, max: 1989 },
  { label: "Pre-1980", max: 1979 }
];

const TTAF_RANGES = [
  { label: "Under 500 hrs", max: 500 },
  { label: "500-1000 hrs", min: 500, max: 1000 },
  { label: "1000-2000 hrs", min: 1000, max: 2000 },
  { label: "2000-5000 hrs", min: 2000, max: 5000 },
  { label: "5000+ hrs", min: 5000 }
];

const SEAT_COUNTS = [1, 2, 4, 5, 6, 8, 9, 10, 11, 12];

const ENGINE_TYPES = ["Piston", "Turboprop", "Jet", "Electric", "Rotary"];

const AVIONICS_TYPES = ["Garmin G1000/G3000", "Garmin GTN Series", "Garmin G3X", "Honeywell", "Rockwell Collins", "Aspen EFD", "Dynon SkyView", "Traditional Steam Gauge", "Partial Panel"];

const SAMPLE_LISTINGS = [
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

const DEALERS = [
  { id: 1, name: "Southern Aviation Group", location: "Moorabbin, VIC", listings: 14, rating: 4.8, since: 2015, logo: "SAG", speciality: "Cirrus, Diamond, Mooney" },
  { id: 2, name: "Queensland Aircraft Sales", location: "Archerfield, QLD", listings: 22, rating: 4.9, since: 2008, logo: "QAS", speciality: "Multi-engine, Turboprop" },
  { id: 3, name: "Rotorwest Aviation", location: "Jandakot, WA", listings: 8, rating: 4.7, since: 2012, logo: "RW", speciality: "Robinson, Bell Helicopters" },
  { id: 4, name: "Sling Australia", location: "Tyabb, VIC", listings: 6, rating: 5.0, since: 2019, logo: "SA", speciality: "Sling Aircraft (Authorised Dealer)" },
  { id: 5, name: "Executive Aviation Group", location: "Sydney, NSW", listings: 11, rating: 4.9, since: 2003, logo: "EAG", speciality: "Turboprop, Jet, High-value" },
  { id: 6, name: "Australian Light Aircraft", location: "Bacchus Marsh, VIC", listings: 9, rating: 4.6, since: 2017, logo: "ALA", speciality: "LSA, Ultralight, Recreational" },
];

const NEWS_ARTICLES = [
  { id: 1, title: "CASA Approves New Electric Aircraft Category for Training Operations", date: "2026-03-20", category: "Regulation", excerpt: "The Civil Aviation Safety Authority has approved a new category of electric aircraft for use in pilot training, opening the door for flight schools to adopt zero-emission trainers.", read_time: 4 },
  { id: 2, title: "Market Report: Australian GA Aircraft Values Rise 12% in Q1 2026", date: "2026-03-18", category: "Market", excerpt: "Strong demand and limited supply continue to drive pre-owned aircraft prices upward across all categories, with single-engine pistons seeing the largest gains.", read_time: 6 },
  { id: 3, title: "Sling Aircraft Delivers 100th Australian-Assembled TSi", date: "2026-03-15", category: "Industry", excerpt: "Sling Australia's Tyabb facility has reached a major milestone with the delivery of its 100th locally assembled TSi, cementing the type's popularity in the Australian market.", read_time: 3 },
  { id: 4, title: "New Bankstown Airport Hangar Complex Opens with 40 Additional Bays", date: "2026-03-12", category: "Infrastructure", excerpt: "A $28M hangar development at Bankstown Airport has been completed, adding 40 new bays to address Sydney's chronic aircraft storage shortage.", read_time: 4 },
];

// --- UTILITY FUNCTIONS ---
const formatPrice = (p) => p >= 1000000 ? `$${(p/1000000).toFixed(1)}M` : `$${(p/1000).toFixed(0)}K`;
const formatPriceFull = (p) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(p);
const formatHours = (h) => h ? h.toLocaleString() + " hrs" : "N/A";
const timeAgo = (d) => {
  const days = Math.floor((new Date('2026-03-22') - new Date(d)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days/7)} weeks ago`;
  return `${Math.floor(days/30)} months ago`;
};

// --- SVG ICONS ---
const Icons = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  plane: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.6 3.3-3.5 3.5-2.3-.8c-.4-.1-.8 0-1.1.3l-.1.1c-.3.3-.3.7-.1 1.1l1.8 2.7 2.7 1.8c.3.2.8.2 1.1-.1l.1-.1c.3-.3.4-.7.3-1.1l-.8-2.3 3.5-3.5 3.3 5.6c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1Z"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  location: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  heart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  heartFull: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  chevronDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  chevronRight: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevronLeft: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  x: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  gauge: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  camera: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  calculator: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/></svg>,
  trending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  filter: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  arrowRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  list: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

// --- UNSPLASH AIRCRAFT IMAGES ---
const AIRCRAFT_IMAGES = {
  1: "https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80",   // Cirrus SR22 - small plane
  2: "https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800&q=80",   // Cessna - single engine
  3: "https://images.unsplash.com/photo-1559087867-ce4c91325525?w=800&q=80",      // Twin engine
  4: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80",   // Diamond Twin Star
  5: "https://images.unsplash.com/photo-1508614589041-895b8c9d7ef5?w=800&q=80",   // Electric/LSA
  6: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",   // Helicopter
  7: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",    // Sling/LSA
  8: "https://images.unsplash.com/photo-1529311046623-f34e1fe4a0bb?w=800&q=80",    // Baron - twin
  9: "https://images.unsplash.com/photo-1521727857535-28d2047314ac?w=800&q=80",   // Jabiru/LSA
  10: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",     // Pilatus/executive
  11: "https://images.unsplash.com/photo-1524592714635-d77511a4834d?w=800&q=80",   // Bristell/LSA
  12: "https://images.unsplash.com/photo-1483304528321-0674f0040030?w=800&q=80",   // Mooney
};

// --- AIRCRAFT IMAGE COMPONENT (Unsplash) ---
const AircraftImage = ({ listing, className = "", size = "md", style = {} }) => {
  const heights = { sm: "140px", md: "220px", lg: "400px", full: "100%" };
  const imageUrl = AIRCRAFT_IMAGES[listing.id] || AIRCRAFT_IMAGES[1];
  
  return (
    <div className={className} style={{
      height: heights[size],
      position: "relative",
      overflow: "hidden",
      borderRadius: style.borderRadius || 0,
      background: '#1a1a1a',
      ...style
    }}>
      <img 
        src={imageUrl} 
        alt={listing.title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.3s ease"
        }}
        onError={(e) => {
          // Fallback to black placeholder if image fails
          e.target.style.display = 'none';
          e.target.parentElement.style.background = '#000';
        }}
      />
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)",
        pointerEvents: "none"
      }} />
      {listing.featured && (
        <div style={{
          position: "absolute", top: size === "sm" ? "8px" : "12px", left: size === "sm" ? "8px" : "12px",
          background: "#000", color: "#fff", fontSize: "10px", fontWeight: 800,
          padding: "4px 10px", borderRadius: "4px", letterSpacing: "0.5px", textTransform: "uppercase"
        }}>Featured</div>
      )}
      <div style={{
        position: "absolute", bottom: size === "sm" ? "8px" : "12px", right: size === "sm" ? "8px" : "12px",
        background: "rgba(0,0,0,0.7)", color: "white", fontSize: "11px",
        padding: "4px 8px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px",
        backdropFilter: "blur(4px)"
      }}>
        {Icons.camera} {listing.images}
      </div>
    </div>
  );
};

// --- CSS ---
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

:root {
  --fs-navy: #000000;
  --fs-navy-light: #0a0a0a;
  --fs-blue: #2563eb;
  --fs-blue-light: #3b82f6;
  --fs-sky: #60a5fa;
  --fs-amber: #f59e0b;
  --fs-green: #10b981;
  --fs-red: #ef4444;
  --fs-bg: #fafafa;
  --fs-white: #ffffff;
  --fs-gray-50: #fafafa;
  --fs-gray-100: #f5f5f5;
  --fs-gray-200: #e5e5e5;
  --fs-gray-300: #d4d4d4;
  --fs-gray-400: #a3a3a3;
  --fs-gray-500: #737373;
  --fs-gray-600: #525252;
  --fs-gray-700: #404040;
  --fs-gray-800: #262626;
  --fs-gray-900: #0a0a0a;
  --fs-radius: 12px;
  --fs-radius-sm: 8px;
  --fs-radius-lg: 16px;
  --fs-shadow: 0 1px 2px rgba(0,0,0,0.04);
  --fs-shadow-md: 0 4px 16px rgba(0,0,0,0.06);
  --fs-shadow-lg: 0 8px 30px rgba(0,0,0,0.08);
  --fs-font: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --fs-font-serif: 'Plus Jakarta Sans', system-ui, sans-serif;
  --fs-max-w: 1280px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body, #root {
  font-family: var(--fs-font);
  color: var(--fs-gray-900);
  background: var(--fs-bg);
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
}

a { color: inherit; text-decoration: none; }

.fs-container { max-width: var(--fs-max-w); margin: 0 auto; padding: 0 24px; }
@media (max-width: 640px) { .fs-container { padding: 0 16px; } }

/* NAV */
.fs-nav {
  background: var(--fs-white);
  position: sticky; top: 0; z-index: 100;
  border-bottom: 1px solid var(--fs-gray-100);
}
.fs-nav-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 64px; gap: 32px;
}
.fs-nav-logo {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; flex-shrink: 0;
}
.fs-nav-logo-text {
  font-family: var(--fs-font);
  font-size: 20px; color: var(--fs-gray-900); letter-spacing: -0.03em; font-weight: 800;
}
.fs-nav-logo-text span { color: var(--fs-gray-400); }
.fs-nav-links { display: flex; gap: 4px; align-items: center; }
.fs-nav-link {
  color: var(--fs-gray-500); font-size: 14px; font-weight: 500;
  padding: 8px 14px; border-radius: var(--fs-radius-sm);
  cursor: pointer; transition: all 0.15s; border: none; background: none;
  white-space: nowrap;
}
.fs-nav-link:hover { color: var(--fs-gray-900); background: var(--fs-gray-100); }
.fs-nav-link.active { color: var(--fs-blue); font-weight: 600; }
.fs-nav-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.fs-nav-btn {
  padding: 8px 18px; border-radius: var(--fs-radius-sm);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; border: none; font-family: var(--fs-font);
}
.fs-nav-btn-ghost { background: transparent; color: var(--fs-gray-500); }
.fs-nav-btn-ghost:hover { color: var(--fs-gray-900); background: var(--fs-gray-100); }
.fs-nav-btn-primary { background: var(--fs-blue); color: white; }
.fs-nav-btn-primary:hover { background: var(--fs-blue-light); }
.fs-nav-mobile-toggle {
  display: none; background: none; border: none; color: var(--fs-gray-900); cursor: pointer;
}
@media (max-width: 900px) {
  .fs-nav-links, .fs-nav-actions { display: none; }
  .fs-nav-mobile-toggle { display: flex; }
  .fs-nav-links.open, .fs-nav-actions.open {
    display: flex; flex-direction: column;
    position: absolute; top: 64px; left: 0; right: 0;
    background: var(--fs-white); padding: 16px 24px;
    border-bottom: 1px solid var(--fs-gray-200);
  }
}

/* HERO */
.fs-hero {
  background: var(--fs-white);
  padding: 72px 0 64px; position: relative; overflow: hidden;
  border-bottom: 1px solid var(--fs-gray-100);
}
.fs-hero::before {
  content: none;
}
.fs-hero-content { position: relative; z-index: 1; text-align: center; }
.fs-hero h1 {
  font-family: var(--fs-font); font-size: clamp(44px, 5.5vw, 72px); color: var(--fs-gray-900);
  line-height: 0.95; margin-bottom: 16px; font-weight: 800; letter-spacing: -0.04em;
}
.fs-hero h1 em { font-style: normal; color: var(--fs-gray-900); }
.fs-hero-sub {
  color: var(--fs-gray-500); font-size: 17px; margin-bottom: 36px;
  max-width: 480px; margin-left: auto; margin-right: auto; font-weight: 400; line-height: 1.6;
}
@media (max-width: 640px) {
  .fs-hero { padding: 40px 0 36px; }
  .fs-hero h1 { font-size: 34px; }
  .fs-hero-sub { font-size: 15px; margin-bottom: 24px; }
}

/* SEARCH BAR */
.fs-search-bar {
  background: var(--fs-white); border-radius: var(--fs-radius-lg);
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid var(--fs-gray-200);
  display: flex; flex-direction: column; padding: 0;
  max-width: 720px; margin: 0 auto; overflow: hidden;
}
.fs-search-ai {
  display: flex; align-items: center; gap: 10px; padding: 14px 20px;
  border-bottom: 1px solid var(--fs-gray-100);
}
.fs-search-ai-icon {
  width: 32px; height: 32px; border-radius: 8px; background: var(--fs-gray-900);
  color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.fs-search-ai-input {
  flex: 1; border: none; outline: none; font-size: 15px; font-weight: 500;
  color: var(--fs-gray-900); background: transparent; font-family: var(--fs-font);
}
.fs-search-ai-input::placeholder { color: var(--fs-gray-400); }
.fs-search-fields-row {
  display: flex; align-items: stretch; border-top: none;
}
.fs-search-field {
  flex: 1; display: flex; flex-direction: column; padding: 12px 16px;
  border-right: 1px solid var(--fs-gray-100);
  min-width: 0;
}
.fs-search-field:last-of-type { border-right: none; }
.fs-search-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--fs-gray-400); margin-bottom: 3px;
}
.fs-search-input, .fs-search-select {
  border: none; outline: none; font-size: 13px; font-weight: 500;
  color: var(--fs-gray-900); background: transparent;
  font-family: var(--fs-font); width: 100%;
}
.fs-search-select { cursor: pointer; appearance: none; }
.fs-search-btn {
  background: var(--fs-blue); color: white; border: none;
  padding: 14px 28px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; gap: 8px;
  font-size: 14px; font-weight: 600; font-family: var(--fs-font);
  transition: background 0.15s; flex-shrink: 0; margin: 12px 16px 14px;
  border-radius: var(--fs-radius-sm);
}
.fs-search-btn:hover { background: var(--fs-blue-light); }
@media (max-width: 700px) {
  .fs-search-bar { border-radius: var(--fs-radius); }
  .fs-search-fields-row { flex-direction: column; }
  .fs-search-field { border-right: none; border-bottom: 1px solid var(--fs-gray-100); padding: 10px 16px; }
  .fs-search-btn { margin: 10px 12px 12px; }
}

/* STATS BAR */
.fs-stats {
  display: flex; justify-content: center; gap: 40px;
  margin-top: 32px; flex-wrap: wrap;
}
.fs-stat { text-align: center; }
.fs-stat-num { color: var(--fs-gray-900); font-size: 26px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; }
.fs-stat-label { color: var(--fs-gray-400); font-size: 12px; font-weight: 500; margin-top: 2px; }

/* SECTION */
.fs-section { padding: 56px 0; }
.fs-section-header {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
}
.fs-section-title {
  font-family: var(--fs-font); font-size: clamp(24px, 3vw, 34px); font-weight: 800;
  line-height: 1.1; letter-spacing: -0.03em;
}
.fs-section-link {
  font-size: 14px; font-weight: 600; color: var(--fs-gray-900);
  cursor: pointer; display: flex; align-items: center; gap: 4px;
  transition: gap 0.15s; opacity: 0.5;
}
.fs-section-link:hover { gap: 8px; opacity: 1; }

/* LISTING CARD */
.fs-card {
  background: var(--fs-white); border-radius: var(--fs-radius);
  overflow: hidden; box-shadow: var(--fs-shadow);
  transition: box-shadow 0.2s, transform 0.2s; cursor: pointer;
}
.fs-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); transform: translateY(-2px); }
.fs-card-body { padding: 16px; }
.fs-card-title {
  font-size: 15px; font-weight: 600; margin-bottom: 4px;
  line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 1;
  -webkit-box-orient: vertical; overflow: hidden;
}
.fs-card-price {
  font-size: 22px; font-weight: 800; color: var(--fs-gray-900);
  margin-bottom: 10px; letter-spacing: -0.02em;
}
.fs-card-meta {
  display: flex; flex-wrap: wrap; gap: 12px;
  font-size: 12px; color: var(--fs-gray-500);
}
.fs-card-meta-item { display: flex; align-items: center; gap: 4px; }
.fs-card-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; border-top: 1px solid var(--fs-gray-100);
  font-size: 12px; color: var(--fs-gray-400);
}
.fs-card-dealer {
  font-size: 11px; color: var(--fs-gray-900); font-weight: 700;
  display: flex; align-items: center; gap: 4px;
  margin-bottom: 8px;
}

/* LISTING GRID */
.fs-grid {
  display: grid; gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
}
@media (max-width: 640px) {
  .fs-grid { grid-template-columns: 1fr; gap: 16px; }
}

/* CATEGORY PILLS */
.fs-categories {
  display: flex; gap: 8px; flex-wrap: wrap;
  justify-content: center; margin-top: 20px;
}
.fs-cat-pill {
  background: var(--fs-gray-100); border: 1px solid var(--fs-gray-200);
  color: var(--fs-gray-600); border-radius: 100px;
  padding: 7px 16px; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; font-family: var(--fs-font);
}
.fs-cat-pill:hover, .fs-cat-pill.active {
  background: var(--fs-gray-900); color: white;
  border-color: var(--fs-gray-900);
}

/* DEALER CARD */
.fs-dealer-card {
  background: var(--fs-white); border-radius: var(--fs-radius);
  padding: 24px; box-shadow: var(--fs-shadow);
  transition: box-shadow 0.2s; cursor: pointer;
  display: flex; gap: 16px; align-items: center;
}
.fs-dealer-card:hover { box-shadow: var(--fs-shadow-md); }
.fs-dealer-avatar {
  width: 52px; height: 52px; border-radius: var(--fs-radius-sm);
  background: var(--fs-navy); color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.fs-dealer-info { flex: 1; min-width: 0; }
.fs-dealer-name { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.fs-dealer-loc { font-size: 12px; color: var(--fs-gray-500); display: flex; align-items: center; gap: 4px; }
.fs-dealer-stats { display: flex; gap: 16px; margin-top: 6px; font-size: 12px; color: var(--fs-gray-500); }
.fs-dealer-rating { color: var(--fs-amber); display: flex; align-items: center; gap: 3px; }

/* NEWS */
.fs-news-card {
  background: var(--fs-white); border-radius: var(--fs-radius);
  padding: 24px; box-shadow: var(--fs-shadow); cursor: pointer;
  transition: box-shadow 0.2s;
}
.fs-news-card:hover { box-shadow: var(--fs-shadow-md); }
.fs-news-tag {
  display: inline-block; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 3px 8px; border-radius: 4px; margin-bottom: 10px;
}
.fs-news-tag.regulation { background: #ede9fe; color: #7c3aed; }
.fs-news-tag.market { background: #d1fae5; color: #059669; }
.fs-news-tag.industry { background: #dbeafe; color: #2563eb; }
.fs-news-tag.infrastructure { background: #fef3c7; color: #d97706; }
.fs-news-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; line-height: 1.35; }
.fs-news-excerpt { font-size: 13px; color: var(--fs-gray-500); line-height: 1.6; margin-bottom: 12px; }
.fs-news-footer { font-size: 12px; color: var(--fs-gray-400); display: flex; gap: 12px; }

/* LISTING DETAIL */
.fs-detail-header {
  background: #000; padding: 20px 0; color: white;
}
.fs-detail-breadcrumb {
  font-size: 13px; color: rgba(255,255,255,0.5);
  display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
}
.fs-detail-breadcrumb span { cursor: pointer; }
.fs-detail-breadcrumb span:hover { color: rgba(255,255,255,0.8); }
.fs-detail-layout {
  display: grid; grid-template-columns: 1fr 380px; gap: 28px;
  padding: 28px 0;
}
@media (max-width: 900px) {
  .fs-detail-layout { grid-template-columns: 1fr; }
}
.fs-detail-sidebar {
  display: flex; flex-direction: column; gap: 20px;
}
.fs-detail-price-card {
  background: var(--fs-white); border-radius: var(--fs-radius);
  padding: 24px; box-shadow: var(--fs-shadow);
}
.fs-detail-price {
  font-size: 34px; font-weight: 800; color: var(--fs-gray-900); margin-bottom: 4px; letter-spacing: -0.03em;
}
.fs-detail-rego {
  font-size: 13px; color: var(--fs-gray-500); margin-bottom: 20px;
}
.fs-detail-cta {
  width: 100%; padding: 14px; border-radius: var(--fs-radius-sm);
  font-size: 15px; font-weight: 600; cursor: pointer;
  font-family: var(--fs-font); transition: all 0.15s; border: none;
}
.fs-detail-cta-primary {
  background: var(--fs-blue); color: white; margin-bottom: 10px;
}
.fs-detail-cta-primary:hover { background: var(--fs-blue-light); }
.fs-detail-cta-secondary {
  background: var(--fs-gray-100); color: var(--fs-gray-700);
}
.fs-detail-cta-secondary:hover { background: var(--fs-gray-200); }

.fs-detail-specs {
  background: var(--fs-white); border-radius: var(--fs-radius);
  padding: 24px; box-shadow: var(--fs-shadow);
}
.fs-detail-specs h3 {
  font-size: 15px; font-weight: 700; margin-bottom: 16px;
  padding-bottom: 12px; border-bottom: 1px solid var(--fs-gray-100);
}
.fs-detail-spec-row {
  display: flex; justify-content: space-between;
  padding: 8px 0; font-size: 13px;
  border-bottom: 1px solid var(--fs-gray-50);
}
.fs-detail-spec-row:last-child { border-bottom: none; }
.fs-detail-spec-label { color: var(--fs-gray-500); }
.fs-detail-spec-value { font-weight: 600; text-align: right; }

.fs-detail-desc {
  background: var(--fs-white); border-radius: var(--fs-radius);
  padding: 24px; box-shadow: var(--fs-shadow); margin-bottom: 20px;
}
.fs-detail-desc h3 {
  font-size: 15px; font-weight: 700; margin-bottom: 12px;
}
.fs-detail-desc p {
  font-size: 14px; color: var(--fs-gray-600); line-height: 1.7;
}

/* SEARCH PAGE */
.fs-search-page-bar {
  background: var(--fs-white); padding: 14px 0;
  border-bottom: 1px solid var(--fs-gray-200);
  position: sticky; top: 64px; z-index: 50;
}
.fs-search-page-inner {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.fs-search-inline-input {
  flex: 1; min-width: 200px; padding: 10px 14px 10px 36px;
  border: 1px solid var(--fs-gray-200); border-radius: var(--fs-radius-sm);
  font-size: 14px; font-family: var(--fs-font); outline: none;
  transition: border-color 0.15s; background: var(--fs-white);
}
.fs-search-inline-input:focus { border-color: var(--fs-gray-900); }
.fs-filter-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: var(--fs-radius-sm);
  border: 1px solid var(--fs-gray-200); font-size: 13px;
  font-weight: 500; cursor: pointer; background: white;
  font-family: var(--fs-font); transition: all 0.15s;
}
.fs-filter-chip:hover { border-color: var(--fs-gray-300); }
.fs-filter-chip.active { border-color: var(--fs-blue); background: #eff6ff; color: var(--fs-blue); }
.fs-results-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.fs-results-count { font-size: 14px; color: var(--fs-gray-500); }
.fs-sort-select {
  padding: 8px 12px; border: 1px solid var(--fs-gray-200);
  border-radius: var(--fs-radius-sm); font-size: 13px;
  font-family: var(--fs-font); outline: none; cursor: pointer; background: var(--fs-white);
}
/* SIDEBAR LAYOUT */
.fs-buy-layout {
  display: grid; grid-template-columns: 260px 1fr; gap: 24px;
}
@media (max-width: 860px) {
  .fs-buy-layout { grid-template-columns: 1fr; }
  .fs-sidebar { display: none; }
  .fs-sidebar.open { display: block; }
}
.fs-sidebar {
  position: sticky; top: 130px; align-self: start;
}
.fs-sidebar-card {
  background: var(--fs-white); border: 1px solid var(--fs-gray-100);
  border-radius: var(--fs-radius); padding: 20px;
}
.fs-sidebar-title {
  font-size: 13px; font-weight: 700; color: var(--fs-gray-900);
  margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;
}
.fs-sidebar-group { margin-bottom: 16px; }
.fs-sidebar-label {
  font-size: 12px; font-weight: 600; color: var(--fs-gray-500);
  margin-bottom: 5px; display: block;
}
.fs-sidebar-select {
  width: 100%; padding: 9px 12px; border: 1px solid var(--fs-gray-200);
  border-radius: var(--fs-radius-sm); font-size: 13px;
  font-family: var(--fs-font); outline: none; cursor: pointer;
  background: var(--fs-white); color: var(--fs-gray-900);
  transition: border-color 0.15s;
}
.fs-sidebar-select:focus { border-color: var(--fs-gray-900); }
.fs-sidebar-range {
  display: flex; gap: 8px; align-items: center;
}
.fs-sidebar-range input {
  flex: 1; padding: 9px 10px; border: 1px solid var(--fs-gray-200);
  border-radius: var(--fs-radius-sm); font-size: 13px;
  font-family: var(--fs-font); outline: none; width: 100%;
}
.fs-sidebar-range input:focus { border-color: var(--fs-gray-900); }
.fs-sidebar-range span { color: var(--fs-gray-400); font-size: 12px; }
.fs-sidebar-check {
  display: flex; align-items: center; gap: 8px; padding: 4px 0;
  font-size: 13px; color: var(--fs-gray-700); cursor: pointer;
}
.fs-sidebar-check input { width: 16px; height: 16px; accent-color: var(--fs-gray-900); cursor: pointer; }
.fs-sidebar-reset {
  width: 100%; padding: 10px; background: var(--fs-gray-100);
  border: none; border-radius: var(--fs-radius-sm);
  font-size: 13px; font-weight: 600; color: var(--fs-gray-600);
  cursor: pointer; font-family: var(--fs-font); margin-top: 8px;
  transition: background 0.15s;
}
.fs-sidebar-reset:hover { background: var(--fs-gray-200); }
.fs-mobile-filter-btn {
  display: none; padding: 8px 16px; background: var(--fs-gray-900);
  color: white; border: none; border-radius: var(--fs-radius-sm);
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--fs-font);
}
@media (max-width: 860px) {
  .fs-mobile-filter-btn { display: flex; align-items: center; gap: 6px; }
}

/* ENQUIRY MODAL */
.fs-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 200; display: flex; align-items: center; justify-content: center;
  padding: 20px; backdrop-filter: blur(4px);
}
.fs-modal {
  background: var(--fs-white); border-radius: var(--fs-radius-lg);
  width: 100%; max-width: 520px; max-height: 90vh;
  overflow-y: auto; box-shadow: var(--fs-shadow-lg);
}
.fs-modal-header {
  padding: 24px 24px 0; display: flex; justify-content: space-between;
  align-items: flex-start;
}
.fs-modal-header h2 { font-size: 20px; font-weight: 700; }
.fs-modal-close {
  background: none; border: none; cursor: pointer;
  color: var(--fs-gray-400); padding: 4px;
}
.fs-modal-body { padding: 20px 24px 24px; }
.fs-form-group { margin-bottom: 16px; }
.fs-form-label {
  display: block; font-size: 13px; font-weight: 600;
  margin-bottom: 6px; color: var(--fs-gray-700);
}
.fs-form-input, .fs-form-textarea, .fs-form-select {
  width: 100%; padding: 10px 14px; border: 1px solid var(--fs-gray-200);
  border-radius: var(--fs-radius-sm); font-size: 14px;
  font-family: var(--fs-font); outline: none; transition: border-color 0.15s;
}
.fs-form-input:focus, .fs-form-textarea:focus, .fs-form-select:focus {
  border-color: var(--fs-blue);
}
.fs-form-textarea { resize: vertical; min-height: 100px; }
.fs-form-submit {
  width: 100%; padding: 14px; background: var(--fs-blue);
  color: white; border: none; border-radius: var(--fs-radius-sm);
  font-size: 15px; font-weight: 600; cursor: pointer;
  font-family: var(--fs-font); transition: background 0.15s;
  margin-top: 8px;
}
.fs-form-submit:hover { background: var(--fs-blue-light); }

/* VALUATION */
.fs-val-card {
  background: #000;
  border-radius: var(--fs-radius-lg); padding: 48px;
  color: white; display: grid; grid-template-columns: 1fr 1fr;
  gap: 48px; align-items: center;
}
@media (max-width: 768px) {
  .fs-val-card { grid-template-columns: 1fr; padding: 32px; gap: 28px; }
}
.fs-val-title { font-family: var(--fs-font); font-size: clamp(26px, 3vw, 36px); margin-bottom: 12px; font-weight: 800; letter-spacing: -0.03em; }
.fs-val-sub { color: rgba(255,255,255,0.6); font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
.fs-val-form { display: flex; flex-direction: column; gap: 12px; }
.fs-val-input {
  padding: 12px 16px; border-radius: var(--fs-radius-sm);
  border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08);
  color: white; font-size: 14px; font-family: var(--fs-font); outline: none;
}
.fs-val-input::placeholder { color: rgba(255,255,255,0.4); }
.fs-val-input:focus { border-color: var(--fs-sky); }
.fs-val-btn {
  padding: 14px; background: #fff; color: #000;
  border: none; border-radius: var(--fs-radius-sm);
  font-size: 15px; font-weight: 700; cursor: pointer;
  font-family: var(--fs-font); transition: background 0.15s;
}
.fs-val-btn:hover { background: #e5e5e5; }

/* FINANCE */
.fs-finance-hero {
  background: #000;
  padding: 56px 0; color: white; text-align: center;
}
.fs-finance-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px; margin-top: 32px;
}
.fs-finance-card {
  background: var(--fs-white); border-radius: var(--fs-radius);
  padding: 28px; box-shadow: var(--fs-shadow); text-align: center;
}
.fs-finance-card-icon {
  width: 48px; height: 48px; border-radius: var(--fs-radius);
  background: #eff6ff; color: var(--fs-blue);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}
.fs-finance-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.fs-finance-card p { font-size: 13px; color: var(--fs-gray-500); line-height: 1.6; }

/* CALCULATOR */
.fs-calc-wrap {
  background: var(--fs-white); border-radius: var(--fs-radius-lg);
  padding: 32px; box-shadow: var(--fs-shadow-md);
  max-width: 600px; margin: 32px auto 0;
}
.fs-calc-row { display: flex; gap: 16px; margin-bottom: 16px; }
.fs-calc-row > * { flex: 1; }
.fs-calc-result {
  background: var(--fs-gray-50); border-radius: var(--fs-radius);
  padding: 24px; text-align: center; margin-top: 20px;
}
.fs-calc-result-label { font-size: 13px; color: var(--fs-gray-500); margin-bottom: 4px; }
.fs-calc-result-value { font-size: 40px; font-weight: 800; color: var(--fs-gray-900); letter-spacing: -0.03em; }
.fs-calc-result-sub { font-size: 12px; color: var(--fs-gray-400); margin-top: 4px; }

/* FOOTER */
.fs-footer {
  background: #000; color: rgba(255,255,255,0.35);
  padding: 56px 0 32px;
}
.fs-footer-grid {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px; margin-bottom: 40px;
}
@media (max-width: 768px) {
  .fs-footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
}
@media (max-width: 480px) {
  .fs-footer-grid { grid-template-columns: 1fr; }
}
.fs-footer-brand { font-family: var(--fs-font); font-size: 20px; color: white; margin-bottom: 12px; font-weight: 800; letter-spacing: -0.03em; }
.fs-footer-brand span { color: rgba(255,255,255,0.4); }
.fs-footer-desc { font-size: 13px; line-height: 1.6; margin-bottom: 16px; }
.fs-footer-heading { color: white; font-size: 13px; font-weight: 700; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
.fs-footer-link { display: block; font-size: 13px; margin-bottom: 8px; cursor: pointer; transition: color 0.15s; }
.fs-footer-link:hover { color: white; }
.fs-footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 24px; display: flex; justify-content: space-between;
  font-size: 12px; flex-wrap: wrap; gap: 12px;
}

/* TOAST */
.fs-toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 300;
  background: var(--fs-gray-900); color: white; padding: 14px 20px;
  border-radius: var(--fs-radius); font-size: 14px; font-weight: 500;
  box-shadow: var(--fs-shadow-lg); display: flex; align-items: center; gap: 8px;
  animation: fs-slide-up 0.3s ease;
}
@keyframes fs-slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* EMPTY STATE */
.fs-empty {
  text-align: center; padding: 48px 24px; color: var(--fs-gray-400);
}
.fs-empty p { margin-top: 8px; font-size: 14px; }

/* TAGS */
.fs-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; padding: 3px 8px;
  border-radius: 4px;
}
.fs-tag-blue { background: #eff6ff; color: var(--fs-blue); }
.fs-tag-green { background: #d1fae5; color: #059669; }
.fs-tag-amber { background: #fef3c7; color: #d97706; }

/* ABOUT PAGE */
.fs-about-hero {
  background: #000;
  padding: 64px 0; color: white; text-align: center;
}
.fs-about-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px; margin-top: 32px;
}
.fs-about-card {
  background: var(--fs-white); border-radius: var(--fs-radius);
  padding: 28px; box-shadow: var(--fs-shadow);
}
.fs-about-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.fs-about-card p { font-size: 13px; color: var(--fs-gray-500); line-height: 1.6; }

/* CONTACT */
.fs-contact-layout {
  display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
  margin-top: 32px;
}
@media (max-width: 768px) { .fs-contact-layout { grid-template-columns: 1fr; } }
.fs-contact-info-card {
  background: var(--fs-white); border-radius: var(--fs-radius);
  padding: 24px; box-shadow: var(--fs-shadow);
  display: flex; gap: 16px; align-items: flex-start;
}
.fs-contact-icon {
  width: 44px; height: 44px; border-radius: var(--fs-radius-sm);
  background: #eff6ff; color: var(--fs-blue);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
`;

// --- COMPONENTS ---
const Nav = ({ page, setPage, setMobileOpen, mobileOpen, user }) => (
  <nav className="fs-nav">
    <div className="fs-container fs-nav-inner">
      <div className="fs-nav-logo" onClick={() => setPage("home")}>
        <span style={{ color: "var(--fs-gray-900)" }}>{Icons.plane}</span>
        <span className="fs-nav-logo-text">Flightsales<span>.com.au</span></span>
      </div>
      <div className={`fs-nav-links${mobileOpen ? " open" : ""}`}>
        {[["buy", "Buy"], ["sell", "Sell"], ["dealers", "Dealers"], ["finance", "Finance"], ["news", "News"], ["valuate", "Valuation"]].map(([p, label]) => (
          <button key={p} className={`fs-nav-link${page === p ? " active" : ""}`} onClick={() => { setPage(p); setMobileOpen(false); }}>{label}</button>
        ))}
      </div>
      <div className={`fs-nav-actions${mobileOpen ? " open" : ""}`}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button 
              onClick={() => setPage('dashboard')}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "var(--fs-radius-sm)"
              }}
            >
              <img 
                src={user.avatar} 
                alt={user.full_name}
                style={{ width: 32, height: 32, borderRadius: "50%" }}
              />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{user.full_name?.split(' ')[0]}</span>
            </button>
            <button className="fs-nav-btn fs-nav-btn-primary" onClick={() => setPage("sell")}>List Aircraft</button>
          </div>
        ) : (
          <>
            <button className="fs-nav-btn fs-nav-btn-ghost" onClick={() => setPage("login")}>{Icons.user}</button>
            <button className="fs-nav-btn fs-nav-btn-primary" onClick={() => setPage("sell")}>List Aircraft</button>
          </>
        )}
      </div>
      <button className="fs-nav-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? Icons.x : Icons.menu}
      </button>
    </div>
  </nav>
);

const Footer = ({ setPage }) => (
  <footer className="fs-footer">
    <div className="fs-container">
      <div className="fs-footer-grid">
        <div>
          <div className="fs-footer-brand">Flightsales<span>.com.au</span></div>
          <p className="fs-footer-desc">Australia's premier aircraft marketplace. Buy and sell aircraft with confidence — from single-engine pistons to turboprops and helicopters.</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <span className="fs-tag fs-tag-green">{Icons.shield} Verified Dealers</span>
            <span className="fs-tag fs-tag-blue">{Icons.check} Trusted Since 2024</span>
          </div>
        </div>
        <div>
          <div className="fs-footer-heading">Browse</div>
          {["Single Engine", "Multi Engine", "Turboprop", "Helicopter", "LSA / Ultralight", "All Aircraft"].map(t => (
            <span key={t} className="fs-footer-link" onClick={() => setPage("buy")}>{t}</span>
          ))}
        </div>
        <div>
          <div className="fs-footer-heading">Services</div>
          {["Sell Your Aircraft", "Dealer Portal", "Aircraft Valuation", "Finance Calculator", "Insurance"].map(t => (
            <span key={t} className="fs-footer-link">{t}</span>
          ))}
        </div>
        <div>
          <div className="fs-footer-heading">Company</div>
          {[["about", "About Us"], ["contact", "Contact"], ["news", "News"]].map(([p, t]) => (
            <span key={p} className="fs-footer-link" onClick={() => setPage(p)}>{t}</span>
          ))}
          <span className="fs-footer-link">Terms of Service</span>
          <span className="fs-footer-link">Privacy Policy</span>
        </div>
      </div>
      <div className="fs-footer-bottom">
        <span>&copy; 2026 Flightsales Pty Ltd. ABN 12 345 678 901. All rights reserved.</span>
        <span>Made in Australia</span>
      </div>
    </div>
  </footer>
);

const ListingCard = ({ listing, onClick, onSave, saved }) => (
  <div className="fs-card" onClick={() => onClick(listing)}>
    <AircraftImage listing={listing} />
    <div className="fs-card-body">
      {listing.dealer && (
        <div className="fs-card-dealer">{Icons.shield} {listing.dealer}</div>
      )}
      <div className="fs-card-title">{listing.title}</div>
      <div className="fs-card-price">{formatPriceFull(listing.price)}</div>
      <div className="fs-card-meta">
        <span className="fs-card-meta-item">{Icons.clock} {formatHours(listing.ttaf)} TT</span>
        <span className="fs-card-meta-item">{Icons.gauge} {formatHours(listing.eng_hours)} SMOH</span>
        <span className="fs-card-meta-item">{Icons.location} {listing.city}, {listing.state}</span>
      </div>
    </div>
    <div className="fs-card-footer">
      <span>{timeAgo(listing.created)}</span>
      <span onClick={e => { e.stopPropagation(); onSave(listing.id); }} style={{ cursor: "pointer", color: saved ? "var(--fs-red)" : undefined }}>
        {saved ? Icons.heartFull : Icons.heart}
      </span>
    </div>
  </div>
);

const EnquiryModal = ({ listing, onClose, user }) => {
  const [sent, setSent] = useState(false);
  const [contactMethod, setContactMethod] = useState('email'); // 'email' | 'phone' | 'sms'
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: `Hi, I'm interested in the ${listing.title} (${listing.rego}). Is it available for an inspection?`,
    financeStatus: '',
    hangarStatus: ''
  });

  if (sent) return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
            {Icons.check}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Enquiry Sent</h2>
          <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 24 }}>
            Your enquiry about the {listing.title} has been sent to the seller. They'll receive your details via {contactMethod === 'sms' ? 'SMS' : contactMethod} and should respond within 24 hours.
          </p>
          <button className="fs-detail-cta fs-detail-cta-primary" style={{ maxWidth: 200, margin: "0 auto" }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="fs-modal-header">
          <div>
            <h2>Contact Seller</h2>
            <p style={{ fontSize: 13, color: "var(--fs-gray-500)", marginTop: 4 }}>{listing.title} — {formatPriceFull(listing.price)}</p>
          </div>
          <button className="fs-modal-close" onClick={onClose}>{Icons.x}</button>
        </div>
        
        {/* Contact Method Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--fs-gray-200)" }}>
          {[
            { id: 'email', label: 'Email', icon: Icons.mail },
            { id: 'phone', label: 'Phone', icon: Icons.phone },
          ].map(method => (
            <button
              key={method.id}
              onClick={() => setContactMethod(method.id)}
              style={{
                flex: 1,
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "none",
                border: "none",
                borderBottom: contactMethod === method.id ? "2px solid var(--fs-blue)" : "2px solid transparent",
                color: contactMethod === method.id ? "var(--fs-blue)" : "var(--fs-gray-500)",
                fontWeight: contactMethod === method.id ? 600 : 400,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              {method.icon} {method.label}
            </button>
          ))}
        </div>

        <div className="fs-modal-body">
          {contactMethod === 'phone' ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
                {Icons.phone}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Call the Seller</h3>
              <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 16 }}>
                Mention you found this aircraft on Flightsales
              </p>
              <a 
                href="tel:+61400123456" 
                style={{ 
                  display: "inline-block",
                  padding: "14px 32px", 
                  background: "var(--fs-blue)", 
                  color: "white",
                  borderRadius: "var(--fs-radius-sm)",
                  fontSize: 18,
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                0400 123 456
              </a>
              <p style={{ fontSize: 12, color: "var(--fs-gray-400)", marginTop: 16 }}>
                Available Mon-Fri 9am-6pm AEST
              </p>
            </div>
          ) : (
            <>
              <div className="fs-form-group">
                <label className="fs-form-label">Full Name *</label>
                <input 
                  className="fs-form-input" 
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="fs-form-group">
                  <label className="fs-form-label">Email *</label>
                  <input 
                    className="fs-form-input" 
                    type="email" 
                    placeholder="john@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Phone *</label>
                  <input 
                    className="fs-form-input" 
                    type="tel" 
                    placeholder="04XX XXX XXX"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="fs-form-group">
                <label className="fs-form-label">Are you finance pre-approved?</label>
                <select 
                  className="fs-form-select"
                  value={formData.financeStatus}
                  onChange={e => setFormData({...formData, financeStatus: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="pre-approved">Yes, pre-approved</option>
                  <option value="interested">No, but interested in finance</option>
                  <option value="cash">Cash buyer</option>
                </select>
              </div>
              <div className="fs-form-group">
                <label className="fs-form-label">Message</label>
                <textarea 
                  className="fs-form-textarea" 
                  placeholder="I'm interested in this aircraft. Is it available for viewing?"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  rows={4}
                />
              </div>
              <button className="fs-form-submit" onClick={() => setSent(true)}>
                Send Enquiry
              </button>
            </>
          )}
          
          <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 16, textAlign: "center" }}>
            By submitting, you agree to our Terms and Privacy Policy. Your details will be shared with the seller.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- PAGES ---
const HomePage = ({ setPage, setSelectedListing, savedIds, onSave }) => {
  const [searchCat, setSearchCat] = useState("");
  const [searchMake, setSearchMake] = useState("");
  const [searchState, setSearchState] = useState("");
  
  const featured = SAMPLE_LISTINGS.filter(l => l.featured).slice(0, 4);
  const latest = [...SAMPLE_LISTINGS].sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="fs-hero">
        <div className="fs-container fs-hero-content">
          <h1>Find your next<br/><em>aircraft</em></h1>
          <p className="fs-hero-sub">
            Search thousands of aircraft for sale across Australia. Verified dealers, transparent data, real pricing.
          </p>
          
          <div className="fs-search-bar">
            <div className="fs-search-ai">
              <div className="fs-search-ai-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="12" cy="15" r="2"/></svg>
              </div>
              <input className="fs-search-ai-input" placeholder='Try "4-seat IFR under $500k in VIC" or "best trainer aircraft"' 
                onKeyDown={e => { if (e.key === "Enter" && e.target.value) { 
                  const q = e.target.value.toLowerCase();
                  if (q.includes("vic")) setSearchState("VIC");
                  if (q.includes("nsw")) setSearchState("NSW");
                  if (q.includes("qld")) setSearchState("QLD");
                  if (q.includes("cessna")) setSearchMake("Cessna");
                  if (q.includes("cirrus")) setSearchMake("Cirrus");
                  if (q.includes("helicopter")) setSearchCat("Helicopter");
                  if (q.includes("single")) setSearchCat("Single Engine Piston");
                  if (q.includes("multi")) setSearchCat("Multi Engine Piston");
                  if (q.includes("turbo")) setSearchCat("Turboprop");
                  if (q.includes("lsa") || q.includes("trainer") || q.includes("light sport")) setSearchCat("LSA");
                  setPage("buy");
                }}}
              />
            </div>
            <div className="fs-search-fields-row">
              <div className="fs-search-field">
                <span className="fs-search-label">Category</span>
                <select className="fs-search-select" value={searchCat} onChange={e => setSearchCat(e.target.value)}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="fs-search-field">
                <span className="fs-search-label">Make</span>
                <select className="fs-search-select" value={searchMake} onChange={e => setSearchMake(e.target.value)}>
                  <option value="">All Makes</option>
                  {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="fs-search-field">
                <span className="fs-search-label">State</span>
                <select className="fs-search-select" value={searchState} onChange={e => setSearchState(e.target.value)}>
                  <option value="">All States</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button className="fs-search-btn" onClick={() => setPage("buy")}>
              {Icons.search} Search Aircraft
            </button>
          </div>

          <div className="fs-categories">
            {CATEGORIES.slice(0, 6).map(c => (
              <button key={c} className="fs-cat-pill" onClick={() => setPage("buy")}>{c}</button>
            ))}
          </div>

          <div className="fs-stats">
            <div className="fs-stat"><div className="fs-stat-num">{SAMPLE_LISTINGS.length}+</div><div className="fs-stat-label">Aircraft Listed</div></div>
            <div className="fs-stat"><div className="fs-stat-num">{DEALERS.length}</div><div className="fs-stat-label">Verified Dealers</div></div>
            <div className="fs-stat"><div className="fs-stat-num">2.4K+</div><div className="fs-stat-label">Monthly Buyers</div></div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="fs-section">
        <div className="fs-container">
          <div className="fs-section-header">
            <h2 className="fs-section-title">Featured Aircraft</h2>
            <span className="fs-section-link" onClick={() => setPage("buy")}>View all aircraft {Icons.arrowRight}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {featured.map(l => (
              <ListingCard key={l.id} listing={l} onClick={setSelectedListing} onSave={onSave} saved={savedIds.has(l.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* VALUATION CTA */}
      <section className="fs-section" style={{ paddingTop: 0 }}>
        <div className="fs-container">
          <div className="fs-val-card">
            <div>
              <h2 className="fs-val-title">What's your aircraft worth?</h2>
              <p className="fs-val-sub">Get an instant market estimate based on recent sales data, condition, and hours. Free for private sellers.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {["Based on real market data", "Updated monthly", "Free for private sellers"].map(t => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: "var(--fs-sky)" }}>{Icons.check}</span> {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="fs-val-form">
              <select className="fs-val-input" style={{ cursor: "pointer" }}>
                <option>Select Manufacturer</option>
                {MANUFACTURERS.map(m => <option key={m}>{m}</option>)}
              </select>
              <input className="fs-val-input" placeholder="Model (e.g. SR22T, C182)" />
              <input className="fs-val-input" placeholder="Year" type="number" />
              <input className="fs-val-input" placeholder="Total Time Airframe (hours)" type="number" />
              <button className="fs-val-btn" onClick={() => setPage("valuate")}>Get Free Valuation</button>
            </div>
          </div>
        </div>
      </section>

      {/* LATEST */}
      <section className="fs-section" style={{ paddingTop: 0 }}>
        <div className="fs-container">
          <div className="fs-section-header">
            <h2 className="fs-section-title">Just Listed</h2>
            <span className="fs-section-link" onClick={() => setPage("buy")}>View all {Icons.arrowRight}</span>
          </div>
          <div className="fs-grid">
            {latest.map(l => (
              <ListingCard key={l.id} listing={l} onClick={setSelectedListing} onSave={onSave} saved={savedIds.has(l.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* DEALERS */}
      <section className="fs-section" style={{ background: "var(--fs-gray-50)", paddingTop: 56, paddingBottom: 56 }}>
        <div className="fs-container">
          <div className="fs-section-header">
            <h2 className="fs-section-title">Verified Dealers</h2>
            <span className="fs-section-link" onClick={() => setPage("dealers")}>All dealers {Icons.arrowRight}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {DEALERS.slice(0, 3).map(d => (
              <div key={d.id} className="fs-dealer-card" onClick={() => setPage("dealers")}>
                <div className="fs-dealer-avatar">{d.logo}</div>
                <div className="fs-dealer-info">
                  <div className="fs-dealer-name">{d.name}</div>
                  <div className="fs-dealer-loc">{Icons.location} {d.location}</div>
                  <div className="fs-dealer-stats">
                    <span>{d.listings} listings</span>
                    <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>
                    <span>Since {d.since}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS */}
      <section className="fs-section">
        <div className="fs-container">
          <div className="fs-section-header">
            <h2 className="fs-section-title">Aviation News</h2>
            <span className="fs-section-link" onClick={() => setPage("news")}>All articles {Icons.arrowRight}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 960, margin: "0 auto" }}>
            {NEWS_ARTICLES.slice(0, 3).map(a => (
              <div key={a.id} className="fs-news-card">
                <span className={`fs-news-tag ${a.category.toLowerCase()}`}>{a.category}</span>
                <div className="fs-news-title">{a.title}</div>
                <div className="fs-news-excerpt">{a.excerpt}</div>
                <div className="fs-news-footer">
                  <span>{a.date}</span>
                  <span>{a.read_time} min read</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

const BuyPage = ({ setSelectedListing, savedIds, onSave }) => {
  const [search, setSearch] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [catFilter, setCatFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [makeFilter, setMakeFilter] = useState("");
  const [condFilter, setCondFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxHours, setMaxHours] = useState("");
  const [ifrOnly, setIfrOnly] = useState(false);
  const [glassOnly, setGlassOnly] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const handleAiSearch = (query) => {
    const q = query.toLowerCase();
    if (q.includes("vic")) setStateFilter("VIC");
    if (q.includes("nsw")) setStateFilter("NSW");
    if (q.includes("qld")) setStateFilter("QLD");
    if (q.includes("wa")) setStateFilter("WA");
    if (q.includes("sa")) setStateFilter("SA");
    if (q.includes("tas")) setStateFilter("TAS");
    if (q.includes("cessna")) setMakeFilter("Cessna");
    if (q.includes("cirrus")) setMakeFilter("Cirrus");
    if (q.includes("piper")) setMakeFilter("Piper");
    if (q.includes("diamond")) setMakeFilter("Diamond");
    if (q.includes("robinson")) setMakeFilter("Robinson");
    if (q.includes("sling")) setMakeFilter("Sling");
    if (q.includes("pilatus")) setMakeFilter("Pilatus");
    if (q.includes("beech")) setMakeFilter("Beechcraft");
    if (q.includes("jabiru")) setMakeFilter("Jabiru");
    if (q.includes("helicopter") || q.includes("heli") || q.includes("chopper")) setCatFilter("Helicopter");
    if (q.includes("single engine") || q.includes("single-engine") || q.includes("sep")) setCatFilter("Single Engine Piston");
    if (q.includes("multi") || q.includes("twin")) setCatFilter("Multi Engine Piston");
    if (q.includes("turboprop") || q.includes("turbo prop")) setCatFilter("Turboprop");
    if (q.includes("jet")) setCatFilter("Jet");
    if (q.includes("lsa") || q.includes("light sport") || q.includes("trainer") || q.includes("ultralight")) setCatFilter("LSA");
    if (q.includes("ifr")) setIfrOnly(true);
    if (q.includes("glass")) setGlassOnly(true);
    if (q.includes("new") && !q.includes("news")) setCondFilter("New");
    const priceMatch = q.match(/under\s*\$?(\d+)\s*k/);
    if (priceMatch) setMaxPrice(String(parseInt(priceMatch[1]) * 1000));
    const priceMatchM = q.match(/under\s*\$?(\d+\.?\d*)\s*m/);
    if (priceMatchM) setMaxPrice(String(Math.round(parseFloat(priceMatchM[1]) * 1000000)));
    const hoursMatch = q.match(/under\s*(\d+)\s*hours/);
    if (hoursMatch) setMaxHours(hoursMatch[1]);
    setAiQuery(query);
  };

  const resetFilters = () => {
    setSearch(""); setCatFilter(""); setStateFilter(""); setMakeFilter("");
    setCondFilter(""); setMinPrice(""); setMaxPrice(""); setMaxHours("");
    setIfrOnly(false); setGlassOnly(false); setAiQuery("");
  };

  const activeFilterCount = [catFilter, stateFilter, makeFilter, condFilter, minPrice, maxPrice, maxHours, ifrOnly, glassOnly].filter(Boolean).length;

  const filtered = useMemo(() => {
    let results = SAMPLE_LISTINGS.filter(l => {
      if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.manufacturer.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && l.category !== catFilter) return false;
      if (stateFilter && l.state !== stateFilter) return false;
      if (makeFilter && l.manufacturer !== makeFilter) return false;
      if (condFilter && l.condition !== condFilter) return false;
      if (minPrice && l.price < parseInt(minPrice)) return false;
      if (maxPrice && l.price > parseInt(maxPrice)) return false;
      if (maxHours && l.ttaf > parseInt(maxHours)) return false;
      if (ifrOnly && !l.ifr) return false;
      if (glassOnly && !l.glass_cockpit) return false;
      return true;
    });
    if (sortBy === "price-asc") results.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") results.sort((a, b) => b.price - a.price);
    if (sortBy === "newest") results.sort((a, b) => new Date(b.created) - new Date(a.created));
    if (sortBy === "hours-low") results.sort((a, b) => a.ttaf - b.ttaf);
    return results;
  }, [search, sortBy, catFilter, stateFilter, makeFilter, condFilter, minPrice, maxPrice, maxHours, ifrOnly, glassOnly]);

  return (
    <>
      <div className="fs-search-page-bar">
        <div className="fs-container fs-search-page-inner">
          <div className="fs-search-ai-icon" style={{ width: 28, height: 28, borderRadius: 6, fontSize: 11 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="12" cy="15" r="2"/></svg>
          </div>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <input className="fs-search-inline-input" style={{ paddingLeft: 14 }}
              placeholder='Search "4-seat IFR under $500k" or type aircraft name...' 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.target.value) handleAiSearch(e.target.value); }}
            />
          </div>
          <button className="fs-mobile-filter-btn" onClick={() => setSideOpen(!sideOpen)}>
            {Icons.filter} Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select className="fs-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="hours-low">Hours: Low to High</option>
          </select>
        </div>
      </div>
      <section className="fs-section" style={{ paddingTop: 24 }}>
        <div className="fs-container">
          <div className="fs-buy-layout">
            {/* SIDEBAR */}
            <div className={`fs-sidebar${sideOpen ? " open" : ""}`}>
              <div className="fs-sidebar-card">
                <div className="fs-sidebar-title">Filter Aircraft</div>
                
                <div className="fs-sidebar-group">
                  <label className="fs-sidebar-label">Category</label>
                  <select className="fs-sidebar-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="fs-sidebar-group">
                  <label className="fs-sidebar-label">Manufacturer</label>
                  <select className="fs-sidebar-select" value={makeFilter} onChange={e => setMakeFilter(e.target.value)}>
                    <option value="">All Makes</option>
                    {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="fs-sidebar-group">
                  <label className="fs-sidebar-label">State</label>
                  <select className="fs-sidebar-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                    <option value="">All States</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="fs-sidebar-group">
                  <label className="fs-sidebar-label">Condition</label>
                  <select className="fs-sidebar-select" value={condFilter} onChange={e => setCondFilter(e.target.value)}>
                    <option value="">Any</option>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="fs-sidebar-group">
                  <label className="fs-sidebar-label">Price Range</label>
                  <div className="fs-sidebar-range">
                    <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                    <span>—</span>
                    <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                  </div>
                </div>

                <div className="fs-sidebar-group">
                  <label className="fs-sidebar-label">Max Total Hours</label>
                  <input type="number" placeholder="e.g. 2000" value={maxHours} onChange={e => setMaxHours(e.target.value)} 
                    style={{ width: "100%", padding: "9px 10px", border: "1px solid var(--fs-gray-200)", borderRadius: "var(--fs-radius-sm)", fontSize: 13, fontFamily: "var(--fs-font)", outline: "none" }} />
                </div>

                <div className="fs-sidebar-group">
                  <label className="fs-sidebar-label">Features</label>
                  <label className="fs-sidebar-check">
                    <input type="checkbox" checked={ifrOnly} onChange={e => setIfrOnly(e.target.checked)} /> IFR Capable
                  </label>
                  <label className="fs-sidebar-check">
                    <input type="checkbox" checked={glassOnly} onChange={e => setGlassOnly(e.target.checked)} /> Glass Cockpit
                  </label>
                </div>

                {activeFilterCount > 0 && (
                  <button className="fs-sidebar-reset" onClick={resetFilters}>
                    Clear all filters ({activeFilterCount})
                  </button>
                )}
              </div>
            </div>

            {/* RESULTS */}
            <div>
              <div className="fs-results-bar">
                <span className="fs-results-count">
                  {filtered.length} aircraft found
                  {aiQuery && <span style={{ color: "var(--fs-gray-400)", marginLeft: 8 }}>for "{aiQuery}"</span>}
                </span>
              </div>
              {filtered.length === 0 ? (
                <div className="fs-empty">
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{Icons.search}</div>
                  <p>No aircraft match your filters.</p>
                  <button className="fs-sidebar-reset" style={{ maxWidth: 200, margin: "16px auto 0" }} onClick={resetFilters}>Clear all filters</button>
                </div>
              ) : (
                <div className="fs-grid">
                  {filtered.map(l => (
                    <ListingCard key={l.id} listing={l} onClick={setSelectedListing} onSave={onSave} saved={savedIds.has(l.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const ListingDetail = ({ listing, onBack, savedIds, onSave, user }) => {
  const [showEnquiry, setShowEnquiry] = useState(false);
  if (!listing) return null;
  const l = listing;
  
  return (
    <>
      <div className="fs-detail-header">
        <div className="fs-container">
          <div className="fs-detail-breadcrumb">
            <span onClick={onBack}>Buy</span> {Icons.chevronRight}
            <span>{l.category}</span> {Icons.chevronRight}
            <span style={{ color: "rgba(255,255,255,0.8)" }}>{l.title}</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{l.title}</h1>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "rgba(255,255,255,0.5)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.location} {l.city}, {l.state}</span>
            <span>Listed {timeAgo(l.created)}</span>
            {l.dealer && <span className="fs-tag fs-tag-blue" style={{ fontSize: 10 }}>{Icons.shield} Verified Dealer</span>}
            <span>{l.condition}</span>
          </div>
        </div>
      </div>

      <div className="fs-container">
        <div className="fs-detail-layout">
          {/* Main content */}
          <div>
            <AircraftImage listing={l} size="lg" style={{ borderRadius: "var(--fs-radius)", marginBottom: 20 }} />
            
            <div className="fs-detail-desc">
              <h3>Description</h3>
              <p>{l.description}</p>
            </div>
            
            <div className="fs-detail-specs">
              <h3>Key Specifications</h3>
              {[
                ["Year", l.year],
                ["Manufacturer", l.manufacturer],
                ["Model", l.model],
                ["Registration", l.rego],
                ["Category", l.category],
                ["Condition", l.condition],
                ["Total Time Airframe", formatHours(l.ttaf)],
                ["Engine Hours (SMOH)", formatHours(l.eng_hours)],
                ["Engine TBO", l.eng_tbo ? formatHours(l.eng_tbo) : "N/A"],
                ["Engine", l.specs.engine],
                ["Propeller", l.specs.propeller],
                ["Avionics", l.avionics],
                ["Seats", l.specs.seats],
                ["MTOW", l.specs.mtow_kg + " kg"],
                l.specs.wingspan_m && ["Wingspan", l.specs.wingspan_m + " m"],
                ["Useful Load", l.useful_load + " kg"],
                ["Range", l.range_nm + " nm"],
                ["Cruise Speed", l.cruise_kts + " kts"],
                ["Fuel Burn", l.fuel_burn + " L/hr"],
                ["IFR Capable", l.ifr ? "Yes" : "No"],
                ["Retractable Gear", l.retractable ? "Yes" : "No"],
                l.pressurised !== undefined && ["Pressurised", l.pressurised ? "Yes" : "No"],
                ["Glass Cockpit", l.glass_cockpit ? "Yes" : "No"],
                l.specs.parachute && ["Parachute", l.specs.parachute],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="fs-detail-spec-row">
                  <span className="fs-detail-spec-label">{label}</span>
                  <span className="fs-detail-spec-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="fs-detail-sidebar">
            <div className="fs-detail-price-card">
              <div className="fs-detail-price">{formatPriceFull(l.price)}</div>
              <div className="fs-detail-rego">{l.rego} &middot; {l.condition}</div>
              
              {/* Primary CTA - Enquire */}
              <button className="fs-detail-cta fs-detail-cta-primary" onClick={() => setShowEnquiry(true)}>
                {Icons.mail} &nbsp;Email Seller
              </button>
              
              {/* Phone CTA */}
              <a 
                href="tel:+61400123456"
                className="fs-detail-cta fs-detail-cta-secondary"
                style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {Icons.phone} &nbsp;Call Seller
              </a>
              
              {/* Save Button */}
              <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => onSave(l.id)}>
                {savedIds.has(l.id) ? Icons.heartFull : Icons.heart} &nbsp;{savedIds.has(l.id) ? "Saved" : "Save to Watchlist"}
              </button>
              <div style={{ marginTop: 16, padding: "16px 0", borderTop: "1px solid var(--fs-gray-100)" }}>
                <div style={{ fontSize: 12, color: "var(--fs-gray-400)", marginBottom: 8 }}>Estimated Monthly Finance</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{formatPriceFull(Math.round(l.price * 0.008))}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--fs-gray-400)" }}>/mo</span></div>
                <div style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>Based on 80% LVR, 7.5% over 10 years</div>
              </div>
            </div>

            {l.dealer && (
              <div className="fs-detail-specs">
                <h3>Dealer</h3>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                  <div className="fs-dealer-avatar" style={{ width: 40, height: 40, fontSize: 12 }}>
                    {DEALERS.find(d => d.id === l.dealer_id)?.logo}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{l.dealer}</div>
                    <div style={{ fontSize: 12, color: "var(--fs-gray-500)", display: "flex", alignItems: "center", gap: 4 }}>
                      {Icons.location} {DEALERS.find(d => d.id === l.dealer_id)?.location}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--fs-gray-500)" }}>
                  <span className="fs-dealer-rating">{Icons.star} {DEALERS.find(d => d.id === l.dealer_id)?.rating}</span>
                  <span>{DEALERS.find(d => d.id === l.dealer_id)?.listings} active listings</span>
                </div>
              </div>
            )}

            <div className="fs-detail-specs">
              <h3>Cost of Ownership (est.)</h3>
              {[
                ["Annual Insurance", formatPriceFull(Math.round(l.price * 0.015))],
                ["Annual Inspection", l.category === "Helicopter" ? "$8,000 - $15,000" : "$3,000 - $8,000"],
                ["Hangar (monthly)", "$400 - $1,200"],
                ["Fuel per hour", `$${(l.fuel_burn * 2.8).toFixed(0)}`],
                ["Hourly Operating Cost", `~$${(l.fuel_burn * 2.8 + (l.eng_tbo ? (l.price * 0.3 / l.eng_tbo) : 50) + 30).toFixed(0)}`],
              ].map(([label, value]) => (
                <div key={label} className="fs-detail-spec-row">
                  <span className="fs-detail-spec-label">{label}</span>
                  <span className="fs-detail-spec-value">{value}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 12 }}>
                Estimates only. Based on Australian averages. Actual costs vary by location, usage, and maintenance provider.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showEnquiry && <EnquiryModal listing={l} onClose={() => setShowEnquiry(false)} user={user} />}
    </>
  );
};

const SellPage = ({ user, setPage }) => {
  // Require login to sell
  if (!user) {
    return (
      <>
        <div className="fs-about-hero">
          <div className="fs-container">
            <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 36 }}>Sell Your Aircraft</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Reach thousands of qualified buyers across Australia</p>
          </div>
        </div>
        <section className="fs-section">
          <div className="fs-container" style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="fs-detail-specs" style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 36
              }}>
                {Icons.user}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Sign in to List Your Aircraft</h3>
              <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 24 }}>
                Create an account or sign in to list your aircraft for sale. 
                It's free to create a basic listing.
              </p>
              <button 
                className="fs-form-submit"
                onClick={() => setPage('login')}
                style={{ maxWidth: 280, margin: '0 auto 12px' }}
              >
                Sign In / Create Account
              </button>
              <button 
                className="fs-detail-cta fs-detail-cta-secondary"
                onClick={() => setPage('buy')}
                style={{ maxWidth: 280, margin: '0 auto' }}
              >
                Browse Aircraft Instead
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    manufacturer: '',
    model: '',
    year: '',
    category: '',
    rego: '',
    condition: '',
    price: '',
    state: '',
    ttaf: '',
    eng_hours: '',
    engineType: '',
    propeller: '',
    avionics: '',
    description: ''
  });
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  const lookupCASA = async () => {
    const rego = formData.rego.toUpperCase().trim();
    
    // Validate format
    if (!rego.match(/^VH-[A-Z]{3}$/)) {
      setLookupError('Invalid format. Use VH-ABC (3 letters after VH-)');
      return;
    }
    
    setIsLookingUp(true);
    setLookupError(null);
    setAutoFilled(false);
    
    try {
      const response = await fetch(`/api/casa-lookup?rego=${rego}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lookup failed');
      }
      
      // Map CASA data to form fields - comprehensive mapping
      const updates = { rego };
      if (data.manufacturer) updates.manufacturer = data.manufacturer;
      if (data.model) updates.model = data.model;
      if (data.year) updates.year = data.year.toString();
      if (data.category) updates.category = data.category;
      if (data.engineType) updates.engineType = data.engineType;
      if (data.mtow_kg) updates.mtow = data.mtow_kg.toString();
      if (data.seats) updates.seats = data.seats.toString();
      if (data.serialNumber) updates.serialNumber = data.serialNumber;
      if (data.propeller) updates.propeller = data.propeller;
      if (data.registration) updates.rego = data.registration;
      
      setFormData(prev => ({ ...prev, ...updates }));
      setAutoFilled(true);
      setShowManualForm(true);
      
      // Show toast
      setToast?.('Aircraft details found and auto-filled!');
      
    } catch (error) {
      setLookupError(error.message || 'Aircraft not found in CASA register');
      // Still show form so they can enter manually
      setShowManualForm(true);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'rego') {
      setLookupError(null);
      setAutoFilled(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && formData.rego.length >= 6) {
      lookupCASA();
    }
  };

  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 36 }}>Sell Your Aircraft</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Reach thousands of qualified buyers across Australia</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container" style={{ maxWidth: 700, margin: "0 auto" }}>
          {/* Progress */}
          <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "var(--fs-blue)" : "var(--fs-gray-200)", transition: "background 0.3s" }} />
            ))}
          </div>
          
          {step === 1 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              <h3 style={{ fontSize: 18, marginBottom: 24 }}>Step 1: Enter Registration</h3>
              
              {/* CASA Rego Lookup - SLIMLINE */}
              <div style={{ marginBottom: 24 }}>
                <label className="fs-form-label">Aircraft Registration</label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input 
                    className="fs-form-input" 
                    placeholder="VH-ABC"
                    value={formData.rego}
                    onChange={e => handleInputChange('rego', e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    style={{ 
                      textTransform: 'uppercase', 
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      flex: 1
                    }}
                    maxLength={6}
                  />
                  <button 
                    type="button"
                    onClick={lookupCASA}
                    disabled={isLookingUp || formData.rego.length < 6}
                    className="fs-nav-btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isLookingUp ? '...' : 'Lookup'}
                  </button>
                </div>
                
                {lookupError && (
                  <p style={{ fontSize: 12, color: 'var(--fs-red)', marginTop: 8 }}>
                    {lookupError} — <button onClick={() => setShowManualForm(true)} style={{ textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>enter manually</button>
                  </p>
                )}
                
                {autoFilled && (
                  <p style={{ fontSize: 12, color: 'var(--fs-green)', marginTop: 8 }}>
                    {Icons.check} Found in CASA — details loaded below
                  </p>
                )}
                
                {!showManualForm && !lookupError && !autoFilled && (
                  <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginTop: 8 }}>
                    Or <button onClick={() => setShowManualForm(true)} style={{ textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>skip and enter manually</button>
                  </p>
                )}
              </div>
              
              {/* Aircraft Details Form - Shows after lookup or manual entry */}
              {showManualForm && (
                <>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--fs-gray-200)'
                  }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Aircraft Details</h4>
                    {autoFilled && (
                      <span style={{ 
                        fontSize: 11, 
                        color: '#16a34a', 
                        background: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        Auto-filled from CASA
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="fs-form-group">
                      <label className="fs-form-label">Manufacturer *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.manufacturer}
                    onChange={e => handleInputChange('manufacturer', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Model *</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="e.g. SR22T, C182T"
                    value={formData.model}
                    onChange={e => handleInputChange('model', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Year *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="2020"
                    value={formData.year}
                    onChange={e => handleInputChange('year', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Category *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.category}
                    onChange={e => handleInputChange('category', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Registration *</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="VH-XXX"
                    value={formData.rego}
                    onChange={e => handleInputChange('rego', e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Condition *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.condition}
                    onChange={e => handleInputChange('condition', e.target.value)}
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Asking Price (AUD) *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="350000"
                    value={formData.price}
                    onChange={e => handleInputChange('price', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Location (State) *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              </>
            )}
              <button className="fs-form-submit" onClick={() => setStep(2)} style={{ marginTop: 16 }}>Continue to Specs</button>
            </div>
          )}
          
          {step === 2 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              <h3 style={{ fontSize: 18 }}>Specifications & Hours</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="fs-form-group">
                  <label className="fs-form-label">Total Time Airframe *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="Hours"
                    value={formData.ttaf}
                    onChange={e => handleInputChange('ttaf', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Engine Hours (SMOH) *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="Hours"
                    value={formData.eng_hours}
                    onChange={e => handleInputChange('eng_hours', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Engine Type</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="e.g. Lycoming IO-540"
                    value={formData.engineType}
                    onChange={e => handleInputChange('engineType', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Propeller</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="e.g. Hartzell 3-blade"
                    value={formData.propeller}
                    onChange={e => handleInputChange('propeller', e.target.value)}
                  />
                </div>
                <div className="fs-form-group" style={{ gridColumn: "span 2" }}>
                  <label className="fs-form-label">Avionics</label>
                  <input className="fs-form-input" placeholder="e.g. Garmin G1000 NXi, GFC700 autopilot" />
                </div>
                <div className="fs-form-group" style={{ gridColumn: "span 2" }}>
                  <label className="fs-form-label">Description *</label>
                  <textarea className="fs-form-textarea" placeholder="Describe the aircraft condition, history, notable features..." style={{ minHeight: 120 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                <button className="fs-form-submit" onClick={() => setStep(3)} style={{ flex: 2, marginTop: 0 }}>Continue to Photos</button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              {!user ? (
                /* LOGIN PROMPT */
                <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: '50%', 
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: 28
                  }}>
                    {Icons.user}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in to continue</h3>
                  <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                    Create an account or sign in to submit your aircraft listing and manage your ads.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280, margin: '0 auto' }}>
                    <button 
                      className="fs-form-submit"
                      onClick={() => setPage && setPage('login')}
                      style={{ marginTop: 0 }}
                    >
                      Sign In / Create Account
                    </button>
                    <button 
                      className="fs-detail-cta fs-detail-cta-secondary"
                      onClick={() => setStep(2)}
                    >
                      Back to Edit
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginTop: 20 }}>
                    Free to list. No credit card required.
                  </p>
                </div>
              ) : (
                /* LOGGED IN - SHOW SUBMIT FORM */
                <>
                  <h3 style={{ fontSize: 18 }}>Photos & Submit</h3>
                  <div style={{ border: "2px dashed var(--fs-gray-200)", borderRadius: "var(--fs-radius)", padding: 40, textAlign: "center", marginBottom: 20 }}>
                    <div style={{ color: "var(--fs-gray-400)", marginBottom: 8 }}>{Icons.camera}</div>
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Upload Photos</p>
                    <p style={{ fontSize: 12, color: "var(--fs-gray-400)" }}>Minimum 4 photos required. Include exterior (4 angles), cockpit, panel, and engine bay.</p>
                    <button className="fs-detail-cta fs-detail-cta-secondary" style={{ maxWidth: 200, margin: "16px auto 0" }}>Choose Files</button>
                  </div>
                  <div style={{ background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius)", padding: 20, marginBottom: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Listing Plans</h4>
                    {[
                      { name: "Basic", price: "Free", features: ["30-day listing", "Up to 8 photos", "Standard placement"] },
                      { name: "Featured", price: "$149", features: ["60-day listing", "Up to 20 photos", "Homepage featured", "Priority in search", "Social media promotion"], recommended: true },
                      { name: "Premium", price: "$299", features: ["90-day listing", "Unlimited photos", "Top placement", "Video walkthrough", "Valuation report", "Dedicated support"] },
                    ].map(plan => (
                      <label key={plan.name} style={{ display: "flex", gap: 12, padding: "12px", marginBottom: 8, borderRadius: "var(--fs-radius-sm)", border: plan.recommended ? "2px solid var(--fs-blue)" : "1px solid var(--fs-gray-200)", cursor: "pointer", background: "white" }}>
                        <input type="radio" name="plan" defaultChecked={plan.recommended} style={{ marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{plan.name}</span>
                            <span style={{ fontWeight: 700, color: "var(--fs-blue)" }}>{plan.price}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--fs-gray-500)", marginTop: 4 }}>
                            {plan.features.join(" · ")}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
                    <button className="fs-form-submit" style={{ flex: 2, marginTop: 0 }}>Submit Listing for Review</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

const DealersPage = () => (
  <>
    <div className="fs-about-hero">
      <div className="fs-container">
        <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 36 }}>Verified Dealers</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Trusted aviation businesses across Australia</p>
      </div>
    </div>
    <section className="fs-section">
      <div className="fs-container">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {DEALERS.map(d => (
            <div key={d.id} className="fs-dealer-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", marginBottom: 12 }}>
                <div className="fs-dealer-avatar" style={{ width: 56, height: 56, fontSize: 16 }}>{d.logo}</div>
                <div>
                  <div className="fs-dealer-name" style={{ fontSize: 17 }}>{d.name}</div>
                  <div className="fs-dealer-loc">{Icons.location} {d.location}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--fs-gray-500)", marginBottom: 12 }}>
                Specialising in {d.speciality}
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 13, width: "100%", paddingTop: 12, borderTop: "1px solid var(--fs-gray-100)" }}>
                <span>{d.listings} active listings</span>
                <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>
                <span>Est. {d.since}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40, padding: "32px", background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius-lg)" }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Become a Flightsales Dealer</h3>
          <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 16, maxWidth: 500, margin: "0 auto 16px" }}>
            Get a branded storefront, lead management tools, and access to Australia's largest aviation audience.
          </p>
          <button className="fs-form-submit" style={{ maxWidth: 240, margin: "0 auto" }}>Apply Now</button>
        </div>
      </div>
    </section>
  </>
);

const FinancePage = () => {
  const [amount, setAmount] = useState(400000);
  const [deposit, setDeposit] = useState(20);
  const [rate, setRate] = useState(7.5);
  const [term, setTerm] = useState(10);
  const loanAmt = amount * (1 - deposit / 100);
  const monthly = loanAmt * (rate / 100 / 12) / (1 - Math.pow(1 + rate / 100 / 12, -term * 12));

  return (
    <>
      <div className="fs-finance-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 36, marginBottom: 8 }}>Aircraft Finance</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 500, margin: "0 auto" }}>
            Competitive rates from Australia's leading aviation finance providers. Get pre-approved in minutes.
          </p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container">
          <div className="fs-finance-grid">
            {[
              { icon: Icons.dollar, title: "Competitive Rates", desc: "Access rates from 6.5% through our panel of specialist aviation lenders. Fixed and variable options." },
              { icon: Icons.calculator, title: "Fast Pre-Approval", desc: "Get pre-approved online in minutes. Know your budget before you start looking." },
              { icon: Icons.shield, title: "Aviation Specialists", desc: "Our finance partners understand aircraft. They know the market, the valuations, and the industry." },
              { icon: Icons.plane, title: "All Aircraft Types", desc: "Finance available for single engine, multi engine, turboprop, helicopter, and LSA aircraft." },
            ].map((c, i) => (
              <div key={i} className="fs-finance-card">
                <div className="fs-finance-card-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="fs-calc-wrap">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: "center" }}>Repayment Calculator</h3>
            <div className="fs-form-group">
              <label className="fs-form-label">Aircraft Price: {formatPriceFull(amount)}</label>
              <input type="range" min={50000} max={5000000} step={10000} value={amount} onChange={e => setAmount(+e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="fs-calc-row">
              <div className="fs-form-group">
                <label className="fs-form-label">Deposit: {deposit}%</label>
                <input type="range" min={0} max={50} step={5} value={deposit} onChange={e => setDeposit(+e.target.value)} style={{ width: "100%" }} />
              </div>
              <div className="fs-form-group">
                <label className="fs-form-label">Rate: {rate}%</label>
                <input type="range" min={5} max={12} step={0.25} value={rate} onChange={e => setRate(+e.target.value)} style={{ width: "100%" }} />
              </div>
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Term: {term} years</label>
              <input type="range" min={3} max={20} value={term} onChange={e => setTerm(+e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="fs-calc-result">
              <div className="fs-calc-result-label">Estimated Monthly Repayment</div>
              <div className="fs-calc-result-value">{formatPriceFull(Math.round(monthly))}</div>
              <div className="fs-calc-result-sub">
                Loan amount: {formatPriceFull(Math.round(loanAmt))} &middot; Total interest: {formatPriceFull(Math.round(monthly * term * 12 - loanAmt))}
              </div>
            </div>
            <button className="fs-form-submit" style={{ marginTop: 20 }}>Get Pre-Approved</button>
          </div>
        </div>
      </section>
    </>
  );
};

const ValuatePage = () => (
  <>
    <div className="fs-about-hero">
      <div className="fs-container">
        <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 36 }}>Aircraft Valuation</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Free market estimate based on real Australian sales data</p>
      </div>
    </div>
    <section className="fs-section">
      <div className="fs-container" style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
          <h3 style={{ fontSize: 18 }}>Get Your Valuation</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="fs-form-group">
              <label className="fs-form-label">Manufacturer *</label>
              <select className="fs-form-select"><option>Select...</option>{MANUFACTURERS.map(m => <option key={m}>{m}</option>)}</select>
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Model *</label>
              <input className="fs-form-input" placeholder="e.g. SR22T" />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Year *</label>
              <input className="fs-form-input" type="number" placeholder="2018" />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Total Time Airframe *</label>
              <input className="fs-form-input" type="number" placeholder="Hours" />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Engine Hours (SMOH)</label>
              <input className="fs-form-input" type="number" placeholder="Hours" />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Condition *</label>
              <select className="fs-form-select">{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div className="fs-form-group" style={{ gridColumn: "span 2" }}>
              <label className="fs-form-label">Avionics / Notable Equipment</label>
              <input className="fs-form-input" placeholder="e.g. Garmin G1000, ADSB-Out, autopilot" />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Your Email *</label>
              <input className="fs-form-input" type="email" placeholder="you@email.com" />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Your Phone</label>
              <input className="fs-form-input" type="tel" placeholder="04XX XXX XXX" />
            </div>
          </div>
          <button className="fs-form-submit" style={{ marginTop: 16 }}>Get Free Valuation</button>
          <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 12, textAlign: "center" }}>
            Valuations are estimates based on recent market data and comparable sales. Not a formal appraisal.
          </p>
        </div>
      </div>
    </section>
  </>
);

const NewsPage = () => (
  <>
    <div className="fs-about-hero">
      <div className="fs-container">
        <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 36 }}>Aviation News</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Market reports, CASA updates, and industry news</p>
      </div>
    </div>
    <section className="fs-section">
      <div className="fs-container" style={{ maxWidth: 800, margin: "0 auto" }}>
        {NEWS_ARTICLES.map(a => (
          <div key={a.id} className="fs-news-card" style={{ marginBottom: 16 }}>
            <span className={`fs-news-tag ${a.category.toLowerCase()}`}>{a.category}</span>
            <div className="fs-news-title" style={{ fontSize: 20 }}>{a.title}</div>
            <div className="fs-news-excerpt">{a.excerpt}</div>
            <div className="fs-news-footer">
              <span>{a.date}</span>
              <span>{a.read_time} min read</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  </>
);

const AboutPage = () => (
  <>
    <div className="fs-about-hero" style={{ padding: "72px 0" }}>
      <div className="fs-container">
        <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 40, marginBottom: 12 }}>About Flightsales</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 600, margin: "0 auto", fontSize: 16, lineHeight: 1.7 }}>
          We're building Australia's most trusted aircraft marketplace. A place where pilots, owners, and dealers can buy and sell with transparency, confidence, and fair pricing.
        </p>
      </div>
    </div>
    <section className="fs-section">
      <div className="fs-container">
        <div className="fs-about-grid">
          {[
            { title: "Transparency First", desc: "Every listing has structured data — hours, specs, maintenance history. No more guessing from vague classifieds." },
            { title: "Verified Dealers", desc: "We vet every dealer on the platform. Look for the verified badge for added confidence." },
            { title: "Market Intelligence", desc: "Our valuation tools and market reports give you the data to make informed decisions." },
            { title: "Built by Pilots", desc: "We're aviators ourselves. We know what matters when you're buying or selling an aircraft." },
          ].map((c, i) => (
            <div key={i} className="fs-about-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

const ContactPage = () => (
  <>
    <div className="fs-about-hero">
      <div className="fs-container">
        <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 36 }}>Contact Us</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Get in touch with the Flightsales team</p>
      </div>
    </div>
    <section className="fs-section">
      <div className="fs-container">
        <div className="fs-contact-layout">
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: Icons.mail, title: "Email", detail: "hello@flightsales.com.au", sub: "We respond within 24 hours" },
                { icon: Icons.phone, title: "Phone", detail: "1300 FLIGHT", sub: "Mon-Fri 9am-5pm AEST" },
                { icon: Icons.location, title: "Office", detail: "Moorabbin Airport, VIC 3194", sub: "By appointment only" },
              ].map((c, i) => (
                <div key={i} className="fs-contact-info-card">
                  <div className="fs-contact-icon">{c.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{c.title}</div>
                    <div style={{ fontSize: 14, color: "var(--fs-blue)" }}>{c.detail}</div>
                    <div style={{ fontSize: 12, color: "var(--fs-gray-400)" }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
            <h3 style={{ fontSize: 18 }}>Send a Message</h3>
            <div className="fs-form-group">
              <label className="fs-form-label">Name *</label>
              <input className="fs-form-input" placeholder="Your name" />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Email *</label>
              <input className="fs-form-input" type="email" placeholder="you@email.com" />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Subject</label>
              <select className="fs-form-select">
                <option>General Enquiry</option>
                <option>Selling My Aircraft</option>
                <option>Dealer Account</option>
                <option>Advertising</option>
                <option>Bug Report</option>
              </select>
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Message *</label>
              <textarea className="fs-form-textarea" placeholder="How can we help?" />
            </div>
            <button className="fs-form-submit">Send Message</button>
          </div>
        </div>
      </div>
    </section>
  </>
);

const LoginPage = ({ setPage, setUser }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('private'); // 'private' | 'dealer'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleAuth = async () => {
    setLoading(true);
    // In production, this would redirect to Google OAuth
    // For demo, simulate successful login
    setTimeout(() => {
      const mockUser = {
        id: 'google-123',
        email: 'demo@flightsales.com',
        full_name: 'Demo User',
        role: 'private',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
        created_at: new Date().toISOString()
      };
      setUser(mockUser);
      setPage('dashboard');
      setLoading(false);
    }, 1000);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Simulate auth
    setTimeout(() => {
      if (mode === 'login') {
        // Login simulation
        const mockUser = {
          id: 'user-123',
          email: email,
          full_name: email.split('@')[0],
          role: email.includes('dealer') ? 'dealer' : email.includes('admin') ? 'admin' : 'private',
          avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`,
          created_at: new Date().toISOString()
        };
        setUser(mockUser);
        setPage('dashboard');
      } else {
        // Registration simulation
        const mockUser = {
          id: 'user-new',
          email: email,
          full_name: fullName,
          role: accountType,
          phone: phone,
          avatar: `https://ui-avatars.com/api/?name=${fullName}&background=random`,
          created_at: new Date().toISOString()
        };
        setUser(mockUser);
        setPage('dashboard');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <section className="fs-section" style={{ minHeight: "70vh", display: "flex", alignItems: "center", padding: "32px 0" }}>
      <div className="fs-container" style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>
        {/* Back Button */}
        <button 
          onClick={() => setPage('home')}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 6, 
            fontSize: 14, 
            color: "var(--fs-gray-500)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 24,
            padding: "8px 0",
            transition: "color 0.15s ease"
          }}
          onMouseEnter={e => e.target.style.color = "var(--fs-gray-900)"}
          onMouseLeave={e => e.target.style.color = "var(--fs-gray-500)"}
        >
          <span style={{ fontSize: 12 }}>←</span> Back to home
        </button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ 
            width: 72, 
            height: 72, 
            borderRadius: "50%", 
            background: "var(--fs-gray-900)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "var(--fs-shadow-md)"
          }}>
            <span style={{ color: "white", fontSize: 32 }}>{mode === 'login' ? '👋' : '✈️'}</span>
          </div>
          <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 30, marginBottom: 8, fontWeight: 700 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 15, color: "var(--fs-gray-500)", lineHeight: 1.5 }}>
            {mode === 'login' ? 'Sign in to manage your listings and saved aircraft' : 'Join Flightsales to buy and sell aircraft across Australia'}
          </p>
        </div>

        <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-lg)", padding: "32px", borderRadius: "var(--fs-radius)", background: "white" }}>
          {/* Google Auth */}
          <button 
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "14px", 
              border: "1px solid var(--fs-gray-200)", 
              borderRadius: "var(--fs-radius-sm)", 
              background: "white", 
              fontSize: 15, 
              fontWeight: 600, 
              cursor: loading ? "not-allowed" : "pointer", 
              fontFamily: "var(--fs-font)", 
              marginBottom: 24, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 12,
              opacity: loading ? 0.6 : 1,
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={e => { if (!loading) { e.target.style.borderColor = "var(--fs-gray-400)"; e.target.style.background = "var(--fs-gray-50)"; }}}
            onMouseLeave={e => { e.target.style.borderColor = "var(--fs-gray-200)"; e.target.style.background = "white"; }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ 
                  width: 18, 
                  height: 18, 
                  border: "2px solid var(--fs-gray-300)", 
                  borderTopColor: "var(--fs-gray-600)", 
                  borderRadius: "50%", 
                  animation: "fs-spin 1s linear infinite",
                  display: "inline-block"
                }} />
                Connecting...
              </span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </>
            )}
          </button>

          <div style={{ textAlign: "center", color: "var(--fs-gray-400)", fontSize: 13, margin: "20px 0", position: "relative" }}>
            <span style={{ background: "white", padding: "0 12px", position: "relative", zIndex: 1 }}>or continue with email</span>
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--fs-gray-200)" }} />
          </div>

          {error && (
            <div className="fs-form-error" style={{ 
              padding: "12px 16px", 
              background: "#fef2f2", 
              borderRadius: "var(--fs-radius-sm)", 
              marginBottom: 20,
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <span style={{ color: "#dc2626", fontSize: 16 }}>⚠️</span>
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth}>
            {mode === 'register' && (
              <>
                <div className="fs-form-group">
                  <label className="fs-form-label">Account Type *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div
                      onClick={() => setAccountType('private')}
                      style={{ 
                        padding: "14px 12px", 
                        borderRadius: "var(--fs-radius-sm)",
                        border: accountType === 'private' ? "2px solid var(--fs-blue)" : "1px solid var(--fs-gray-200)",
                        background: accountType === 'private' ? "#eff6ff" : "white",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 20 }}>👤</span>
                      <span style={{ fontSize: 14, fontWeight: accountType === 'private' ? 600 : 400, color: accountType === 'private' ? "var(--fs-blue)" : "var(--fs-gray-700)" }}>
                        Private Seller
                      </span>
                      <span style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>Individual owner</span>
                    </div>
                    <div
                      onClick={() => setAccountType('dealer')}
                      style={{ 
                        padding: "14px 12px", 
                        borderRadius: "var(--fs-radius-sm)",
                        border: accountType === 'dealer' ? "2px solid var(--fs-blue)" : "1px solid var(--fs-gray-200)",
                        background: accountType === 'dealer' ? "#eff6ff" : "white",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 20 }}>🏢</span>
                      <span style={{ fontSize: 14, fontWeight: accountType === 'dealer' ? 600 : 400, color: accountType === 'dealer' ? "var(--fs-blue)" : "var(--fs-gray-700)" }}>
                        Dealer
                      </span>
                      <span style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>Business account</span>
                    </div>
                  </div>
                  <input type="hidden" name="accountType" value={accountType} />
                </div>

                <div className="fs-form-group">
                  <label className="fs-form-label">Full Name *</label>
                  <input 
                    className="fs-form-input" 
                    type="text" 
                    placeholder="John Smith"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required={mode === 'register'}
                    style={{ fontSize: 15 }}
                  />
                </div>

                <div className="fs-form-group">
                  <label className="fs-form-label">Phone Number</label>
                  <input 
                    className="fs-form-input" 
                    type="tel" 
                    placeholder="04XX XXX XXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ fontSize: 15 }}
                  />
                </div>
              </>
            )}

            <div className="fs-form-group">
              <label className="fs-form-label">Email *</label>
              <input 
                className="fs-form-input" 
                type="email" 
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ fontSize: 15 }}
              />
            </div>

            <div className="fs-form-group">
              <label className="fs-form-label">Password *</label>
              <input 
                className="fs-form-input" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? "current-password" : "new-password"}
                style={{ fontSize: 15 }}
              />
              {mode === 'register' && (
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ 
                    width: password.length >= 8 ? 8 : 8, 
                    height: 8, 
                    borderRadius: "50%", 
                    background: password.length >= 8 ? "#22c55e" : password.length > 0 ? "#f59e0b" : "#d1d5db",
                    transition: "all 0.2s"
                  }} />
                  <span style={{ fontSize: 11, color: password.length >= 8 ? "#22c55e" : password.length > 0 ? "#f59e0b" : "var(--fs-gray-400)" }}>
                    {password.length >= 8 ? "Password looks good" : password.length > 0 ? "At least 8 characters required" : "Must be at least 8 characters"}
                  </span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="fs-form-submit"
              disabled={loading || (mode === 'register' && password.length < 8)}
              style={{ 
                opacity: loading || (mode === 'register' && password.length < 8) ? 0.6 : 1,
                cursor: loading || (mode === 'register' && password.length < 8) ? "not-allowed" : "pointer",
                marginTop: 8
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ 
                    width: 16, 
                    height: 16, 
                    border: "2px solid rgba(255,255,255,0.3)", 
                    borderTopColor: "white", 
                    borderRadius: "50%", 
                    animation: "spin 1s linear infinite",
                    display: "inline-block"
                  }} />
                  Please wait...
                </span>
              ) : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p style={{ fontSize: 14, textAlign: "center", marginTop: 24, color: "var(--fs-gray-500)" }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setPassword('');
              }}
              style={{ 
                color: "var(--fs-blue)", 
                fontWeight: 600, 
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: "4px 8px",
                fontSize: 14,
                borderRadius: "var(--fs-radius-sm)",
                transition: "all 0.15s ease",
                marginLeft: 4
              }}
              onMouseEnter={e => e.target.style.background = "var(--fs-gray-100)"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          {mode === 'register' && (
            <p style={{ fontSize: 12, textAlign: "center", marginTop: 20, color: "var(--fs-gray-400)", lineHeight: 1.6, padding: "0 16px" }}>
              By creating an account, you agree to our <span style={{ color: "var(--fs-gray-600)", cursor: "pointer" }} onClick={() => setPage('terms')}>Terms of Service</span> and <span style={{ color: "var(--fs-gray-600)", cursor: "pointer" }} onClick={() => setPage('privacy')}>Privacy Policy</span>. 
              <br />Dealer accounts require verification before listings go live.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const DashboardPage = ({ user, setPage, setUser, savedIds, onSave }) => {
  if (!user) {
    setPage('login');
    return null;
  }

  const isDealer = user.role === 'dealer';
  const isAdmin = user.role === 'admin';

  if (isAdmin) {
    setPage('admin');
    return null;
  }

  const [activeTab, setActiveTab] = useState('listings');
  const [editProfile, setEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    location: user.location || ''
  });

  // Mock data for user's listings
  const myListings = [];
  
  // Mock enquiries received
  const myEnquiries = [
    { id: 1, aircraft: '2018 Cirrus SR22T', from: 'John Smith', email: 'john@email.com', phone: '0412 345 678', message: 'Is this aircraft still available? I would like to arrange an inspection.', date: '2026-03-22', status: 'new' },
  ];

  // Get saved aircraft from sample listings
  const savedAircraft = SAMPLE_LISTINGS.filter(l => savedIds.has(l.id));

  const handleLogout = () => {
    setUser(null);
    setPage('home');
  };

  const handleSaveProfile = () => {
    // In real app, save to backend
    setEditProfile(false);
  };

  return (
    <>
      <div className="fs-about-hero" style={{ padding: "48px 0" }}>
        <div className="fs-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img 
                src={user.avatar} 
                alt={user.full_name}
                style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid white" }}
              />
              <div>
                <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 32, marginBottom: 4 }}>
                  {user.full_name}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                  {isDealer ? 'Verified Dealer' : 'Private Seller'} • {user.email}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: "10px 20px", 
                background: "rgba(255,255,255,0.1)", 
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "var(--fs-radius-sm)",
                color: "white",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <section className="fs-section">
        <div className="fs-container">
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}>
            {/* Sidebar */}
            <div>
              <div className="fs-detail-specs" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)" }}>
                  <p style={{ fontSize: 12, color: "var(--fs-gray-500)", marginBottom: 4 }}>Account Type</p>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{isDealer ? 'Verified Dealer' : 'Private Seller'}</p>
                </div>
                
                <nav style={{ padding: "12px 0" }}>
                  {[
                    { id: 'listings', label: 'My Listings', icon: Icons.plane, count: myListings.length },
                    { id: 'saved', label: 'Saved Aircraft', icon: Icons.heart, count: savedAircraft.length },
                    { id: 'enquiries', label: 'Enquiries', icon: Icons.mail, count: myEnquiries.length },
                    { id: 'profile', label: 'Profile Settings', icon: Icons.user },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        width: "100%",
                        padding: "12px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: activeTab === item.id ? '#eff6ff' : 'none',
                        border: "none",
                        borderLeft: activeTab === item.id ? '3px solid var(--fs-blue)' : '3px solid transparent',
                        cursor: "pointer",
                        fontSize: 14,
                        color: activeTab === item.id ? "var(--fs-blue)" : "var(--fs-gray-700)",
                        fontWeight: activeTab === item.id ? 600 : 400,
                        textAlign: "left"
                      }}
                    >
                      <span style={{ color: activeTab === item.id ? "var(--fs-blue)" : "var(--fs-gray-400)" }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.count > 0 && (
                        <span style={{ 
                          background: 'var(--fs-blue)', 
                          color: 'white', 
                          fontSize: 11, 
                          padding: '2px 8px', 
                          borderRadius: 10 
                        }}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                <div style={{ padding: "16px 20px", borderTop: "1px solid var(--fs-gray-100)" }}>
                  <button 
                    className="fs-nav-btn-primary"
                    onClick={() => setPage('sell')}
                    style={{ width: "100%" }}
                  >
                    + List New Aircraft
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div>
              {/* MY LISTINGS TAB */}
              {activeTab === 'listings' && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                    <div className="fs-detail-specs" style={{ textAlign: "center", padding: "24px" }}>
                      <p style={{ fontSize: 32, fontWeight: 800, color: "var(--fs-blue)" }}>{myListings.length}</p>
                      <p style={{ fontSize: 13, color: "var(--fs-gray-500)" }}>Active Listings</p>
                    </div>
                    <div className="fs-detail-specs" style={{ textAlign: "center", padding: "24px" }}>
                      <p style={{ fontSize: 32, fontWeight: 800, color: "var(--fs-green)" }}>{myEnquiries.length}</p>
                      <p style={{ fontSize: 13, color: "var(--fs-gray-500)" }}>Enquiries</p>
                    </div>
                    <div className="fs-detail-specs" style={{ textAlign: "center", padding: "24px" }}>
                      <p style={{ fontSize: 32, fontWeight: 800, color: "var(--fs-gray-900)" }}>{savedAircraft.length}</p>
                      <p style={{ fontSize: 13, color: "var(--fs-gray-500)" }}>Saved</p>
                    </div>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "48px", textAlign: "center" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No active listings</h3>
                      <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 24 }}>
                        Get started by listing your first aircraft. It only takes a few minutes.
                      </p>
                      <button 
                        className="fs-nav-btn-primary"
                        onClick={() => setPage('sell')}
                      >
                        List Your Aircraft
                      </button>
                    </div>
                  ) : (
                    <div className="fs-grid">
                      {myListings.map(listing => (
                        <ListingCard key={listing.id} listing={listing} onClick={() => {}} onSave={onSave} saved={savedIds.has(listing.id)} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* SAVED AIRCRAFT TAB */}
              {activeTab === 'saved' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Saved Aircraft</h3>
                  {savedAircraft.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "48px", textAlign: "center" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>{Icons.heart}</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No saved aircraft</h3>
                      <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 24 }}>
                        Browse our listings and save aircraft you're interested in.
                      </p>
                      <button 
                        className="fs-nav-btn-primary"
                        onClick={() => setPage('buy')}
                      >
                        Browse Aircraft
                      </button>
                    </div>
                  ) : (
                    <div className="fs-grid">
                      {savedAircraft.map(listing => (
                        <ListingCard key={listing.id} listing={listing} onClick={() => {}} onSave={onSave} saved={true} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ENQUIRIES TAB */}
              {activeTab === 'enquiries' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Enquiries</h3>
                  {myEnquiries.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "48px", textAlign: "center" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>{Icons.mail}</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No enquiries yet</h3>
                      <p style={{ fontSize: 14, color: "var(--fs-gray-500)" }}>
                        When buyers contact you about your listings, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {myEnquiries.map(enquiry => (
                        <div key={enquiry.id} className="fs-detail-specs" style={{ padding: "20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{enquiry.aircraft}</h4>
                              <p style={{ fontSize: 13, color: "var(--fs-gray-500)" }}>From: {enquiry.from}</p>
                            </div>
                            <span style={{ 
                              padding: "4px 12px", 
                              borderRadius: 4, 
                              fontSize: 12,
                              background: enquiry.status === 'new' ? '#dcfce7' : '#f3f4f6',
                              color: enquiry.status === 'new' ? '#166534' : '#6b7280'
                            }}>
                              {enquiry.status === 'new' ? 'New' : 'Replied'}
                            </span>
                          </div>
                          <p style={{ fontSize: 14, color: "var(--fs-gray-700)", marginBottom: 16, lineHeight: 1.5 }}>
                            "{enquiry.message}"
                          </p>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "12px", background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius-sm)" }}>
                            <a href={`mailto:${enquiry.email}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fs-blue)" }}>
                              {Icons.mail} {enquiry.email}
                            </a>
                            <a href={`tel:${enquiry.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fs-blue)" }}>
                              {Icons.phone} {enquiry.phone}
                            </a>
                          </div>
                          <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 12 }}>
                            Received: {enquiry.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* PROFILE SETTINGS TAB */}
              {activeTab === 'profile' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Profile Settings</h3>
                  <div className="fs-detail-specs" style={{ padding: "24px" }}>
                    {!editProfile ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                          <img src={user.avatar} alt={user.full_name} style={{ width: 80, height: 80, borderRadius: "50%" }} />
                          <div>
                            <h4 style={{ fontSize: 18, fontWeight: 600 }}>{profileData.full_name}</h4>
                            <p style={{ fontSize: 14, color: "var(--fs-gray-500)" }}>{profileData.email}</p>
                          </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <span style={{ color: "var(--fs-gray-500)" }}>Phone</span>
                            <span>{profileData.phone || 'Not set'}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <span style={{ color: "var(--fs-gray-500)" }}>Location</span>
                            <span>{profileData.location || 'Not set'}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                            <span style={{ color: "var(--fs-gray-500)" }}>Account Type</span>
                            <span style={{ textTransform: "capitalize" }}>{user.role}</span>
                          </div>
                        </div>
                        <button 
                          className="fs-detail-cta fs-detail-cta-primary"
                          onClick={() => setEditProfile(true)}
                        >
                          Edit Profile
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Full Name</label>
                          <input 
                            className="fs-form-input" 
                            value={profileData.full_name}
                            onChange={e => setProfileData({...profileData, full_name: e.target.value})}
                          />
                        </div>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Email</label>
                          <input className="fs-form-input" value={profileData.email} disabled />
                        </div>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Phone</label>
                          <input 
                            className="fs-form-input" 
                            value={profileData.phone}
                            onChange={e => setProfileData({...profileData, phone: e.target.value})}
                            placeholder="04XX XXX XXX"
                          />
                        </div>
                        <div className="fs-form-group">
                          <label className="fs-form-label">Location</label>
                          <input 
                            className="fs-form-input" 
                            value={profileData.location}
                            onChange={e => setProfileData({...profileData, location: e.target.value})}
                            placeholder="e.g. Sydney, NSW"
                          />
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <button 
                            className="fs-form-submit"
                            onClick={handleSaveProfile}
                          >
                            Save Changes
                          </button>
                          <button 
                            className="fs-detail-cta fs-detail-cta-secondary"
                            onClick={() => setEditProfile(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const AdminPage = ({ user, setPage, setUser }) => {
  if (!user || user.role !== 'admin') {
    setPage('login');
    return null;
  }

  const [activeTab, setActiveTab] = useState('listings');

  const mockListings = [
    { id: 1, title: '2018 Cirrus SR22T', price: 895000, seller: 'Southern Aviation', status: 'pending', date: '2026-03-22' },
    { id: 2, title: '2005 Cessna 182T', price: 385000, seller: 'Private', status: 'active', date: '2026-03-21' },
  ];

  const mockUsers = [
    { id: 1, name: 'John Smith', email: 'john@example.com', role: 'private', listings: 2 },
    { id: 2, name: 'Southern Aviation', email: 'sales@southernav.com', role: 'dealer', listings: 14 },
  ];

  return (
    <>
      <div className="fs-about-hero" style={{ padding: "32px 0", background: "#1a1a1a" }}>
        <div className="fs-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                background: "var(--fs-red)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: 20
              }}>
                {Icons.shield}
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 24, marginBottom: 4 }}>
                  Admin Dashboard
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                  Manage listings, users, and platform settings
                </p>
              </div>
            </div>
            <button 
              onClick={() => { setUser(null); setPage('home'); }}
              style={{ 
                padding: "8px 16px", 
                background: "rgba(255,255,255,0.1)", 
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "var(--fs-radius-sm)",
                color: "white",
                cursor: "pointer",
                fontSize: 13
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <section className="fs-section" style={{ padding: "32px 0" }}>
        <div className="fs-container">
          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Listings', value: '156', color: 'var(--fs-blue)' },
              { label: 'Pending Review', value: '12', color: 'var(--fs-amber)' },
              { label: 'Active Users', value: '89', color: 'var(--fs-green)' },
              { label: 'Dealers', value: '24', color: 'var(--fs-gray-900)' },
            ].map(stat => (
              <div key={stat.label} className="fs-detail-specs" style={{ padding: "20px" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: "var(--fs-gray-500)" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--fs-gray-200)" }}>
            {[
              { id: 'listings', label: 'Listings' },
              { id: 'users', label: 'Users' },
              { id: 'dealers', label: 'Dealer Applications' },
              { id: 'enquiries', label: 'Enquiries' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid var(--fs-blue)" : "2px solid transparent",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? "var(--fs-blue)" : "var(--fs-gray-500)"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="fs-detail-specs" style={{ padding: 0 }}>
            {activeTab === 'listings' && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--fs-gray-200)" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Aircraft</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Price</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Seller</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockListings.map(listing => (
                    <tr key={listing.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                      <td style={{ padding: "16px", fontWeight: 500 }}>{listing.title}</td>
                      <td style={{ padding: "16px" }}>${listing.price.toLocaleString()}</td>
                      <td style={{ padding: "16px", color: "var(--fs-gray-600)" }}>{listing.seller}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          padding: "4px 12px", 
                          borderRadius: 4, 
                          fontSize: 12, 
                          fontWeight: 500,
                          background: listing.status === 'active' ? '#dcfce7' : '#fef3c7',
                          color: listing.status === 'active' ? '#166534' : '#92400e'
                        }}>
                          {listing.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <button style={{ 
                          padding: "6px 12px", 
                          background: "var(--fs-blue)", 
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer"
                        }}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'users' && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--fs-gray-200)" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>User</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Role</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Listings</th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                      <td style={{ padding: "16px" }}>
                        <p style={{ fontWeight: 500 }}>{u.name}</p>
                        <p style={{ fontSize: 12, color: "var(--fs-gray-500)" }}>{u.email}</p>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          padding: "4px 12px", 
                          borderRadius: 4, 
                          fontSize: 12,
                          background: u.role === 'dealer' ? '#eff6ff' : '#f3f4f6',
                          color: u.role === 'dealer' ? 'var(--fs-blue)' : 'var(--fs-gray-600)',
                          textTransform: "capitalize"
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>{u.listings}</td>
                      <td style={{ padding: "16px" }}>
                        <button style={{ 
                          padding: "6px 12px", 
                          background: "var(--fs-gray-100)", 
                          color: "var(--fs-gray-700)",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer"
                        }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'dealers' && (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <p style={{ color: "var(--fs-gray-500)" }}>No pending dealer applications</p>
              </div>
            )}

            {activeTab === 'enquiries' && (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <p style={{ color: "var(--fs-gray-500)" }}>No new enquiries</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

// --- APP ---
export default function FlightSalesApp() {
  const [page, setPage] = useState("home");
  const [selectedListing, setSelectedListingRaw] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null); // null = not logged in, object = logged in

  const setSelectedListing = (l) => {
    setSelectedListingRaw(l);
    setPage("detail");
    window.scrollTo(0, 0);
  };
  
  const setPageWrap = (p) => {
    setPage(p);
    setSelectedListingRaw(null);
    setMobileOpen(false);
    window.scrollTo(0, 0);
  };

  const onSave = (id) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setToast("Removed from watchlist"); }
      else { next.add(id); setToast("Added to watchlist"); }
      return next;
    });
  };

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }
  }, [toast]);

  return (
    <>
      <style>{STYLES}</style>
      <Nav page={page} setPage={setPageWrap} setMobileOpen={setMobileOpen} mobileOpen={mobileOpen} user={user} />
      
      {page === "home" && <HomePage setPage={setPageWrap} setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} />}
      {page === "buy" && <BuyPage setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} />}
      {page === "detail" && <ListingDetail listing={selectedListing} onBack={() => setPageWrap("buy")} savedIds={savedIds} onSave={onSave} user={user} />}
      {page === "sell" && <SellPage user={user} setPage={setPageWrap} />}
      {page === "dealers" && <DealersPage />}
      {page === "finance" && <FinancePage />}
      {page === "valuate" && <ValuatePage />}
      {page === "news" && <NewsPage />}
      {page === "about" && <AboutPage />}
      {page === "contact" && <ContactPage />}
      {page === "login" && <LoginPage setPage={setPageWrap} setUser={setUser} />}
      {page === "dashboard" && <DashboardPage user={user} setPage={setPageWrap} setUser={setUser} savedIds={savedIds} onSave={onSave} />}
      {page === "admin" && <AdminPage user={user} setPage={setPageWrap} setUser={setUser} />}
      
      <Footer setPage={setPageWrap} />
      
      {toast && (
        <div className="fs-toast">
          {Icons.check} {toast}
        </div>
      )}
    </>
  );
}
