import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  useAuth, useProfile, useAircraft, useFeaturedAircraft, useLatestAircraft,
  useDealers, useNews, useSavedAircraft, useMyListings, useMyEnquiries,
  submitEnquiry, createListing, uploadImage
} from "../lib/hooks";

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
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
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
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  alert: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  tag: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  gift: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
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

// --- AIRCRAFT IMAGE COMPONENT ---
const isJustListed = (listing) => {
  const d = listing.created_at || listing.created;
  if (!d) return false;
  return (Date.now() - new Date(d).getTime()) < 7 * 86400000;
};

const AircraftImage = ({ listing, className = "", size = "md", style = {}, showGallery = false }) => {
  const heights = { sm: "140px", md: "220px", lg: "400px", full: "100%" };
  const [imgIdx, setImgIdx] = useState(0);
  const seed = typeof listing.id === 'number' ? listing.id : (listing.id?.charCodeAt(0) % 12) + 1;
  const fallback = AIRCRAFT_IMAGES[seed] || AIRCRAFT_IMAGES[1];
  const images = (listing.images && listing.images.length > 0) ? listing.images : [fallback];
  const imageUrl = images[imgIdx] || images[0];
  const imgCount = images.length;

  return (
    <div className={className} style={{
      height: heights[size], position: "relative", overflow: "hidden",
      borderRadius: style.borderRadius || 0, background: '#1a1a1a', ...style
    }}>
      <img
        src={imageUrl}
        alt={listing.title}
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
        onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#000'; }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />

      {/* Badges — top left */}
      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        {listing.featured && (
          <div style={{ background: "#000", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Featured</div>
        )}
        {isJustListed(listing) && (
          <div style={{ background: "#10b981", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Just Listed</div>
        )}
        {listing.ifr && (
          <div style={{ background: "#2563eb", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px" }}>IFR</div>
        )}
      </div>

      {/* Photo nav arrows — only in gallery mode */}
      {showGallery && imgCount > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + imgCount) % imgCount); }}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>‹</button>
          <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % imgCount); }}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>›</button>
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
            {images.map((_, i) => <div key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }} style={{ width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />)}
          </div>
        </>
      )}

      {/* Photo count — bottom right */}
      {!showGallery && imgCount > 0 && (
        <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.65)", color: "white", fontSize: "11px", padding: "3px 8px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px", backdropFilter: "blur(4px)" }}>
          {Icons.camera} {imgCount}
        </div>
      )}
    </div>
  );
};

// --- CSS ---
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800;9..144,900&display=swap');

:root {
  /* Refined ink palette */
  --fs-navy: #0A0A0F;
  --fs-navy-light: #1C1C24;
  --fs-blue: #1F46E5;
  --fs-blue-light: #1739C7;
  --fs-sky: #3D7FFF;
  --fs-amber: #F59E0B;
  --fs-green: #10B981;
  --fs-red: #EF4444;
  --fs-bg: #FCFCFC;
  --fs-white: #FFFFFF;
  --fs-gray-50: #FAFAFA;
  --fs-gray-100: #F4F4F5;
  --fs-gray-200: #E4E4E7;
  --fs-gray-300: #D4D4D8;
  --fs-gray-400: #A1A1AA;
  --fs-gray-500: #71717A;
  --fs-gray-600: #52525B;
  --fs-gray-700: #3F3F46;
  --fs-gray-800: #27272A;
  --fs-gray-900: #18181B;
  /* Elevation system */
  --fs-radius: 14px;
  --fs-radius-sm: 10px;
  --fs-radius-lg: 20px;
  --fs-radius-xl: 28px;
  --fs-shadow-xs: 0 1px 2px rgba(15, 15, 25, 0.04);
  --fs-shadow: 0 2px 6px rgba(15, 15, 25, 0.04), 0 1px 2px rgba(15, 15, 25, 0.03);
  --fs-shadow-md: 0 8px 24px rgba(15, 15, 25, 0.06), 0 2px 6px rgba(15, 15, 25, 0.04);
  --fs-shadow-lg: 0 24px 48px rgba(15, 15, 25, 0.08), 0 8px 16px rgba(15, 15, 25, 0.05);
  --fs-shadow-xl: 0 32px 64px rgba(15, 15, 25, 0.12);
  --fs-font: 'Inter', system-ui, -apple-system, sans-serif;
  --fs-font-serif: 'Fraunces', Georgia, serif;
  --fs-max-w: 1280px;
  --fs-section-y: 120px;
  --fs-section-y-mobile: 72px;
  /* Easings */
  --fs-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --fs-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

* { margin: 0; padding: 0; box-sizing: border-box; }
*::selection { background: var(--fs-navy); color: #fff; }

html { scroll-behavior: smooth; }

body, #root {
  font-family: var(--fs-font);
  color: var(--fs-gray-900);
  background: var(--fs-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
  font-feature-settings: 'cv11', 'ss01', 'ss03';
}

a { color: inherit; text-decoration: none; }

.fs-container { max-width: var(--fs-max-w); margin: 0 auto; padding: 0 32px; }
@media (max-width: 640px) { .fs-container { padding: 0 20px; } }

/* Scroll-in animations */
@keyframes fs-fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fs-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fs-scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.fs-anim-fade-up { animation: fs-fade-up 0.7s var(--fs-ease-out) backwards; }
.fs-anim-fade-in { animation: fs-fade-in 0.8s var(--fs-ease-out) backwards; }
.fs-anim-scale-in { animation: fs-scale-in 0.6s var(--fs-ease-out) backwards; }

/* NAV — refined glass effect */
.fs-nav {
  background: rgba(252, 252, 252, 0.85);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  position: sticky; top: 0; z-index: 100;
  border-bottom: 1px solid rgba(228, 228, 231, 0.6);
}
.fs-nav-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 72px; gap: 40px;
}
.fs-nav-logo {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; flex-shrink: 0;
}
.fs-nav-logo-text {
  font-family: var(--fs-font-serif);
  font-size: 22px; color: var(--fs-navy); letter-spacing: -0.02em; font-weight: 700;
}
.fs-nav-logo-text span { color: var(--fs-gray-400); font-style: italic; }
.fs-nav-links { display: flex; gap: 2px; align-items: center; }
.fs-nav-link {
  color: var(--fs-gray-600); font-size: 14px; font-weight: 500;
  padding: 9px 16px; border-radius: 100px;
  cursor: pointer; transition: all 0.2s var(--fs-ease-out); border: none; background: none;
  white-space: nowrap;
}
.fs-nav-link:hover { color: var(--fs-navy); background: var(--fs-gray-100); }
.fs-nav-link.active { color: var(--fs-navy); background: var(--fs-gray-100); font-weight: 600; }
.fs-nav-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.fs-nav-btn {
  padding: 10px 20px; border-radius: 100px;
  font-size: 13.5px; font-weight: 600; cursor: pointer;
  transition: all 0.2s var(--fs-ease-out); border: none; font-family: var(--fs-font);
  letter-spacing: -0.01em;
}
.fs-nav-btn-ghost { background: transparent; color: var(--fs-gray-700); }
.fs-nav-btn-ghost:hover { color: var(--fs-navy); background: var(--fs-gray-100); }
.fs-nav-btn-primary {
  background: var(--fs-navy); color: white;
  box-shadow: 0 1px 2px rgba(15,15,25,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
}
.fs-nav-btn-primary:hover { background: #1c1c24; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(15,15,25,0.15); }
.fs-nav-mobile-toggle {
  display: none; background: none; border: none; color: var(--fs-navy); cursor: pointer;
  padding: 8px; border-radius: 8px;
}
.fs-nav-mobile-toggle:hover { background: var(--fs-gray-100); }
@media (max-width: 900px) {
  .fs-nav-inner { height: 64px; }
  .fs-nav-links, .fs-nav-actions { display: none; }
  .fs-nav-mobile-toggle { display: flex; }
  .fs-nav-links.open, .fs-nav-actions.open {
    display: flex; flex-direction: column; gap: 4px;
    position: absolute; top: 64px; left: 0; right: 0;
    background: var(--fs-white); padding: 20px 24px;
    border-bottom: 1px solid var(--fs-gray-200);
    box-shadow: var(--fs-shadow-lg);
  }
  .fs-nav-link { padding: 12px 16px; text-align: left; }
}

/* HERO — premium light surface */
.fs-hero {
  background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%);
  padding: 96px 0 88px; position: relative; overflow: hidden;
}
.fs-hero::before {
  content: '';
  position: absolute; inset: 0;
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(31, 70, 229, 0.06), transparent 60%),
    radial-gradient(ellipse 50% 30% at 100% 100%, rgba(31, 70, 229, 0.04), transparent 60%);
  pointer-events: none;
}
.fs-hero-content { position: relative; z-index: 1; text-align: center; }
.fs-hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--fs-white); border: 1px solid var(--fs-gray-200);
  padding: 7px 16px; border-radius: 100px;
  font-size: 12.5px; font-weight: 600; color: var(--fs-gray-700);
  margin-bottom: 28px; box-shadow: var(--fs-shadow-xs);
  letter-spacing: -0.01em;
}
.fs-hero-eyebrow-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--fs-green);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
}
.fs-hero h1 {
  font-family: var(--fs-font-serif);
  font-size: clamp(48px, 8vw, 96px);
  color: var(--fs-navy);
  line-height: 0.96; margin-bottom: 24px; font-weight: 500;
  letter-spacing: -0.04em;
}
.fs-hero h1 em {
  font-style: italic; font-weight: 400; color: var(--fs-navy);
  font-feature-settings: "ss01";
}
.fs-hero-sub {
  color: var(--fs-gray-600); font-size: 19px; margin-bottom: 44px;
  max-width: 560px; margin-left: auto; margin-right: auto;
  font-weight: 400; line-height: 1.55; letter-spacing: -0.01em;
}
@media (max-width: 640px) {
  .fs-hero { padding: 56px 0 56px; }
  .fs-hero h1 { font-size: 44px; line-height: 1; margin-bottom: 16px; }
  .fs-hero-sub { font-size: 16px; margin-bottom: 28px; }
  .fs-hero-eyebrow { margin-bottom: 20px; font-size: 12px; }
}

/* SEARCH BAR — premium pill */
.fs-search-bar {
  background: var(--fs-white); border-radius: 24px;
  box-shadow: var(--fs-shadow-lg);
  border: 1px solid var(--fs-gray-200);
  display: flex; flex-direction: column; padding: 0;
  max-width: 760px; margin: 0 auto; overflow: hidden;
  transition: box-shadow 0.3s var(--fs-ease-out), transform 0.3s var(--fs-ease-out);
}
.fs-search-bar:focus-within {
  box-shadow: var(--fs-shadow-xl);
  border-color: var(--fs-gray-300);
  transform: translateY(-2px);
}
.fs-search-ai {
  display: flex; align-items: center; gap: 14px; padding: 18px 22px;
  border-bottom: 1px solid var(--fs-gray-100);
}
.fs-search-ai-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, var(--fs-navy) 0%, #1c1c24 100%);
  color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(15,15,25,0.15);
}
.fs-search-ai-input {
  flex: 1; border: none; outline: none; font-size: 16px; font-weight: 500;
  color: var(--fs-navy); background: transparent; font-family: var(--fs-font);
  letter-spacing: -0.01em;
}
.fs-search-ai-input::placeholder { color: var(--fs-gray-400); font-weight: 400; }
.fs-search-fields-row { display: flex; align-items: stretch; }
.fs-search-field {
  flex: 1; display: flex; flex-direction: column; padding: 14px 20px;
  border-right: 1px solid var(--fs-gray-100); min-width: 0;
  transition: background 0.2s;
}
.fs-search-field:hover { background: var(--fs-gray-50); }
.fs-search-field:last-of-type { border-right: none; }
.fs-search-label {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; color: var(--fs-gray-400); margin-bottom: 4px;
}
.fs-search-input, .fs-search-select {
  border: none; outline: none; font-size: 14px; font-weight: 500;
  color: var(--fs-navy); background: transparent;
  font-family: var(--fs-font); width: 100%; cursor: pointer;
  letter-spacing: -0.01em;
}
.fs-search-select { appearance: none; padding-right: 16px; }
.fs-search-btn {
  background: var(--fs-navy); color: white; border: none;
  padding: 16px 32px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; gap: 10px;
  font-size: 14.5px; font-weight: 600; font-family: var(--fs-font);
  transition: all 0.2s var(--fs-ease-out); flex-shrink: 0;
  margin: 14px 18px 18px; border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15,15,25,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
  letter-spacing: -0.01em;
}
.fs-search-btn:hover {
  background: #1c1c24; transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15,15,25,0.18);
}
.fs-search-btn:active { transform: translateY(0); }
@media (max-width: 700px) {
  .fs-search-bar { border-radius: 20px; }
  .fs-search-fields-row { flex-direction: column; }
  .fs-search-field { border-right: none; border-bottom: 1px solid var(--fs-gray-100); padding: 12px 20px; }
  .fs-search-btn { margin: 12px 14px 14px; padding: 14px 24px; }
}

/* STATS BAR — refined */
.fs-stats {
  display: flex; justify-content: center; gap: 56px;
  margin-top: 56px; flex-wrap: wrap;
  padding-top: 32px; border-top: 1px solid var(--fs-gray-100);
  max-width: 600px; margin-left: auto; margin-right: auto;
}
.fs-stat { text-align: center; }
.fs-stat-num {
  color: var(--fs-navy); font-size: 36px; font-weight: 700;
  line-height: 1; letter-spacing: -0.03em;
  font-family: var(--fs-font-serif);
}
.fs-stat-label {
  color: var(--fs-gray-500); font-size: 12.5px; font-weight: 500;
  margin-top: 6px; letter-spacing: 0.02em;
}
@media (max-width: 640px) { .fs-stats { gap: 32px; margin-top: 40px; } .fs-stat-num { font-size: 28px; } }

/* SECTION — generous breathing room */
.fs-section { padding: var(--fs-section-y) 0; }
.fs-section-alt { background: var(--fs-gray-50); }
@media (max-width: 900px) { .fs-section { padding: var(--fs-section-y-mobile) 0; } }

.fs-section-header {
  display: flex; justify-content: space-between; align-items: end;
  margin-bottom: 48px; flex-wrap: wrap; gap: 16px;
}
.fs-section-title {
  font-family: var(--fs-font-serif);
  font-size: clamp(32px, 4.5vw, 52px); font-weight: 500;
  line-height: 1.05; letter-spacing: -0.03em; color: var(--fs-navy);
}
.fs-section-title em { font-style: italic; font-weight: 400; }
.fs-section-sub {
  color: var(--fs-gray-500); font-size: 15px; margin-top: 8px;
  font-weight: 400; max-width: 480px; line-height: 1.55;
}
.fs-section-link {
  font-size: 14px; font-weight: 600; color: var(--fs-navy);
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  transition: gap 0.2s var(--fs-ease-out); padding: 10px 18px;
  border-radius: 100px; border: 1px solid var(--fs-gray-200);
  background: var(--fs-white);
}
.fs-section-link:hover {
  gap: 10px; background: var(--fs-navy); color: var(--fs-white);
  border-color: var(--fs-navy);
}
@media (max-width: 640px) { .fs-section-header { margin-bottom: 32px; } }

/* LISTING CARD — refined elevation */
.fs-card {
  background: var(--fs-white); border-radius: var(--fs-radius-lg);
  overflow: hidden; box-shadow: var(--fs-shadow);
  transition: box-shadow 0.4s var(--fs-ease-out), transform 0.4s var(--fs-ease-out);
  cursor: pointer;
  border: 1px solid var(--fs-gray-100);
  display: flex; flex-direction: column;
}
.fs-card:hover {
  box-shadow: var(--fs-shadow-lg);
  transform: translateY(-4px);
  border-color: var(--fs-gray-200);
}
.fs-card:hover img { transform: scale(1.05); }
.fs-card-body { padding: 20px 22px; flex: 1; }
.fs-card-title {
  font-family: var(--fs-font-serif);
  font-size: 18px; font-weight: 500; margin-bottom: 6px;
  line-height: 1.25; letter-spacing: -0.01em;
  color: var(--fs-navy);
  display: -webkit-box; -webkit-line-clamp: 1;
  -webkit-box-orient: vertical; overflow: hidden;
}
.fs-card-price {
  font-size: 26px; font-weight: 700; color: var(--fs-navy);
  margin-bottom: 14px; letter-spacing: -0.025em;
  font-feature-settings: "tnum";
}
.fs-card-meta {
  display: flex; flex-wrap: wrap; gap: 14px;
  font-size: 12.5px; color: var(--fs-gray-500); font-weight: 500;
}
.fs-card-meta-item { display: flex; align-items: center; gap: 5px; }
.fs-card-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 22px; border-top: 1px solid var(--fs-gray-100);
  font-size: 12px; color: var(--fs-gray-500);
  background: var(--fs-gray-50);
}
.fs-card-dealer {
  font-size: 11px; color: var(--fs-gray-700); font-weight: 700;
  display: flex; align-items: center; gap: 5px;
  margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;
}

/* LISTING GRID — refined spacing */
.fs-grid {
  display: grid; gap: 28px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}
.fs-grid > * {
  animation: fs-fade-up 0.6s var(--fs-ease-out) backwards;
}
.fs-grid > *:nth-child(1) { animation-delay: 0ms; }
.fs-grid > *:nth-child(2) { animation-delay: 60ms; }
.fs-grid > *:nth-child(3) { animation-delay: 120ms; }
.fs-grid > *:nth-child(4) { animation-delay: 180ms; }
.fs-grid > *:nth-child(5) { animation-delay: 240ms; }
.fs-grid > *:nth-child(6) { animation-delay: 300ms; }
.fs-grid > *:nth-child(7) { animation-delay: 360ms; }
.fs-grid > *:nth-child(8) { animation-delay: 420ms; }
@media (max-width: 640px) {
  .fs-grid { grid-template-columns: 1fr; gap: 20px; }
}

/* CATEGORY PILLS — refined */
.fs-categories {
  display: flex; gap: 10px; flex-wrap: wrap;
  justify-content: center; margin-top: 32px;
}
.fs-cat-pill {
  background: var(--fs-white); border: 1px solid var(--fs-gray-200);
  color: var(--fs-gray-700); border-radius: 100px;
  padding: 9px 20px; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s var(--fs-ease-out);
  font-family: var(--fs-font); letter-spacing: -0.005em;
  box-shadow: var(--fs-shadow-xs);
}
.fs-cat-pill:hover {
  background: var(--fs-navy); color: white;
  border-color: var(--fs-navy); transform: translateY(-1px);
  box-shadow: var(--fs-shadow-md);
}

/* DEALER CARD — premium */
.fs-dealer-card {
  background: var(--fs-white); border-radius: var(--fs-radius-lg);
  padding: 28px; box-shadow: var(--fs-shadow);
  transition: all 0.3s var(--fs-ease-out); cursor: pointer;
  display: flex; gap: 18px; align-items: center;
  border: 1px solid var(--fs-gray-100);
}
.fs-dealer-card:hover {
  box-shadow: var(--fs-shadow-lg);
  transform: translateY(-3px);
  border-color: var(--fs-gray-200);
}
.fs-dealer-avatar {
  width: 56px; height: 56px; border-radius: 14px;
  background: linear-gradient(135deg, var(--fs-navy) 0%, #1c1c24 100%);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(15,15,25,0.18);
  letter-spacing: -0.02em;
}
.fs-dealer-info { flex: 1; min-width: 0; }
.fs-dealer-name {
  font-family: var(--fs-font-serif);
  font-size: 17px; font-weight: 500; margin-bottom: 4px; letter-spacing: -0.01em;
  color: var(--fs-navy);
}
.fs-dealer-loc { font-size: 13px; color: var(--fs-gray-500); display: flex; align-items: center; gap: 5px; }
.fs-dealer-stats { display: flex; gap: 16px; margin-top: 10px; font-size: 12.5px; color: var(--fs-gray-500); font-weight: 500; }
.fs-dealer-rating { color: var(--fs-amber); display: flex; align-items: center; gap: 4px; font-weight: 600; }

/* NEWS — editorial style */
.fs-news-card {
  background: var(--fs-white); border-radius: var(--fs-radius-lg);
  padding: 28px; box-shadow: var(--fs-shadow); cursor: pointer;
  transition: all 0.3s var(--fs-ease-out);
  border: 1px solid var(--fs-gray-100);
}
.fs-news-card:hover {
  box-shadow: var(--fs-shadow-lg);
  transform: translateY(-3px);
  border-color: var(--fs-gray-200);
}
.fs-news-tag {
  display: inline-block; font-size: 10.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.6px;
  padding: 4px 10px; border-radius: 6px; margin-bottom: 14px;
}
.fs-news-tag.regulation { background: #F3E8FF; color: #7C3AED; }
.fs-news-tag.market { background: #D1FAE5; color: #059669; }
.fs-news-tag.industry { background: #DBEAFE; color: #1F46E5; }
.fs-news-tag.infrastructure { background: #FEF3C7; color: #D97706; }
.fs-news-title {
  font-family: var(--fs-font-serif);
  font-size: 19px; font-weight: 500; margin-bottom: 10px;
  line-height: 1.3; color: var(--fs-navy); letter-spacing: -0.015em;
}
.fs-news-excerpt {
  font-size: 14px; color: var(--fs-gray-600);
  line-height: 1.65; margin-bottom: 16px;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.fs-news-footer {
  font-size: 12.5px; color: var(--fs-gray-400);
  display: flex; gap: 14px; padding-top: 14px;
  border-top: 1px solid var(--fs-gray-100);
}

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
.fs-detail-sticky {
  position: sticky; top: 88px;
}
.fs-detail-mobile-cta {
  display: none;
}
@media (max-width: 900px) {
  .fs-detail-sticky { position: static; }
  .fs-detail-mobile-cta { display: block; margin-bottom: 24px; }
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
@keyframes fs-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes fs-spin {
  to { transform: rotate(360deg); }
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
        {[["buy", "Buy"], ["sell", "Sell"], ["dealers", "Dealers"], ["news", "News"]].map(([p, label]) => (
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
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'U')}&background=0a0a0a&color=fff`}
                alt={user.full_name || user.email}
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
          {[["sell", "Sell Your Aircraft"], ["dealers", "Dealer Portal"]].map(([p, t]) => (
            <span key={t} className="fs-footer-link" onClick={() => setPage(p)}>{t}</span>
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

const ListingCard = ({ listing, onClick, onSave, saved }) => {
  const dealerName = listing.dealer?.name || (typeof listing.dealer === 'string' ? listing.dealer : null);
  const isNew = isJustListed(listing);
  return (
    <div className="fs-card" onClick={() => onClick(listing)}>
      <AircraftImage listing={listing} />
      <div className="fs-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {dealerName && <div className="fs-card-dealer">{Icons.shield} {dealerName}</div>}
            <div className="fs-card-title">{listing.title}</div>
          </div>
          {listing.year && <div style={{ fontSize: 11, color: "var(--fs-gray-400)", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8, paddingTop: 2 }}>{listing.year}</div>}
        </div>
        <div className="fs-card-price">{formatPriceFull(listing.price)}</div>
        <div className="fs-card-meta">
          {listing.ttaf != null && <span className="fs-card-meta-item">{Icons.clock} {formatHours(listing.ttaf)} TT</span>}
          {listing.eng_hours != null && <span className="fs-card-meta-item">{Icons.gauge} {formatHours(listing.eng_hours)} SMOH</span>}
          {(listing.city || listing.state) && <span className="fs-card-meta-item">{Icons.location} {[listing.city, listing.state].filter(Boolean).join(', ')}</span>}
        </div>
        {listing.avionics && <div style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 6, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{listing.avionics}</div>}
      </div>
      <div className="fs-card-footer">
        <span style={{ color: isNew ? "var(--fs-green)" : undefined, fontWeight: isNew ? 600 : undefined }}>
          {isNew ? "Just listed" : timeAgo(listing.created_at || listing.created)}
        </span>
        <span onClick={e => { e.stopPropagation(); onSave(listing.id); }} style={{ cursor: "pointer", color: saved ? "var(--fs-red)" : "var(--fs-gray-400)", fontSize: 16 }}>
          {saved ? Icons.heartFull : Icons.heart}
        </span>
      </div>
    </div>
  );
};

const EnquiryModal = ({ listing, onClose, user }) => {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: `Hi, I'm interested in the ${listing.title}${listing.rego ? ` (${listing.rego})` : ''}. Is it available for an inspection?`,
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
            Your enquiry about the {listing.title} has been sent to the seller. They should respond within 24 hours.
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
        
        <div className="fs-modal-body">
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
              {sendError && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--fs-radius-sm)", marginBottom: 12, fontSize: 13, color: "#dc2626" }}>
                  {sendError}
                </div>
              )}
              <button
                className="fs-form-submit"
                disabled={sending}
                style={{ opacity: sending ? 0.7 : 1, cursor: sending ? "not-allowed" : "pointer" }}
                onClick={async () => {
                  if (!formData.name || !formData.email || !formData.message) {
                    setSendError("Please fill in your name, email, and message.");
                    return;
                  }
                  setSending(true);
                  setSendError(null);
                  try {
                    await submitEnquiry(listing.id, formData);
                    setSent(true);
                  } catch (err) {
                    setSendError(err.message || "Failed to send enquiry. Please try again.");
                  } finally {
                    setSending(false);
                  }
                }}
              >
                {sending ? "Sending..." : "Send Enquiry"}
              </button>
              <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 16, textAlign: "center" }}>
                By submitting, you agree to our Terms and Privacy Policy. Your details will be shared with the seller.
              </p>
        </div>
      </div>
    </div>
  );
};

// --- PAGES ---
const HomePage = ({ setPage, setSelectedListing, savedIds, onSave, setSearchFilters }) => {
  const [searchCat, setSearchCat] = useState("");
  const [searchMake, setSearchMake] = useState("");
  const [searchState, setSearchState] = useState("");
  const [aiQuery, setAiQuery] = useState("");

  const { aircraft: featuredFromDB, loading: featuredLoading } = useFeaturedAircraft();
  const { aircraft: latestFromDB, loading: latestLoading } = useLatestAircraft();
  const { dealers: dealersFromDB } = useDealers();
  const { articles: newsFromDB } = useNews(3);
  const { total: totalListings } = useAircraft({});

  const featured = featuredFromDB.length > 0 ? featuredFromDB : SAMPLE_LISTINGS.filter(l => l.featured).slice(0, 4);
  const latest = latestFromDB.length > 0 ? latestFromDB : [...SAMPLE_LISTINGS].sort((a, b) => new Date(b.created_at || b.created) - new Date(a.created_at || a.created)).slice(0, 4);
  const displayDealers = dealersFromDB.length > 0 ? dealersFromDB : DEALERS;
  const displayNews = newsFromDB.length > 0 ? newsFromDB : NEWS_ARTICLES;

  // Parse AI search query and extract filters
  const parseAiQuery = (query) => {
    const q = query.toLowerCase().trim();
    const filters = {
      cat: "",
      make: "",
      state: "",
      minPrice: "",
      maxPrice: "",
      maxHours: "",
      ifrOnly: false,
      glassOnly: false,
      cond: "",
      query: query
    };

    // Location / State
    if (/\b(vic|victoria|melbourne)\b/.test(q)) filters.state = "VIC";
    else if (/\b(nsw|new south wales|sydney)\b/.test(q)) filters.state = "NSW";
    else if (/\b(qld|queensland|brisbane)\b/.test(q)) filters.state = "QLD";
    else if (/\b(wa|western australia|perth)\b/.test(q)) filters.state = "WA";
    else if (/\b(sa|south australia|adelaide)\b/.test(q)) filters.state = "SA";
    else if (/\b(tas|tasmania|hobart)\b/.test(q)) filters.state = "TAS";
    else if (/\b(nt|northern territory|darwin)\b/.test(q)) filters.state = "NT";
    else if (/\b(act|canberra)\b/.test(q)) filters.state = "ACT";

    // Manufacturer
    if (/\b(cessna|182|172|152|206)\b/.test(q)) filters.make = "Cessna";
    else if (/\b(cirrus|sr22|sr20)\b/.test(q)) filters.make = "Cirrus";
    else if (/\b(piper|pa-28|pa28|archer|warrior)\b/.test(q)) filters.make = "Piper";
    else if (/\b(diamond|da40|da42)\b/.test(q)) filters.make = "Diamond";
    else if (/\b(robinson|r44|r22)\b/.test(q)) filters.make = "Robinson";
    else if (/\b(sling|tsi)\b/.test(q)) filters.make = "Sling";
    else if (/\b(pilatus|pc-12|pc12)\b/.test(q)) filters.make = "Pilatus";
    else if (/\b(beech|beechcraft|baron|bonanza)\b/.test(q)) filters.make = "Beechcraft";
    else if (/\b(jabiru)\b/.test(q)) filters.make = "Jabiru";
    else if (/\b(mooney)\b/.test(q)) filters.make = "Mooney";
    else if (/\b(tecnama?)\b/.test(q)) filters.make = "Tecnam";
    else if (/\b(bristell)\b/.test(q)) filters.make = "BRM Aero";
    else if (/\b(pipistrel)\b/.test(q)) filters.make = "Pipistrel";

    // Category
    if (/\b(helicopter|heli|chopper|rotor)\b/.test(q)) filters.cat = "Helicopter";
    else if (/\b(single.engine|singleengine|single-engine|sep)\b/.test(q)) filters.cat = "Single Engine Piston";
    else if (/\b(multi.engine|multiengine|multi-engine|twin.engine|twin-engine|twin)\b/.test(q)) filters.cat = "Multi Engine Piston";
    else if (/\b(turboprop)\b/.test(q)) filters.cat = "Turboprop";
    else if (/\b(light.jet|midsize.jet|heavy.jet|business.jet|jet)\b/.test(q)) {
      if (/\bmidsize\b/.test(q)) filters.cat = "Midsize Jet";
      else if (/\bheavy\b/.test(q)) filters.cat = "Heavy Jet";
      else filters.cat = "Light Jet";
    }
    else if (/\b(lsa|light.sport|sport.aircraft|ultralight|trainer)\b/.test(q)) filters.cat = "LSA";
    else if (/\b(glider|sailplane)\b/.test(q)) filters.cat = "Glider";
    else if (/\b(gyrocopter|gyro|autogyro)\b/.test(q)) filters.cat = "Gyrocopter";

    // Price - Under
    const underPriceK = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+)\s*k/i);
    const underPriceM = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);
    if (underPriceK) filters.maxPrice = String(parseInt(underPriceK[1]) * 1000);
    else if (underPriceM) filters.maxPrice = String(Math.round(parseFloat(underPriceM[1]) * 1000000));

    // Price - Over
    const overPriceK = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+)\s*k/i);
    const overPriceM = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);
    if (overPriceK) filters.minPrice = String(parseInt(overPriceK[1]) * 1000);
    else if (overPriceM) filters.minPrice = String(Math.round(parseFloat(overPriceM[1]) * 1000000));

    // Price Range
    const priceRange = q.match(/\$?(\d+(?:\.\d+)?)\s*k?\s*(?:to|-|)\s*\$?(\d+(?:\.\d+)?)\s*(k|m)?/i);
    if (priceRange && !underPriceK && !underPriceM && !overPriceK && !overPriceM) {
      let min = parseFloat(priceRange[1]);
      let max = parseFloat(priceRange[2]);
      const suffix = (priceRange[3] || '').toLowerCase();
      if (suffix === 'k' || (min < 100 && !suffix)) { min *= 1000; max *= 1000; }
      else if (suffix === 'm' || min > 100) { min *= 1000000; max *= 1000000; }
      else { min *= 1000; max *= 1000; }
      filters.minPrice = String(Math.round(min));
      filters.maxPrice = String(Math.round(max));
    }

    // Relative price terms
    if (/\b(cheap|budget|affordable|inexpensive)\b/.test(q) && !filters.maxPrice) {
      filters.maxPrice = "300000";
    } else if (/\b(expensive|luxury|premium|high.end)\b/.test(q) && !filters.minPrice) {
      filters.minPrice = "1000000";
    }

    // Hours
    const underHours = q.match(/(?:under|less than|below|max|maximum)\s*(\d+)\s*(?:hours?|hrs?|ttaf)/i);
    if (underHours) filters.maxHours = underHours[1];
    else if (/\b(low hours?|low.time)\b/i.test(q)) filters.maxHours = "1000";

    // Features
    if (/\bifr|instrument\b/i.test(q)) filters.ifrOnly = true;
    if (/\bglass|g1000|garmin\b/i.test(q)) filters.glassOnly = true;
    if (/\bnew\b/i.test(q) && !/\bnews\b/i.test(q)) filters.cond = "New";
    if (/\b(pre-owned|used|second.hand)\b/i.test(q)) filters.cond = "Pre-Owned";

    return filters;
  };

  const handleAiSearch = (query) => {
    if (!query.trim()) return;
    const filters = parseAiQuery(query);
    // Pass filters to parent to persist across page navigation
    if (setSearchFilters) setSearchFilters(filters);
    setPage("buy");
  };

  const handleManualSearch = () => {
    const filters = {
      cat: searchCat,
      make: searchMake,
      state: searchState,
      query: ""
    };
    if (setSearchFilters) setSearchFilters(filters);
    setPage("buy");
  };

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
              <input
                className="fs-search-ai-input"
                placeholder='Try "4-seat IFR under $500k in VIC" or "best trainer aircraft"'
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAiSearch(e.target.value); }}
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
            <button className="fs-search-btn" onClick={handleManualSearch}>
              {Icons.search} Search Aircraft
            </button>
          </div>

          <div className="fs-categories">
            {CATEGORIES.slice(0, 6).map(c => (
              <button key={c} className="fs-cat-pill" onClick={() => {
                if (setSearchFilters) setSearchFilters({ cat: c });
                setPage("buy");
              }}>{c}</button>
            ))}
          </div>

          <div className="fs-stats">
            <div className="fs-stat"><div className="fs-stat-num">{totalListings > 0 ? `${totalListings}+` : `${SAMPLE_LISTINGS.length}+`}</div><div className="fs-stat-label">Aircraft Listed</div></div>
            <div className="fs-stat"><div className="fs-stat-num">{displayDealers.length}</div><div className="fs-stat-label">Verified Dealers</div></div>
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
            {featuredLoading ? (
              [1,2,3,4].map(i => <div key={i} style={{ height: 320, background: "var(--fs-gray-100)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />)
            ) : featured.map(l => (
              <ListingCard key={l.id} listing={l} onClick={setSelectedListing} onSave={onSave} saved={savedIds.has(l.id)} />
            ))}
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
            {latestLoading ? (
              [1,2,3,4].map(i => <div key={i} style={{ height: 280, background: "var(--fs-gray-100)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />)
            ) : latest.map(l => (
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
            {displayDealers.slice(0, 3).map(d => (
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
            {displayNews.slice(0, 3).map(a => (
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

const BuyPage = ({ setSelectedListing, savedIds, onSave, initialFilters }) => {
  const [search, setSearch] = useState(initialFilters?.query || "");
  const [aiQuery, setAiQuery] = useState(initialFilters?.query || "");
  const [sortBy, setSortBy] = useState("newest");
  const [resultPage, setResultPage] = useState(1);
  const PAGE_SIZE = 12;
  const [catFilter, setCatFilter] = useState(initialFilters?.cat || "");
  const [stateFilter, setStateFilter] = useState(initialFilters?.state || "");
  const [makeFilter, setMakeFilter] = useState(initialFilters?.make || "");
  const [condFilter, setCondFilter] = useState(initialFilters?.cond || "");
  const [minPrice, setMinPrice] = useState(initialFilters?.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice || "");
  const [maxHours, setMaxHours] = useState(initialFilters?.maxHours || "");
  const [ifrOnly, setIfrOnly] = useState(initialFilters?.ifrOnly || false);
  const [glassOnly, setGlassOnly] = useState(initialFilters?.glassOnly || false);
  const [sideOpen, setSideOpen] = useState(false);

  const handleAiSearch = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return;
    
    // Reset filters first for a clean search
    resetFilters();
    
    // ===== LOCATION / STATE DETECTION =====
    const statePatterns = [
      { pattern: /\b(vic|victoria|melbourne)\b/, state: "VIC" },
      { pattern: /\b(nsw|new south wales|sydney)\b/, state: "NSW" },
      { pattern: /\b(qld|queensland|brisbane)\b/, state: "QLD" },
      { pattern: /\b(wa|western australia|perth)\b/, state: "WA" },
      { pattern: /\b(sa|south australia|adelaide)\b/, state: "SA" },
      { pattern: /\b(tas|tasmania|hobart)\b/, state: "TAS" },
      { pattern: /\b(nt|northern territory|darwin)\b/, state: "NT" },
      { pattern: /\b(act|canberra)\b/, state: "ACT" }
    ];
    
    for (const { pattern, state } of statePatterns) {
      if (pattern.test(q)) {
        setStateFilter(state);
        break;
      }
    }
    
    // ===== MANUFACTURER DETECTION =====
    const makePatterns = [
      { pattern: /\b(cessna|182|172|152|206)\b/, make: "Cessna" },
      { pattern: /\b(cirrus|sr22|sr20)\b/, make: "Cirrus" },
      { pattern: /\b(piper|pa-28|pa28|archer|warrior)\b/, make: "Piper" },
      { pattern: /\b(diamond|da40|da42)\b/, make: "Diamond" },
      { pattern: /\b(robinson|r44|r22)\b/, make: "Robinson" },
      { pattern: /\b(sling|tsi)\b/, make: "Sling" },
      { pattern: /\b(pilatus|pc-12|pc12)\b/, make: "Pilatus" },
      { pattern: /\b(beech|beechcraft|baron|bonanza)\b/, make: "Beechcraft" },
      { pattern: /\b(jabiru)\b/, make: "Jabiru" },
      { pattern: /\b(mooney)\b/, make: "Mooney" },
      { pattern: /\b(tecnama?)\b/, make: "Tecnam" },
      { pattern: /\b(bristell)\b/, make: "BRM Aero" },
      { pattern: /\b(pipistrel)\b/, make: "Pipistrel" }
    ];
    
    for (const { pattern, make } of makePatterns) {
      if (pattern.test(q)) {
        setMakeFilter(make);
        break;
      }
    }
    
    // ===== CATEGORY DETECTION =====
    if (/\b(helicopter|heli|chopper|rotor)\b/.test(q)) {
      setCatFilter("Helicopter");
    } else if (/\b(single.engine|singleengine|single-engine|sep)\b/.test(q)) {
      setCatFilter("Single Engine Piston");
    } else if (/\b(multi.engine|multiengine|multi-engine|twin.engine|twin-engine|twin)\b/.test(q)) {
      setCatFilter("Multi Engine Piston");
    } else if (/\b(turboprop)\b/.test(q)) {
      setCatFilter("Turboprop");
    } else if (/\b(light.jet|midsize.jet|heavy.jet|business.jet)\b/.test(q)) {
      setCatFilter(/\bmidsize\b/.test(q) ? "Midsize Jet" : /\bheavy\b/.test(q) ? "Heavy Jet" : "Light Jet");
    } else if (/\b(lsa|light.sport|sport.aircraft|ultralight)\b/.test(q)) {
      setCatFilter("LSA");
    } else if (/\b(glider|sailplane)\b/.test(q)) {
      setCatFilter("Glider");
    } else if (/\b(gyrocopter|gyro|autogyro)\b/.test(q)) {
      setCatFilter("Gyrocopter");
    }
    
    // ===== PRICE DETECTION =====
    // "under $500k", "less than 300k", "up to $1m"
    const underPriceK = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+)\s*k/i);
    const underPriceM = q.match(/(?:under|less than|below|up to|max|maximum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);
    const overPriceK = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+)\s*k/i);
    const overPriceM = q.match(/(?:over|more than|above|at least|min|minimum)\s*\$?(\d+(?:\.\d+)?)\s*m/i);
    const priceRange = q.match(/\$?(\d+(?:\.\d+)?)\s*k?\s*(?:to|-|)\s*\$?(\d+(?:\.\d+)?)\s*(k|m)?/i);
    
    if (underPriceK) {
      setMaxPrice(String(parseInt(underPriceK[1]) * 1000));
    } else if (underPriceM) {
      setMaxPrice(String(Math.round(parseFloat(underPriceM[1]) * 1000000)));
    }
    
    if (overPriceK) {
      setMinPrice(String(parseInt(overPriceK[1]) * 1000));
    } else if (overPriceM) {
      setMinPrice(String(Math.round(parseFloat(overPriceM[1]) * 1000000)));
    }
    
    // Price range: "$200k to $500k" or "300k-600k"
    if (priceRange && !underPriceK && !underPriceM && !overPriceK && !overPriceM) {
      let min = parseFloat(priceRange[1]);
      let max = parseFloat(priceRange[2]);
      const suffix = (priceRange[3] || '').toLowerCase();
      
      // Determine scale from suffix or magnitude
      if (suffix === 'k' || (min < 100 && !suffix)) {
        min *= 1000;
        max *= 1000;
      } else if (suffix === 'm' || min > 100) {
        min *= 1000000;
        max *= 1000000;
      } else if (!suffix && max > 1000) {
        // Already in dollars
      } else {
        min *= 1000;
        max *= 1000;
      }
      
      setMinPrice(String(Math.round(min)));
      setMaxPrice(String(Math.round(max)));
    }
    
    // "Cheap" or "expensive" relative terms
    if (/\bcheap|budget|affordable|inexpensive\b/.test(q) && !minPrice && !maxPrice) {
      setMaxPrice("300000"); // Under $300k
    } else if (/\bexpensive|luxury|premium|high.end\b/.test(q) && !minPrice) {
      setMinPrice("1000000"); // Over $1M
    }
    
    // ===== HOURS / TIME DETECTION =====
    const underHours = q.match(/(?:under|less than|below|max|maximum)\s*(\d+)\s*(?:hours?|hrs?|ttaf)/i);
    const overHours = q.match(/(?:over|more than|above)\s*(\d+)\s*(?:hours?|hrs?|ttaf)/i);
    const lowHours = /\blow hours?|low.time\b/i.test(q);
    
    if (underHours) {
      setMaxHours(underHours[1]);
    } else if (lowHours) {
      setMaxHours("1000"); // Low hours = under 1000
    }
    
    // ===== YEAR DETECTION =====
    const yearMatch = q.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      // Could implement year filtering when available
    }
    
    // ===== FEATURE DETECTION =====
    if (/\bifr|instrument\b/i.test(q)) {
      setIfrOnly(true);
    }
    if (/\bglass|cirrus|g1000|garmin\b/i.test(q)) {
      setGlassOnly(true);
    }
    if (/\bnew\b/i.test(q) && !/\bnews\b/i.test(q)) {
      setCondFilter("New");
    }
    if (/\b(pre-owned|used|second.hand)\b/i.test(q)) {
      setCondFilter("Pre-Owned");
    }
    
    // ===== SEAT COUNT =====
    const seatMatch = q.match(/\b(\d)[\s-]?(?:seat|passenger|pax|place)\b/i);
    if (seatMatch) {
      // Could add seat count filter when available
    }
    
    // Set the display query
    setAiQuery(query);
    
    // Also set the text search for title/manufacturer matching
    setSearch(query);
  };

  const resetFilters = () => {
    setSearch(""); setCatFilter(""); setStateFilter(""); setMakeFilter("");
    setCondFilter(""); setMinPrice(""); setMaxPrice(""); setMaxHours("");
    setIfrOnly(false); setGlassOnly(false); setAiQuery("");
  };

  const activeFilterCount = [catFilter, stateFilter, makeFilter, condFilter, minPrice, maxPrice, maxHours, ifrOnly, glassOnly].filter(Boolean).length;

  const dbFilters = useMemo(() => ({
    category: catFilter || undefined,
    manufacturer: makeFilter || undefined,
    state: stateFilter || undefined,
    condition: condFilter || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    maxHours: maxHours || undefined,
    ifrOnly: ifrOnly || undefined,
    glassOnly: glassOnly || undefined,
    search: search || undefined,
    sortBy,
  }), [catFilter, makeFilter, stateFilter, condFilter, minPrice, maxPrice, maxHours, ifrOnly, glassOnly, search, sortBy]);

  const { aircraft: dbAircraft, loading: dbLoading, total: dbTotal } = useAircraft(dbFilters);

  // Fall back to client-side filtered mock data if DB returns empty
  const filtered = useMemo(() => {
    if (dbAircraft.length > 0) return dbAircraft;
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
    if (sortBy === "newest") results.sort((a, b) => new Date(b.created_at || b.created) - new Date(a.created_at || a.created));
    if (sortBy === "hours-low") results.sort((a, b) => a.ttaf - b.ttaf);
    return results;
  }, [dbAircraft, search, sortBy, catFilter, stateFilter, makeFilter, condFilter, minPrice, maxPrice, maxHours, ifrOnly, glassOnly]);

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
          <select className="fs-sort-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setResultPage(1); }}>
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
                  {dbLoading ? "Searching..." : `${filtered.length} aircraft found`}
                  {aiQuery && !dbLoading && <span style={{ color: "var(--fs-gray-400)", marginLeft: 8 }}>for "{aiQuery}"</span>}
                </span>
                {filtered.length > 0 && !dbLoading && (
                  <span style={{ fontSize: 12, color: "var(--fs-gray-400)" }}>
                    Page {resultPage} of {Math.ceil(filtered.length / PAGE_SIZE)}
                  </span>
                )}
              </div>
              {dbLoading ? (
                <div className="fs-grid">
                  {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 280, background: "var(--fs-gray-100)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="fs-empty">
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{Icons.search}</div>
                  <p>No aircraft match your filters.</p>
                  <button className="fs-sidebar-reset" style={{ maxWidth: 200, margin: "16px auto 0" }} onClick={resetFilters}>Clear all filters</button>
                </div>
              ) : (
                <>
                  <div className="fs-grid">
                    {filtered.slice((resultPage - 1) * PAGE_SIZE, resultPage * PAGE_SIZE).map(l => (
                      <ListingCard key={l.id} listing={l} onClick={setSelectedListing} onSave={onSave} saved={savedIds.has(l.id)} />
                    ))}
                  </div>
                  {filtered.length > PAGE_SIZE && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 32 }}>
                      <button
                        onClick={() => { setResultPage(p => Math.max(1, p - 1)); window.scrollTo(0, 300); }}
                        disabled={resultPage === 1}
                        style={{ padding: "8px 18px", borderRadius: "var(--fs-radius-sm)", border: "1px solid var(--fs-gray-200)", background: resultPage === 1 ? "var(--fs-gray-100)" : "#fff", cursor: resultPage === 1 ? "default" : "pointer", fontWeight: 600, fontSize: 14, color: resultPage === 1 ? "var(--fs-gray-400)" : "var(--fs-gray-900)" }}
                      >← Prev</button>
                      {Array.from({ length: Math.ceil(filtered.length / PAGE_SIZE) }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => { setResultPage(p); window.scrollTo(0, 300); }}
                          style={{ width: 36, height: 36, borderRadius: "var(--fs-radius-sm)", border: "1px solid", borderColor: p === resultPage ? "var(--fs-blue)" : "var(--fs-gray-200)", background: p === resultPage ? "var(--fs-blue)" : "#fff", color: p === resultPage ? "#fff" : "var(--fs-gray-700)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                        >{p}</button>
                      ))}
                      <button
                        onClick={() => { setResultPage(p => Math.min(Math.ceil(filtered.length / PAGE_SIZE), p + 1)); window.scrollTo(0, 300); }}
                        disabled={resultPage === Math.ceil(filtered.length / PAGE_SIZE)}
                        style={{ padding: "8px 18px", borderRadius: "var(--fs-radius-sm)", border: "1px solid var(--fs-gray-200)", background: resultPage === Math.ceil(filtered.length / PAGE_SIZE) ? "var(--fs-gray-100)" : "#fff", cursor: resultPage === Math.ceil(filtered.length / PAGE_SIZE) ? "default" : "pointer", fontWeight: 600, fontSize: 14, color: resultPage === Math.ceil(filtered.length / PAGE_SIZE) ? "var(--fs-gray-400)" : "var(--fs-gray-900)" }}
                      >Next →</button>
                    </div>
                  )}
                </>
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
  const { aircraft: similar } = useAircraft({ category: listing?.category, sortBy: 'newest' });
  if (!listing) return null;
  const l = listing;
  const dealerObj = l.dealer || {};
  const dealerName = dealerObj?.name || (typeof dealerObj === 'string' ? dealerObj : null);
  const isSaved = savedIds.has(l.id);
  const monthlyEst = formatPriceFull(Math.round(l.price * 0.008));

  const specs = [
    ["Year", l.year], ["Manufacturer", l.manufacturer], ["Model", l.model],
    l.rego && ["Registration", l.rego],
    ["Category", l.category], ["Condition", l.condition],
    l.ttaf != null && ["Total Time Airframe", formatHours(l.ttaf)],
    l.eng_hours != null && ["Engine Hours (SMOH)", formatHours(l.eng_hours)],
    l.eng_tbo && ["Engine TBO", formatHours(l.eng_tbo)],
    l.specs?.engine && ["Engine", l.specs.engine],
    l.specs?.propeller && ["Propeller", l.specs.propeller],
    l.avionics && ["Avionics", l.avionics],
    l.specs?.seats && ["Seats", l.specs.seats],
    l.specs?.mtow_kg && ["MTOW", l.specs.mtow_kg + " kg"],
    l.specs?.wingspan_m && ["Wingspan", l.specs.wingspan_m + " m"],
    l.useful_load && ["Useful Load", l.useful_load + " kg"],
    l.range_nm && ["Range", l.range_nm + " nm"],
    l.cruise_kts && ["Cruise Speed", l.cruise_kts + " kts"],
    l.fuel_burn && ["Fuel Burn", l.fuel_burn + " L/hr"],
    ["IFR Capable", l.ifr ? "✓ Yes" : "No"],
    ["Retractable Gear", l.retractable ? "✓ Yes" : "No"],
    l.pressurised !== undefined && ["Pressurised", l.pressurised ? "✓ Yes" : "No"],
    ["Glass Cockpit", l.glass_cockpit ? "✓ Yes" : "No"],
    l.specs?.parachute && ["Parachute", l.specs.parachute],
  ].filter(Boolean);

  const similarListings = similar.filter(s => s.id !== l.id).slice(0, 3);

  return (
    <>
      <div className="fs-detail-header">
        <div className="fs-container">
          <div className="fs-detail-breadcrumb">
            <span onClick={onBack} style={{ cursor: "pointer" }}>Buy</span> {Icons.chevronRight}
            <span>{l.category}</span> {Icons.chevronRight}
            <span style={{ color: "rgba(255,255,255,0.8)" }}>{l.title}</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{l.title}</h1>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.5)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{Icons.location} {[l.city, l.state].filter(Boolean).join(', ')}</span>
            <span>Listed {timeAgo(l.created_at || l.created)}</span>
            {dealerName && <span className="fs-tag fs-tag-blue" style={{ fontSize: 10 }}>{Icons.shield} Verified Dealer</span>}
            {l.rego && <span className="fs-tag" style={{ fontSize: 10, background: "rgba(255,255,255,0.15)", color: "#fff" }}>✈ CASA {l.rego}</span>}
            {l.ifr && <span className="fs-tag" style={{ fontSize: 10, background: "#2563eb", color: "#fff" }}>IFR</span>}
            {isJustListed(l) && <span className="fs-tag" style={{ fontSize: 10, background: "#10b981", color: "#fff" }}>Just Listed</span>}
          </div>
        </div>
      </div>

      <div className="fs-container">
        <div className="fs-detail-layout">
          {/* Main content */}
          <div>
            <AircraftImage listing={l} size="lg" style={{ borderRadius: "var(--fs-radius)", marginBottom: 20 }} showGallery={true} />

            {l.description && (
              <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
                <h3>Description</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--fs-gray-600)", whiteSpace: "pre-line" }}>{l.description}</p>
              </div>
            )}

            <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
              <h3>Key Specifications</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                {specs.map(([label, value]) => (
                  <div key={label} className="fs-detail-spec-row" style={{ gridColumn: label === "Avionics" ? "span 2" : undefined }}>
                    <span className="fs-detail-spec-label">{label}</span>
                    <span className="fs-detail-spec-value" style={{ color: String(value).startsWith('✓') ? "var(--fs-green)" : undefined }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fs-detail-specs" style={{ marginBottom: 20 }}>
              <h3>Cost of Ownership (est.)</h3>
              {[
                ["Annual Insurance", formatPriceFull(Math.round(l.price * 0.015))],
                ["Annual Inspection", l.category === "Helicopter" ? "$8,000–$15,000" : "$3,000–$8,000"],
                ["Hangar (monthly)", "$400–$1,200"],
                l.fuel_burn && ["Fuel per hour", `$${(l.fuel_burn * 2.8).toFixed(0)}`],
                l.fuel_burn && ["Hourly Operating Cost", `~$${(l.fuel_burn * 2.8 + (l.eng_tbo ? (l.price * 0.3 / l.eng_tbo) : 50) + 30).toFixed(0)}`],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="fs-detail-spec-row">
                  <span className="fs-detail-spec-label">{label}</span>
                  <span className="fs-detail-spec-value">{value}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 12 }}>Estimates only. Based on Australian averages. Actual costs vary.</p>
            </div>

            {/* Mobile CTA — shown below specs on mobile */}
            <div className="fs-detail-mobile-cta">
              <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em", marginBottom: 4 }}>{formatPriceFull(l.price)}</div>
              <button className="fs-detail-cta fs-detail-cta-primary" onClick={() => setShowEnquiry(true)} style={{ marginBottom: 10 }}>
                {Icons.mail}&nbsp; Contact Seller
              </button>
              <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => onSave(l.id)}>
                {isSaved ? Icons.heartFull : Icons.heart}&nbsp; {isSaved ? "Saved" : "Save to Watchlist"}
              </button>
            </div>

            {/* Similar aircraft */}
            {similarListings.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Similar {l.category} Aircraft</h3>
                <div className="fs-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                  {similarListings.map(s => (
                    <ListingCard key={s.id} listing={s} onClick={() => { window.scrollTo(0,0); }} onSave={onSave} saved={savedIds.has(s.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="fs-detail-sidebar">
            <div className="fs-detail-price-card fs-detail-sticky">
              <div className="fs-detail-price">{formatPriceFull(l.price)}</div>
              {l.rego && <div className="fs-detail-rego">{l.rego} &middot; {l.condition}</div>}

              <button className="fs-detail-cta fs-detail-cta-primary" onClick={() => setShowEnquiry(true)}>
                {Icons.mail}&nbsp; Contact Seller
              </button>
              <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => onSave(l.id)}>
                {isSaved ? Icons.heartFull : Icons.heart}&nbsp; {isSaved ? "Saved ✓" : "Save to Watchlist"}
              </button>

              <div style={{ marginTop: 16, padding: "14px 0", borderTop: "1px solid var(--fs-gray-100)" }}>
                <div style={{ fontSize: 12, color: "var(--fs-gray-400)", marginBottom: 6 }}>Est. Monthly Finance</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{monthlyEst}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--fs-gray-400)" }}>/mo</span></div>
                <div style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>80% LVR · 7.5% · 10 years</div>
              </div>

              {/* Trust signals */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--fs-gray-100)", display: "flex", flexDirection: "column", gap: 8 }}>
                {l.rego && <div style={{ fontSize: 12, color: "var(--fs-gray-600)", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "var(--fs-green)" }}>✓</span> CASA Registered ({l.rego})</div>}
                {dealerName && <div style={{ fontSize: 12, color: "var(--fs-gray-600)", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "var(--fs-green)" }}>✓</span> Verified Dealer Listing</div>}
                <div style={{ fontSize: 12, color: "var(--fs-gray-600)", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "var(--fs-green)" }}>✓</span> Transparent Pricing</div>
                <div style={{ fontSize: 12, color: "var(--fs-gray-600)", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "var(--fs-green)" }}>✓</span> No Hidden Fees</div>
              </div>
            </div>

            {dealerName && (
              <div className="fs-detail-specs">
                <h3>Seller</h3>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                  <div className="fs-dealer-avatar" style={{ width: 44, height: 44, fontSize: 13 }}>{(dealerObj.logo || dealerName?.slice(0,2))?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{dealerName}</div>
                    {dealerObj.location && <div style={{ fontSize: 12, color: "var(--fs-gray-500)", display: "flex", alignItems: "center", gap: 4 }}>{Icons.location} {dealerObj.location}</div>}
                  </div>
                </div>
                {dealerObj.rating && (
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--fs-gray-500)" }}>
                    <span className="fs-dealer-rating">{Icons.star} {dealerObj.rating}</span>
                    {dealerObj.listings && <span>{dealerObj.listings} active listings</span>}
                  </div>
                )}
              </div>
            )}
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
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Featured');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    manufacturer: '',
    model: '',
    year: '',
    category: '',
    rego: '',
    condition: 'Pre-Owned',
    price: '',
    state: '',
    city: '',
    ttaf: '',
    eng_hours: '',
    eng_tbo: '',
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

  const validateStep1 = () => {
    const errors = [];
    if (!formData.manufacturer) errors.push('Manufacturer is required');
    if (!formData.model) errors.push('Model is required');
    if (!formData.year) errors.push('Year is required');
    if (!formData.category) errors.push('Category is required');
    if (!formData.rego) errors.push('Registration is required');
    if (!formData.condition) errors.push('Condition is required');
    if (!formData.price) errors.push('Price is required');
    if (!formData.state) errors.push('Location is required');
    return errors;
  };

  const validateStep2 = () => {
    const errors = [];
    if (!formData.ttaf) errors.push('Total Time Airframe is required');
    if (!formData.eng_hours) errors.push('Engine Hours is required');
    return errors;
  };

  const [errors, setErrors] = useState([]);

  const handleContinue = (nextStep, validateFn) => {
    const validationErrors = validateFn();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo(0, 0);
    } else {
      setErrors([]);
      setStep(nextStep);
      window.scrollTo(0, 0);
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
              <h3 style={{ fontSize: 18, marginBottom: 24 }}>Step 1: Aircraft Details</h3>
              
              {errors.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--fs-radius-sm)', padding: '12px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Please fix the following:</p>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#dc2626' }}>
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
              
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
              <button className="fs-form-submit" onClick={() => handleContinue(2, validateStep1)} style={{ marginTop: 16 }}>Continue to Specs</button>
            </div>
          )}
          
          {step === 2 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              <h3 style={{ fontSize: 18 }}>Step 2: Specifications & Hours</h3>
              
              {errors.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--fs-radius-sm)', padding: '12px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Please fix the following:</p>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#dc2626' }}>
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
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
                  <input
                    className="fs-form-input"
                    placeholder="e.g. Garmin G1000 NXi, GFC700 autopilot"
                    value={formData.avionics || ''}
                    onChange={e => handleInputChange('avionics', e.target.value)}
                  />
                </div>
                <div className="fs-form-group" style={{ gridColumn: "span 2" }}>
                  <label className="fs-form-label">Description *</label>
                  <textarea
                    className="fs-form-textarea"
                    placeholder="Describe the aircraft condition, history, notable features..."
                    style={{ minHeight: 120 }}
                    value={formData.description || ''}
                    onChange={e => handleInputChange('description', e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                <button className="fs-form-submit" onClick={() => handleContinue(3, validateStep2)} style={{ flex: 2, marginTop: 0 }}>Continue to Photos</button>
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
                  {submitSuccess ? (
                    <div style={{ textAlign: "center", padding: "40px 24px" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>{Icons.check}</div>
                      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Listing Submitted!</h3>
                      <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 24 }}>Your listing is under review and will go live within 24 hours. You'll receive an email confirmation shortly.</p>
                      <button className="fs-form-submit" style={{ maxWidth: 220, margin: "0 auto" }} onClick={() => setPage('dashboard')}>Go to Dashboard</button>
                    </div>
                  ) : (
                    <>
                      <h3 style={{ fontSize: 18 }}>Photos & Submit</h3>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (!files.length) return;
                        setUploadingImages(true);
                        try {
                          const tempId = `temp-${Date.now()}`;
                          const urls = await Promise.all(files.map(f => uploadImage(f, tempId)));
                          setUploadedImages(prev => [...prev, ...urls]);
                        } catch (err) {
                          setSubmitError('Image upload failed: ' + err.message);
                        } finally {
                          setUploadingImages(false);
                        }
                      }} />
                      <div style={{ border: "2px dashed var(--fs-gray-200)", borderRadius: "var(--fs-radius)", padding: 32, textAlign: "center", marginBottom: 20 }}>
                        <div style={{ color: "var(--fs-gray-400)", marginBottom: 8 }}>{Icons.camera}</div>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Upload Photos</p>
                        <p style={{ fontSize: 12, color: "var(--fs-gray-400)" }}>Minimum 4 photos recommended. Include exterior, cockpit, panel, and engine bay.</p>
                        {uploadedImages.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "12px 0" }}>
                            {uploadedImages.map((url, i) => (
                              <div key={i} style={{ position: "relative" }}>
                                <img src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "2px solid var(--fs-green)" }} />
                                <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button className="fs-detail-cta fs-detail-cta-secondary" style={{ maxWidth: 200, margin: "16px auto 0" }} onClick={() => fileInputRef.current?.click()} disabled={uploadingImages}>
                          {uploadingImages ? "Uploading..." : `Choose Files${uploadedImages.length > 0 ? ` (${uploadedImages.length} added)` : ''}`}
                        </button>
                      </div>
                      <div style={{ background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius)", padding: 20, marginBottom: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Listing Plan</h4>
                        {[
                          { name: "Basic", price: "Free", features: ["30-day listing", "Up to 8 photos", "Standard placement"] },
                          { name: "Featured", price: "$149", features: ["60-day listing", "Up to 20 photos", "Homepage featured", "Priority in search"], recommended: true },
                          { name: "Premium", price: "$299", features: ["90-day listing", "Unlimited photos", "Top placement", "Dedicated support"] },
                        ].map(plan => (
                          <label key={plan.name} style={{ display: "flex", gap: 12, padding: "12px", marginBottom: 8, borderRadius: "var(--fs-radius-sm)", border: selectedPlan === plan.name ? "2px solid var(--fs-blue)" : "1px solid var(--fs-gray-200)", cursor: "pointer", background: "white" }}>
                            <input type="radio" name="plan" checked={selectedPlan === plan.name} onChange={() => setSelectedPlan(plan.name)} style={{ marginTop: 2 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{plan.name}</span>
                                <span style={{ fontWeight: 700, color: "var(--fs-blue)" }}>{plan.price}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--fs-gray-500)", marginTop: 4 }}>{plan.features.join(" · ")}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      {submitError && (
                        <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--fs-radius-sm)", marginBottom: 12, fontSize: 13, color: "#dc2626" }}>{submitError}</div>
                      )}
                      <div style={{ display: "flex", gap: 12 }}>
                        <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
                        <button
                          className="fs-form-submit"
                          style={{ flex: 2, marginTop: 0, opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
                          disabled={submitting}
                          onClick={async () => {
                            setSubmitting(true);
                            setSubmitError(null);
                            try {
                              await createListing({
                                title: `${formData.year} ${formData.manufacturer} ${formData.model}`.trim(),
                                manufacturer: formData.manufacturer,
                                model: formData.model,
                                year: parseInt(formData.year),
                                category: formData.category,
                                rego: formData.rego,
                                condition: formData.condition,
                                price: parseInt(formData.price),
                                state: formData.state,
                                city: formData.city || formData.state,
                                ttaf: parseInt(formData.ttaf) || 0,
                                eng_hours: parseInt(formData.eng_hours) || null,
                                avionics: formData.avionics,
                                description: formData.description,
                                images: uploadedImages,
                                specs: { engine: formData.engineType, propeller: formData.propeller },
                                featured: selectedPlan !== 'Basic',
                              }, user.id);
                              setSubmitSuccess(true);
                            } catch (err) {
                              setSubmitError(err.message || 'Failed to submit listing. Please try again.');
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                        >
                          {submitting ? "Submitting..." : "Submit Listing for Review"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

const DealersPage = () => {
  const { dealers: dealersFromDB, loading } = useDealers();
  const dealers = dealersFromDB.length > 0 ? dealersFromDB : DEALERS;
  const [applyForm, setApplyForm] = useState({ name: '', email: '', business: '', phone: '' });
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [showApply, setShowApply] = useState(false);

  const handleApply = async () => {
    if (!applyForm.name || !applyForm.email || !applyForm.business) { setApplyError('Please fill in all required fields.'); return; }
    setApplying(true); setApplyError(null);
    try {
      await submitLead('contact', { name: applyForm.name, email: applyForm.email, phone: applyForm.phone, message: `[DEALER APPLICATION] Business: ${applyForm.business}` });
      setApplied(true);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit. Please try again.');
    } finally { setApplying(false); }
  };

  return (
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
            {loading ? [1,2,3,4,5,6].map(i => <div key={i} style={{ height: 160, background: "var(--fs-gray-100)", borderRadius: "var(--fs-radius)", animation: "fs-pulse 1.5s infinite" }} />) :
              dealers.map(d => (
                <div key={d.id} className="fs-dealer-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", marginBottom: 12 }}>
                    <div className="fs-dealer-avatar" style={{ width: 56, height: 56, fontSize: 16 }}>{d.logo}</div>
                    <div>
                      <div className="fs-dealer-name" style={{ fontSize: 17 }}>{d.name}</div>
                      <div className="fs-dealer-loc">{Icons.location} {d.location}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--fs-gray-500)", marginBottom: 12 }}>Specialising in {d.speciality}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, width: "100%", paddingTop: 12, borderTop: "1px solid var(--fs-gray-100)" }}>
                    <span>{d.listings} active listings</span>
                    <span className="fs-dealer-rating">{Icons.star} {d.rating}</span>
                    <span>Est. {d.since}</span>
                  </div>
                </div>
              ))
            }
          </div>
          <div style={{ textAlign: "center", marginTop: 40, padding: "32px", background: "var(--fs-gray-50)", borderRadius: "var(--fs-radius-lg)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Become a Flightsales Dealer</h3>
            <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 16, maxWidth: 500, margin: "0 auto 16px" }}>
              Get a branded storefront, lead management tools, and access to Australia's largest aviation audience.
            </p>
            {applied ? (
              <p style={{ color: "var(--fs-blue)", fontWeight: 600 }}>✓ Application received — we'll be in touch within 2 business days.</p>
            ) : showApply ? (
              <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "left" }}>
                {applyError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{applyError}</p>}
                <div className="fs-form-group"><label className="fs-form-label">Your Name *</label><input className="fs-form-input" value={applyForm.name} onChange={e => setApplyForm(f => ({...f, name: e.target.value}))} /></div>
                <div className="fs-form-group"><label className="fs-form-label">Business Name *</label><input className="fs-form-input" value={applyForm.business} onChange={e => setApplyForm(f => ({...f, business: e.target.value}))} /></div>
                <div className="fs-form-group"><label className="fs-form-label">Email *</label><input className="fs-form-input" type="email" value={applyForm.email} onChange={e => setApplyForm(f => ({...f, email: e.target.value}))} /></div>
                <div className="fs-form-group"><label className="fs-form-label">Phone</label><input className="fs-form-input" type="tel" value={applyForm.phone} onChange={e => setApplyForm(f => ({...f, phone: e.target.value}))} /></div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="fs-form-submit" onClick={handleApply} disabled={applying} style={{ opacity: applying ? 0.7 : 1 }}>{applying ? 'Submitting...' : 'Submit Application'}</button>
                  <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setShowApply(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="fs-form-submit" style={{ maxWidth: 240, margin: "0 auto" }} onClick={() => setShowApply(true)}>Apply Now</button>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

const FinancePage = () => {
  const [amount, setAmount] = useState(400000);
  const [deposit, setDeposit] = useState(20);
  const [rate, setRate] = useState(7.5);
  const [term, setTerm] = useState(10);
  const [showFinForm, setShowFinForm] = useState(false);
  const [finForm, setFinForm] = useState({ name: '', email: '', phone: '', aircraft: '' });
  const [finSending, setFinSending] = useState(false);
  const [finSent, setFinSent] = useState(false);
  const [finError, setFinError] = useState(null);
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
            {finSent ? (
              <p style={{ textAlign: "center", color: "var(--fs-blue)", fontWeight: 600, marginTop: 20 }}>✓ Request received — a finance specialist will contact you within 1 business day.</p>
            ) : showFinForm ? (
              <div style={{ marginTop: 20, borderTop: "1px solid var(--fs-gray-100)", paddingTop: 20 }}>
                {finError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{finError}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="fs-form-group"><label className="fs-form-label">Your Name *</label><input className="fs-form-input" value={finForm.name} onChange={e => setFinForm(f => ({...f, name: e.target.value}))} /></div>
                  <div className="fs-form-group"><label className="fs-form-label">Email *</label><input className="fs-form-input" type="email" value={finForm.email} onChange={e => setFinForm(f => ({...f, email: e.target.value}))} /></div>
                  <div className="fs-form-group"><label className="fs-form-label">Phone</label><input className="fs-form-input" type="tel" value={finForm.phone} onChange={e => setFinForm(f => ({...f, phone: e.target.value}))} /></div>
                  <div className="fs-form-group"><label className="fs-form-label">Aircraft in Mind</label><input className="fs-form-input" value={finForm.aircraft} onChange={e => setFinForm(f => ({...f, aircraft: e.target.value}))} placeholder="e.g. Cirrus SR22T" /></div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="fs-form-submit" style={{ marginTop: 4 }} disabled={finSending} onClick={async () => {
                    if (!finForm.name || !finForm.email) { setFinError('Name and email are required.'); return; }
                    setFinSending(true); setFinError(null);
                    try { await submitLead('finance', { name: finForm.name, email: finForm.email, phone: finForm.phone, message: `Finance enquiry. Loan: ${formatPriceFull(Math.round(loanAmt))}, ${term} yrs @ ${rate}%. Aircraft: ${finForm.aircraft}` }); setFinSent(true); } catch(err) { setFinError(err.message || 'Failed to submit.'); } finally { setFinSending(false); }
                  }} style={{ marginTop: 4, opacity: finSending ? 0.7 : 1 }}>{finSending ? 'Sending...' : 'Submit'}</button>
                  <button className="fs-detail-cta fs-detail-cta-secondary" style={{ marginTop: 4 }} onClick={() => setShowFinForm(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="fs-form-submit" style={{ marginTop: 20 }} onClick={() => setShowFinForm(true)}>Get Pre-Approved</button>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

const ValuatePage = () => {
  const [form, setForm] = useState({ manufacturer: '', model: '', year: '', ttaf: '', eng_hours: '', condition: 'Pre-Owned', avionics: '', email: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.manufacturer || !form.model || !form.year || !form.email) { setError('Please fill in manufacturer, model, year, and email.'); return; }
    setSending(true); setError(null);
    try {
      await submitLead('valuation', {
        name: form.email.split('@')[0],
        email: form.email,
        phone: form.phone,
        message: `Valuation request: ${form.manufacturer} ${form.model} ${form.year}, TTAF: ${form.ttaf}h, Eng SMOH: ${form.eng_hours}h, Condition: ${form.condition}, Avionics: ${form.avionics}`
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally { setSending(false); }
  };

  return (
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
            {sent ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>Request Received</h3>
                <p style={{ color: "var(--fs-gray-500)", fontSize: 14 }}>We'll send your valuation estimate within 24 hours.</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 18 }}>Get Your Valuation</h3>
                {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Manufacturer *</label>
                    <select className="fs-form-select" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)}>
                      <option value="">Select...</option>
                      {MANUFACTURERS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Model *</label>
                    <input className="fs-form-input" placeholder="e.g. SR22T" value={form.model} onChange={e => set('model', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Year *</label>
                    <input className="fs-form-input" type="number" placeholder="2018" value={form.year} onChange={e => set('year', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Total Time Airframe *</label>
                    <input className="fs-form-input" type="number" placeholder="Hours" value={form.ttaf} onChange={e => set('ttaf', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Engine Hours (SMOH)</label>
                    <input className="fs-form-input" type="number" placeholder="Hours" value={form.eng_hours} onChange={e => set('eng_hours', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Condition *</label>
                    <select className="fs-form-select" value={form.condition} onChange={e => set('condition', e.target.value)}>
                      {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="fs-form-group" style={{ gridColumn: "span 2" }}>
                    <label className="fs-form-label">Avionics / Notable Equipment</label>
                    <input className="fs-form-input" placeholder="e.g. Garmin G1000, ADSB-Out, autopilot" value={form.avionics} onChange={e => set('avionics', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Your Email *</label>
                    <input className="fs-form-input" type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Your Phone</label>
                    <input className="fs-form-input" type="tel" placeholder="04XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                </div>
                <button className="fs-form-submit" onClick={handleSubmit} disabled={sending} style={{ marginTop: 16, opacity: sending ? 0.7 : 1 }}>
                  {sending ? 'Submitting...' : 'Get Free Valuation'}
                </button>
                <p style={{ fontSize: 11, color: "var(--fs-gray-400)", marginTop: 12, textAlign: "center" }}>
                  Valuations are estimates based on recent market data and comparable sales. Not a formal appraisal.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

const NewsPage = () => {
  const { articles: dbArticles, loading } = useNews(20);
  const articles = dbArticles.length > 0 ? dbArticles : NEWS_ARTICLES;
  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 36 }}>Aviation News</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Market reports, CASA updates, and industry news</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container" style={{ maxWidth: 800, margin: "0 auto" }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="fs-news-card" style={{ marginBottom: 16, height: 120, background: "var(--fs-gray-100)", borderRadius: 8, animation: "fs-pulse 1.5s ease-in-out infinite" }} />)
          ) : articles.map(a => (
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
};

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

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Enquiry', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    if (!form.name || !form.email || !form.message) { setError('Please fill in your name, email, and message.'); return; }
    setSending(true); setError(null);
    try {
      await submitLead('contact', { name: form.name, email: form.email, message: `[${form.subject}] ${form.message}` });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally { setSending(false); }
  };

  return (
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
              {sent ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>Message Sent</h3>
                  <p style={{ color: "var(--fs-gray-500)", fontSize: 14 }}>We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: 18 }}>Send a Message</h3>
                  {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
                  <div className="fs-form-group">
                    <label className="fs-form-label">Name *</label>
                    <input className="fs-form-input" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Email *</label>
                    <input className="fs-form-input" type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Subject</label>
                    <select className="fs-form-select" value={form.subject} onChange={e => set('subject', e.target.value)}>
                      <option>General Enquiry</option>
                      <option>Selling My Aircraft</option>
                      <option>Dealer Account</option>
                      <option>Advertising</option>
                      <option>Bug Report</option>
                    </select>
                  </div>
                  <div className="fs-form-group">
                    <label className="fs-form-label">Message *</label>
                    <textarea className="fs-form-textarea" placeholder="How can we help?" value={form.message} onChange={e => set('message', e.target.value)} />
                  </div>
                  <button className="fs-form-submit" onClick={handleSend} disabled={sending} style={{ opacity: sending ? 0.7 : 1 }}>
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const LoginPage = ({ setPage, signIn, signUp, signInWithGoogle }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Google OAuth redirects — page will reload
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        setPage('dashboard');
      } else {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
        await signUp(email, password, {
          full_name: fullName,
          phone,
          account_type: accountType
        });
        setRegisterSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

          {mode === 'register' && !registerSuccess && (
            <p style={{ fontSize: 12, textAlign: "center", marginTop: 20, color: "var(--fs-gray-400)", lineHeight: 1.6, padding: "0 16px" }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              <br />Dealer accounts require verification before listings go live.
            </p>
          )}
        </div>

        {registerSuccess && (
          <div style={{ marginTop: 24, padding: "20px", background: "#d1fae5", borderRadius: "var(--fs-radius)", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✉️</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#065f46", marginBottom: 4 }}>Check your email!</p>
            <p style={{ fontSize: 13, color: "#065f46" }}>We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          </div>
        )}
      </div>
    </section>
  );
};

const DashboardPage = ({ user, setPage, signOut, savedIds, savedListings, onSave, onSelectListing }) => {
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

  const [activeTab, setActiveTab] = useState('overview');
  const [editProfile, setEditProfile] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    location: user.location || ''
  });

  const { listings: myListings, loading: listingsLoading, updateListingStatus } = useMyListings(user.id);
  const { enquiries: myEnquiries, loading: enquiriesLoading, updateStatus: updateEnquiryStatus } = useMyEnquiries(user.id);
  const { updateProfile } = useProfile(user.id);

  const savedAircraft = savedListings || [];

  const stats = {
    totalViews: 0,
    totalEnquiries: myEnquiries.length,
    activeListings: myListings.filter(l => l.status === 'active').length,
    totalWatchers: 0,
    newEnquiries: myEnquiries.filter(e => e.status === 'new').length
  };

  const handleLogout = async () => {
    await signOut();
    setPage('home');
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
        location: profileData.location
      });
      setEditProfile(false);
    } catch (err) {
      console.error('Profile save failed:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEnquiryStatusChange = (enquiryId, newStatus) => {
    updateEnquiryStatus(enquiryId, newStatus);
    if (selectedEnquiry?.id === enquiryId) {
      setSelectedEnquiry(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleReplySubmit = (enquiryId) => {
    if (!replyText.trim()) return;
    setReplyText('');
    updateEnquiryStatus(enquiryId, 'replied');
  };

  const handleMarkSpam = (enquiryId) => {
    updateEnquiryStatus(enquiryId, 'spam');
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: { bg: '#dcfce7', color: '#166534', label: 'New' },
      contacted: { bg: '#dbeafe', color: '#1e40af', label: 'Contacted' },
      negotiating: { bg: '#fef3c7', color: '#92400e', label: 'Negotiating' },
      sold: { bg: '#e0e7ff', color: '#3730a3', label: 'Sold' },
      archived: { bg: '#f3f4f6', color: '#6b7280', label: 'Archived' },
      spam: { bg: '#fee2e2', color: '#991b1b', label: 'Spam' }
    };
    const s = styles[status] || styles.new;
    return (
      <span style={{ 
        padding: "4px 12px", 
        borderRadius: 4, 
        fontSize: 12,
        fontWeight: 500,
        background: s.bg,
        color: s.color
      }}>
        {s.label}
      </span>
    );
  };

  // Add state for new sections
  const [savedSearches, setSavedSearches] = useState([
    { id: 1, name: 'Cirrus under $1M in VIC', filters: { make: 'Cirrus', maxPrice: '1000000', state: 'VIC' }, alerts: true, count: 12 },
    { id: 2, name: 'Single engine trainers', filters: { cat: 'Single Engine Piston' }, alerts: false, count: 45 },
  ]);
  
  const [receivedOffers, setReceivedOffers] = useState([
    { id: 1, aircraft: '2018 Cirrus SR22T', from: 'John Smith', amount: 850000, status: 'pending', date: '2026-03-22' },
  ]);
  
  const [myOffers, setMyOffers] = useState([
    { id: 1, aircraft: '2020 Cessna 182T', to: 'Southern Aviation', amount: 365000, status: 'pending', date: '2026-03-21' },
  ]);
  
  const [drafts, setDrafts] = useState([
    { id: 1, title: '2019 Diamond DA40', lastEdited: '2026-03-20', progress: 60 },
  ]);
  
  const [notifications, setNotifications] = useState({
    emailEnquiries: true,
    emailOffers: true,
    emailSavedSearch: true,
    smsEnquiries: false,
    smsOffers: false,
    pushNotifications: true,
    marketingEmails: false,
  });
  
  const [discounts] = useState([
    { id: 1, code: 'WELCOME2026', discount: '20% off listing fees', expiry: '2026-12-31', used: false },
    { id: 2, code: 'DEALER50', discount: '50% off first month', expiry: '2026-06-30', used: true },
  ]);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Icons.home },
    { section: 'My Selling', items: [
      { id: 'listings', label: 'My Aircraft', icon: Icons.plane, count: myListings.length },
      { id: 'drafts', label: 'Manage Ad or Draft', icon: Icons.file, count: drafts.length },
      { id: 'receivedOffers', label: 'Manage Your Offers', icon: Icons.tag, count: receivedOffers.length },
    ]},
    { section: 'My Buying', items: [
      { id: 'saved', label: 'Saved Aircraft', icon: Icons.heart, count: savedAircraft.length },
      { id: 'savedSearches', label: 'Saved Searches', icon: Icons.search, count: savedSearches.length },
      { id: 'myOffers', label: 'My Instant Offers', icon: Icons.dollar, count: myOffers.length },
    ]},
    { section: 'Messages', items: [
      { id: 'enquiries', label: 'Messages', icon: Icons.mail, count: stats.newEnquiries },
    ]},
    { section: 'Account', items: [
      { id: 'profile', label: 'Profile', icon: Icons.user },
      { id: 'notifications', label: 'Notification Preferences', icon: Icons.bell },
      { id: 'discounts', label: 'Discounts', icon: Icons.gift, count: discounts.filter(d => !d.used).length },
    ]},
  ];

  return (
    <>
      {/* Header */}
      <div className="fs-about-hero" style={{ padding: "40px 0" }}>
        <div className="fs-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'User')}&background=0a0a0a&color=fff`}
                  alt={user.full_name || user.email}
                  style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid white" }}
                />
                {isDealer && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#10b981',
                    color: 'white',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 10,
                    fontWeight: 600
                  }}>✓</span>
                )}
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--fs-font-serif)", fontSize: 32, marginBottom: 6 }}>
                  Welcome back, {user.full_name?.split(' ')[0]}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
                  {isDealer ? 'Verified Dealer Account' : 'Private Seller'} • Member since 2026
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button 
                className="fs-nav-btn-primary"
                onClick={() => setPage('sell')}
                style={{ background: 'white', color: 'var(--fs-gray-900)' }}
              >
                + List Aircraft
              </button>
              <button 
                onClick={handleLogout}
                style={{ 
                  padding: "12px 20px", 
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
      </div>

      <section className="fs-section" style={{ padding: "32px 0" }}>
        <div className="fs-container">
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }}>
            {/* Sidebar */}
            <div>
              <div className="fs-detail-specs" style={{ padding: 0, overflow: "hidden", borderRadius: 12 }}>
                <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)" }}>
                  <p style={{ fontSize: 12, color: "var(--fs-gray-500)", marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account Type</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{isDealer ? 'Verified Dealer' : 'Private Seller'}</p>
                    {isDealer && <span style={{ color: '#10b981' }}>✓</span>}
                  </div>
                </div>
                
                <nav style={{ padding: "8px 0" }}>
                  {sidebarItems.map((section, idx) => (
                    <div key={idx}>
                      {section.section && (
                        <p style={{ 
                          fontSize: 10, 
                          color: 'var(--fs-gray-400)', 
                          textTransform: 'uppercase', 
                          letterSpacing: 0.8,
                          padding: '16px 20px 8px',
                          fontWeight: 600
                        }}>
                          {section.section}
                        </p>
                      )}
                      {section.items ? section.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setSelectedEnquiry(null); }}
                          style={{
                            width: "100%",
                            padding: "10px 20px",
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
                            textAlign: "left",
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ color: activeTab === item.id ? "var(--fs-blue)" : "var(--fs-gray-400)", width: 20 }}>{item.icon}</span>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.count > 0 && (
                            <span style={{ 
                              background: activeTab === item.id ? 'var(--fs-blue)' : 'var(--fs-gray-200)', 
                              color: activeTab === item.id ? 'white' : 'var(--fs-gray-600)', 
                              fontSize: 11, 
                              padding: '2px 8px', 
                              borderRadius: 10,
                              fontWeight: 600
                            }}>
                              {item.count}
                            </span>
                          )}
                        </button>
                      )) : (
                        <button
                          key={section.id}
                          onClick={() => { setActiveTab(section.id); setSelectedEnquiry(null); }}
                          style={{
                            width: "100%",
                            padding: "10px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            background: activeTab === section.id ? '#eff6ff' : 'none',
                            border: "none",
                            borderLeft: activeTab === section.id ? '3px solid var(--fs-blue)' : '3px solid transparent',
                            cursor: "pointer",
                            fontSize: 14,
                            color: activeTab === section.id ? "var(--fs-blue)" : "var(--fs-gray-700)",
                            fontWeight: activeTab === section.id ? 600 : 400,
                            textAlign: "left",
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ color: activeTab === section.id ? "var(--fs-blue)" : "var(--fs-gray-400)", width: 20 }}>{section.icon}</span>
                          <span style={{ flex: 1 }}>{section.label}</span>
                          {section.count > 0 && (
                            <span style={{ 
                              background: activeTab === section.id ? 'var(--fs-blue)' : 'var(--fs-gray-200)', 
                              color: activeTab === section.id ? 'white' : 'var(--fs-gray-600)', 
                              fontSize: 11, 
                              padding: '2px 8px', 
                              borderRadius: 10,
                              fontWeight: 600
                            }}>
                              {section.count}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Sign Out */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--fs-gray-100)', marginTop: 8 }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: 'none',
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "var(--fs-gray-500)",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ color: "var(--fs-gray-400)", width: 20 }}>{Icons.logout}</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </nav>

                {isDealer && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid var(--fs-gray-100)", background: '#fafafa' }}>
                    <p style={{ fontSize: 11, color: "var(--fs-gray-500)", marginBottom: 8 }}>Plan: Professional</p>
                    <div style={{ height: 4, background: '#e5e5e5', borderRadius: 2, marginBottom: 8 }}>
                      <div style={{ height: '100%', width: '65%', background: 'var(--fs-blue)', borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 11, color: "var(--fs-gray-400)" }}>13 of 20 listings used</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <>
                  {/* Stats Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Total Views', value: stats.totalViews.toLocaleString(), change: '+23%', color: 'var(--fs-blue)' },
                      { label: 'Enquiries', value: stats.totalEnquiries, change: `+${stats.newEnquiries} new`, color: 'var(--fs-green)' },
                      { label: 'Active Listings', value: stats.activeListings, change: '2 pending', color: 'var(--fs-gray-900)' },
                      { label: 'Watchers', value: stats.totalWatchers, change: '+12 this week', color: 'var(--fs-amber)' },
                    ].map((stat, i) => (
                      <div key={i} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                        <p style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</p>
                        <p style={{ fontSize: 12, color: "var(--fs-gray-500)", marginBottom: 4 }}>{stat.label}</p>
                        <p style={{ fontSize: 11, color: "#10b981", fontWeight: 500 }}>{stat.change}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                    {/* Recent Activity */}
                    <div className="fs-detail-specs" style={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Activity</h3>
                        <button style={{ fontSize: 13, color: 'var(--fs-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                      </div>
                      <div style={{ padding: "8px 0" }}>
                        {activities.map(activity => (
                          <div key={activity.id} style={{ padding: "16px 20px", display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: "1px solid var(--fs-gray-50)" }}>
                            <div style={{ 
                              width: 36, 
                              height: 36, 
                              borderRadius: 8, 
                              background: activity.type === 'enquiry' ? '#dcfce7' : activity.type === 'alert' ? '#fef3c7' : '#eff6ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: activity.type === 'enquiry' ? '#166534' : activity.type === 'alert' ? '#92400e' : 'var(--fs-blue)',
                              flexShrink: 0
                            }}>
                              {activity.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, marginBottom: 2 }}>{activity.message}</p>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12, marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <button 
                            onClick={() => setPage('sell')}
                            style={{ 
                              padding: "12px 16px", 
                              background: "var(--fs-gray-900)", 
                              color: "white",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 14,
                              cursor: "pointer",
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10
                            }}
                          >
                            <span>+</span> List New Aircraft
                          </button>
                          <button 
                            onClick={() => setActiveTab('enquiries')}
                            style={{ 
                              padding: "12px 16px", 
                              background: "var(--fs-gray-100)", 
                              color: "var(--fs-gray-900)",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 14,
                              cursor: "pointer",
                              textAlign: 'left'
                            }}
                          >
                            {stats.newEnquiries > 0 ? `📬 ${stats.newEnquiries} New Enquiries` : '📬 View Enquiries'}
                          </button>
                        </div>
                      </div>

                      {/* Tips Card */}
                      <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12, background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>💡 Selling Tip</h3>
                        <p style={{ fontSize: 13, color: 'var(--fs-gray-600)', lineHeight: 1.5 }}>
                          Aircraft with 10+ photos get 3x more enquiries. Add more photos to your listings to increase visibility.
                        </p>
                        <button 
                          onClick={() => setActiveTab('listings')}
                          style={{ 
                            marginTop: 12,
                            fontSize: 13, 
                            color: 'var(--fs-blue)', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Update Listings →
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* LISTINGS TAB - TABLE VIEW */}
              {activeTab === 'listings' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>My Listings</h3>
                    <button 
                      className="fs-nav-btn-primary"
                      onClick={() => setPage('sell')}
                    >
                      + Add Listing
                    </button>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>✈️</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No active listings</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                        Get started by listing your first aircraft. It only takes a few minutes and you'll reach thousands of qualified buyers.
                      </p>
                      <button 
                        className="fs-nav-btn-primary"
                        onClick={() => setPage('sell')}
                        style={{ fontSize: 15, padding: '14px 28px' }}
                      >
                        List Your Aircraft
                      </button>
                    </div>
                  ) : (
                    <div className="fs-detail-specs" style={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--fs-gray-200)", background: '#fafafa' }}>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Aircraft</th>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Price</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Views</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Enquiries</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                            <th style={{ padding: "16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myListings.map(listing => (
                            <tr key={listing.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                              <td style={{ padding: "16px" }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <img src={listing.image} alt={listing.title} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                                  <div>
                                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{listing.title}</p>
                                    <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{listing.daysListed} days listed</p>
                                  </div>
                                  {listing.featured && (
                                    <span style={{ 
                                      padding: "2px 8px", 
                                      borderRadius: 4, 
                                      fontSize: 10,
                                      background: '#fef3c7',
                                      color: '#92400e',
                                      fontWeight: 600
                                    }}>FEATURED</span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: "16px", fontWeight: 600 }}>${listing.price.toLocaleString()}</td>
                              <td style={{ padding: "16px", textAlign: "center" }}>{listing.views.toLocaleString()}</td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <span style={{ 
                                  padding: "4px 10px", 
                                  borderRadius: 10, 
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: listing.enquiries > 0 ? '#dcfce7' : 'transparent',
                                  color: listing.enquiries > 0 ? '#166534' : 'var(--fs-gray-500)'
                                }}>
                                  {listing.enquiries}
                                </span>
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <span style={{ 
                                  padding: "4px 12px", 
                                  borderRadius: 4, 
                                  fontSize: 12, 
                                  fontWeight: 500,
                                  background: listing.status === 'active' ? '#dcfce7' : '#fef3c7',
                                  color: listing.status === 'active' ? '#166534' : '#92400e',
                                  textTransform: 'capitalize'
                                }}>
                                  {listing.status}
                                </span>
                              </td>
                              <td style={{ padding: "16px", textAlign: "right" }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <button style={{ padding: "6px 12px", background: "var(--fs-gray-100)", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Edit</button>
                                  <button style={{ padding: "6px 12px", background: "var(--fs-blue)", color: 'white', border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Boost</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                        <ListingCard key={listing.id} listing={listing} onClick={onSelectListing} onSave={onSave} saved={true} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ENQUIRIES TAB - CRM STYLE */}
              {activeTab === 'enquiries' && (
                <>
                  {!selectedEnquiry ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Enquiries</h3>
                          <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Manage leads and respond to buyer questions</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['all', 'new', 'contacted', 'negotiating'].map(filter => (
                            <button 
                              key={filter}
                              style={{ 
                                padding: "8px 16px", 
                                background: "var(--fs-gray-100)", 
                                border: "none",
                                borderRadius: 6,
                                fontSize: 13,
                                cursor: "pointer",
                                textTransform: 'capitalize'
                              }}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                      </div>

                      {myEnquiries.filter(e => e.status !== 'spam').length === 0 ? (
                        <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                          <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.mail}</div>
                          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No enquiries yet</h3>
                          <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                            When buyers contact you about your listings, they'll appear here. Make sure your listings have great photos and descriptions!
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {myEnquiries.filter(e => e.status !== 'spam').map(enquiry => (
                            <div 
                              key={enquiry.id} 
                              className="fs-detail-specs" 
                              style={{ padding: "20px", borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                              onClick={() => setSelectedEnquiry(enquiry)}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--fs-shadow)'}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{ 
                                    width: 44, 
                                    height: 44, 
                                    borderRadius: '50%', 
                                    background: 'var(--fs-gray-100)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: 'var(--fs-gray-600)'
                                  }}>
                                    {enquiry.from.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{enquiry.from}</h4>
                                    <p style={{ fontSize: 13, color: "var(--fs-gray-500)" }}>Re: {enquiry.aircraft}</p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  {getStatusBadge(enquiry.status)}
                                  <span style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{formatTimeAgo(enquiry.date)}</span>
                                </div>
                              </div>
                              <p style={{ fontSize: 14, color: "var(--fs-gray-700)", marginBottom: 16, lineHeight: 1.5, paddingLeft: 56 }}>
                                "{enquiry.message.substring(0, 120)}{enquiry.message.length > 120 ? '...' : ''}"
                              </p>
                              {enquiry.replies.length > 0 && (
                                <div style={{ paddingLeft: 56, marginTop: 8 }}>
                                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>
                                    ✓ You replied {formatTimeAgo(enquiry.replies[enquiry.replies.length - 1].date)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Enquiry Detail View */
                    <div>
                      <button 
                        onClick={() => setSelectedEnquiry(null)}
                        style={{ 
                          marginBottom: 16,
                          fontSize: 14, 
                          color: 'var(--fs-gray-500)', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        ← Back to enquiries
                      </button>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
                        {/* Message Thread */}
                        <div className="fs-detail-specs" style={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}>
                          <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                              <div style={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: '50%', 
                                background: 'var(--fs-gray-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                fontWeight: 600,
                                color: 'var(--fs-gray-600)'
                              }}>
                                {selectedEnquiry.from.charAt(0)}
                              </div>
                              <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selectedEnquiry.from}</h3>
                                <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Re: {selectedEnquiry.aircraft}</p>
                              </div>
                            </div>
                            {getStatusBadge(selectedEnquiry.status)}
                          </div>

                          <div style={{ padding: "20px", maxHeight: 400, overflowY: 'auto' }}>
                            {/* Original Message */}
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ 
                                  width: 32, 
                                  height: 32, 
                                  borderRadius: '50%', 
                                  background: 'var(--fs-gray-100)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: 'var(--fs-gray-600)',
                                  flexShrink: 0
                                }}>
                                  {selectedEnquiry.from.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 12, borderBottomLeftRadius: 4 }}>
                                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>{selectedEnquiry.message}</p>
                                  </div>
                                  <p style={{ fontSize: 11, color: 'var(--fs-gray-400)', marginTop: 4 }}>{formatTimeAgo(selectedEnquiry.date)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Replies */}
                            {selectedEnquiry.replies.map((reply, idx) => (
                              <div key={idx} style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', gap: 12, flexDirection: 'row-reverse' }}>
                                  <div style={{ 
                                    width: 32, 
                                    height: 32, 
                                    borderRadius: '50%', 
                                    background: 'var(--fs-blue)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: 'white',
                                    flexShrink: 0
                                  }}>
                                    You
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ background: '#eff6ff', padding: 12, borderRadius: 12, borderBottomRightRadius: 4 }}>
                                      <p style={{ fontSize: 14, lineHeight: 1.6 }}>{reply.message}</p>
                                    </div>
                                    <p style={{ fontSize: 11, color: 'var(--fs-gray-400)', marginTop: 4, textAlign: 'right' }}>{formatTimeAgo(reply.date)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Reply Input */}
                          <div style={{ padding: "20px", borderTop: "1px solid var(--fs-gray-100)" }}>
                            <textarea
                              className="fs-form-textarea"
                              placeholder="Type your reply..."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              style={{ minHeight: 80, marginBottom: 12 }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>Buyer will be notified by email</span>
                              <button 
                                onClick={() => handleReplySubmit(selectedEnquiry.id)}
                                disabled={!replyText.trim()}
                                className="fs-form-submit"
                                style={{ width: 'auto', padding: '10px 24px' }}
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sidebar */}
                        <div>
                          {/* Buyer Info */}
                          <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12, marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fs-gray-500)' }}>Buyer Details</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <a href={`mailto:${selectedEnquiry.email}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--fs-blue)" }}>
                                {Icons.mail} {selectedEnquiry.email}
                              </a>
                              <a href={`tel:${selectedEnquiry.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--fs-blue)" }}>
                                {Icons.phone} {selectedEnquiry.phone}
                              </a>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12, marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fs-gray-500)' }}>Actions</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {['new', 'contacted', 'negotiating', 'sold', 'archived'].map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleEnquiryStatusChange(selectedEnquiry.id, status)}
                                  style={{ 
                                    padding: "10px 16px", 
                                    background: selectedEnquiry.status === status ? '#eff6ff' : 'var(--fs-gray-100)', 
                                    color: selectedEnquiry.status === status ? 'var(--fs-blue)' : 'var(--fs-gray-700)',
                                    border: selectedEnquiry.status === status ? '1px solid var(--fs-blue)' : 'none',
                                    borderRadius: 8,
                                    fontSize: 13,
                                    cursor: "pointer",
                                    textAlign: 'left',
                                    textTransform: 'capitalize',
                                    fontWeight: selectedEnquiry.status === status ? 600 : 400
                                  }}
                                >
                                  {status === 'new' && '✨ '} 
                                  {status === 'contacted' && '✓ '} 
                                  {status === 'negotiating' && '💬 '} 
                                  {status === 'sold' && '🎉 '} 
                                  {status === 'archived' && '📁 '}
                                  Mark as {status}
                                </button>
                              ))}
                              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--fs-gray-200)' }} />
                              <button
                                onClick={() => handleMarkSpam(selectedEnquiry.id)}
                                style={{ 
                                  padding: "10px 16px", 
                                  background: 'transparent', 
                                  color: '#ef4444',
                                  border: 'none',
                                  borderRadius: 8,
                                  fontSize: 13,
                                  cursor: "pointer",
                                  textAlign: 'left'
                                }}
                              >
                                🚫 Mark as spam
                              </button>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fs-gray-500)' }}>Private Notes</h4>
                            <textarea
                              className="fs-form-textarea"
                              placeholder="Add notes about this buyer (only visible to you)..."
                              style={{ minHeight: 100, fontSize: 13 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PROFILE SETTINGS TAB */}
              {/* DRAFTS TAB */}
              {activeTab === 'drafts' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Manage Ad or Draft</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Continue editing your saved drafts</p>
                    </div>
                    <button 
                      className="fs-nav-btn-primary"
                      onClick={() => setPage('sell')}
                    >
                      + New Draft
                    </button>
                  </div>

                  {drafts.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.file}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No drafts</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        Start creating a listing and save it as a draft to finish later.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {drafts.map(draft => (
                        <div key={draft.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{draft.title}</h4>
                            <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Last edited: {draft.lastEdited}</p>
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 120, height: 6, background: '#e5e5e5', borderRadius: 3 }}>
                                <div style={{ width: `${draft.progress}%`, height: '100%', background: 'var(--fs-blue)', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--fs-gray-500)' }}>{draft.progress}% complete</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ padding: "8px 16px", background: "var(--fs-gray-100)", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Delete</button>
                            <button style={{ padding: "8px 16px", background: "var(--fs-blue)", color: 'white', border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Continue</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* RECEIVED OFFERS TAB */}
              {activeTab === 'receivedOffers' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Manage Your Offers</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Offers received on your listings</p>
                    </div>
                  </div>

                  {receivedOffers.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.tag}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No offers yet</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        When buyers make offers on your aircraft, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {receivedOffers.map(offer => (
                        <div key={offer.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{offer.aircraft}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>From: {offer.from}</p>
                            </div>
                            <span style={{ 
                              padding: "4px 12px", 
                              borderRadius: 4, 
                              fontSize: 12,
                              background: offer.status === 'pending' ? '#fef3c7' : '#dcfce7',
                              color: offer.status === 'pending' ? '#92400e' : '#166534',
                              textTransform: 'capitalize'
                            }}>
                              {offer.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "12px", background: "var(--fs-gray-50)", borderRadius: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Offer Amount</span>
                            <span style={{ fontSize: 18, fontWeight: 700 }}>${offer.amount.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button style={{ padding: "8px 16px", background: "var(--fs-gray-100)", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Decline</button>
                            <button style={{ padding: "8px 16px", background: "var(--fs-blue)", color: 'white', border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Accept</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* MY OFFERS (MADE) TAB */}
              {activeTab === 'myOffers' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>My Instant Offers</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Offers you've made on aircraft</p>
                    </div>
                  </div>

                  {myOffers.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.dollar}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No offers made</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        When you make offers on aircraft, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {myOffers.map(offer => (
                        <div key={offer.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{offer.aircraft}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>To: {offer.to}</p>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-400)', marginTop: 4 }}>Made: {offer.date}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 18, fontWeight: 700 }}>${offer.amount.toLocaleString()}</p>
                              <span style={{ 
                                padding: "4px 12px", 
                                borderRadius: 4, 
                                fontSize: 12,
                                background: offer.status === 'pending' ? '#fef3c7' : offer.status === 'accepted' ? '#dcfce7' : '#fee2e2',
                                color: offer.status === 'pending' ? '#92400e' : offer.status === 'accepted' ? '#166534' : '#991b1b',
                                textTransform: 'capitalize'
                              }}>
                                {offer.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* SAVED SEARCHES TAB */}
              {activeTab === 'savedSearches' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Saved Searches</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Get alerts for new matching aircraft</p>
                    </div>
                  </div>

                  {savedSearches.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.search}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No saved searches</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        Save your searches to get notified when new aircraft match your criteria.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {savedSearches.map(search => (
                        <div key={search.id} className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{search.name}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-blue)' }}>{search.count} new matches</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, color: search.alerts ? '#10b981' : 'var(--fs-gray-400)' }}>
                                {search.alerts ? '🔔 Alerts on' : '🔕 Alerts off'}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {Object.entries(search.filters).map(([key, value]) => (
                              <span key={key} style={{ padding: "4px 10px", background: "var(--fs-gray-100)", borderRadius: 4, fontSize: 12 }}>
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--fs-gray-200)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Delete</button>
                            <button style={{ padding: "8px 16px", background: "var(--fs-blue)", color: 'white', border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>View Results</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Notification Preferences</h3>
                  <div className="fs-detail-specs" style={{ padding: "24px", borderRadius: 12 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Email Notifications</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                      {[
                        { key: 'emailEnquiries', label: 'New enquiries on my listings', desc: 'When someone contacts you about your aircraft' },
                        { key: 'emailOffers', label: 'Offers on my listings', desc: 'When someone makes an offer on your aircraft' },
                        { key: 'emailSavedSearch', label: 'Saved search alerts', desc: 'When new aircraft match your saved searches' },
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              width: 48,
                              height: 24,
                              borderRadius: 12,
                              background: notifications[item.key] ? 'var(--fs-blue)' : 'var(--fs-gray-200)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: notifications[item.key] ? 26 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s'
                            }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>SMS Notifications</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                      {[
                        { key: 'smsEnquiries', label: 'New enquiries', desc: 'Text message for urgent enquiries' },
                        { key: 'smsOffers', label: 'New offers', desc: 'Text message when you receive an offer' },
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              width: 48,
                              height: 24,
                              borderRadius: 12,
                              background: notifications[item.key] ? 'var(--fs-blue)' : 'var(--fs-gray-200)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: notifications[item.key] ? 26 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s'
                            }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Other</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        { key: 'marketingEmails', label: 'Marketing emails', desc: 'Promotions, tips, and news from Flightsales' },
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              width: 48,
                              height: 24,
                              borderRadius: 12,
                              background: notifications[item.key] ? 'var(--fs-blue)' : 'var(--fs-gray-200)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: notifications[item.key] ? 26 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s'
                            }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* DISCOUNTS TAB */}
              {activeTab === 'discounts' && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Discounts</h3>
                      <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Your available promo codes</p>
                    </div>
                  </div>

                  {discounts.length === 0 ? (
                    <div className="fs-detail-specs" style={{ padding: "64px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.gift}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No discounts</h3>
                      <p style={{ fontSize: 15, color: "var(--fs-gray-500)", maxWidth: 400, margin: '0 auto' }}>
                        Check back for special offers and promotions.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                      {discounts.map(discount => (
                        <div key={discount.id} className="fs-detail-specs" style={{ padding: "24px", borderRadius: 12, position: 'relative', opacity: discount.used ? 0.6 : 1 }}>
                          {discount.used && (
                            <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 8px', background: 'var(--fs-gray-200)', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>USED</div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                              🎁
                            </div>
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 700 }}>{discount.discount}</h4>
                              <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Expires: {discount.expiry}</p>
                            </div>
                          </div>
                          <div style={{ padding: "12px", background: "var(--fs-gray-100)", borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <code style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>{discount.code}</code>
                            {!discount.used && (
                              <button style={{ padding: "6px 12px", background: "var(--fs-blue)", color: 'white', border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Copy</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

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
                            disabled={savingProfile}
                            style={{ opacity: savingProfile ? 0.7 : 1 }}
                          >
                            {savingProfile ? "Saving..." : "Save Changes"}
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

const AdminPage = ({ user, setPage, signOut }) => {
  if (!user || user.role !== 'admin') {
    setPage('login');
    return null;
  }

  const [activeTab, setActiveTab] = useState('listings');
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  const mockListings = [
    { id: 1, title: '2018 Cirrus SR22T', price: 895000, seller: 'Southern Aviation', status: 'pending', date: '2026-03-22' },
    { id: 2, title: '2005 Cessna 182T', price: 385000, seller: 'Private', status: 'active', date: '2026-03-21' },
  ];

  const mockUsers = [
    { id: 1, name: 'John Smith', email: 'john@example.com', role: 'private', listings: 2 },
    { id: 2, name: 'Southern Aviation', email: 'sales@southernav.com', role: 'dealer', listings: 14 },
  ];

  // Lead Management - For finance/insurance/valuation providers
  const [leads, setLeads] = useState([
    { 
      id: 1, 
      type: 'finance', 
      name: 'John Smith', 
      email: 'john@email.com', 
      phone: '0412 345 678',
      aircraft: '2018 Cirrus SR22T',
      amount: 750000,
      status: 'new',
      provider: null,
      notes: 'Looking for 80% LVR, 10 year term',
      date: '2026-03-22T10:30:00',
      assignedTo: null
    },
    { 
      id: 2, 
      type: 'insurance', 
      name: 'Sarah Chen', 
      email: 'sarah@aviation.com', 
      phone: '0433 999 111',
      aircraft: '2020 Piper Archer',
      amount: 450000,
      status: 'contacted',
      provider: 'Avemco Insurance',
      notes: 'Needs comprehensive hull coverage',
      date: '2026-03-21T14:15:00',
      assignedTo: 'Team Member A'
    },
    { 
      id: 3, 
      type: 'finance', 
      name: 'Mike Johnson', 
      email: 'mike@outlook.com', 
      phone: '0400 222 444',
      aircraft: '2015 Cessna 182',
      amount: 320000,
      status: 'qualified',
      provider: 'Aviation Finance Australia',
      notes: 'Pre-approved, ready to proceed',
      date: '2026-03-20T09:00:00',
      assignedTo: 'Team Member B'
    },
    { 
      id: 4, 
      type: 'valuation', 
      name: 'Aviation Group Pty Ltd', 
      email: 'admin@aviagroup.com', 
      phone: '02 9999 8888',
      aircraft: 'Fleet of 5 aircraft',
      amount: null,
      status: 'new',
      provider: null,
      notes: 'Commercial valuation required for insurance renewal',
      date: '2026-03-22T16:45:00',
      assignedTo: null
    },
  ]);

  const handleLeadStatusChange = (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const handleAssignProvider = (leadId, provider) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, provider, status: 'assigned' } : l));
  };

  const getLeadTypeLabel = (type) => {
    const labels = { finance: '💰 Finance', insurance: '🛡️ Insurance', valuation: '📊 Valuation' };
    return labels[type] || type;
  };

  const getLeadStatusBadge = (status) => {
    const styles = {
      new: { bg: '#dcfce7', color: '#166534', label: 'New' },
      contacted: { bg: '#dbeafe', color: '#1e40af', label: 'Contacted' },
      qualified: { bg: '#fef3c7', color: '#92400e', label: 'Qualified' },
      assigned: { bg: '#e0e7ff', color: '#3730a3', label: 'Assigned' },
      converted: { bg: '#d1fae5', color: '#065f46', label: 'Converted' },
      lost: { bg: '#fee2e2', color: '#991b1b', label: 'Lost' }
    };
    const s = styles[status] || styles.new;
    return <span style={{ padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>{s.label}</span>;
  };

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
              onClick={async () => { await signOut(); setPage('home'); }}
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
          <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--fs-gray-200)", flexWrap: 'wrap' }}>
            {[
              { id: 'listings', label: 'Listings' },
              { id: 'users', label: 'Users' },
              { id: 'dealers', label: 'Dealer Applications' },
              { id: 'enquiries', label: 'Enquiries' },
              { id: 'leads', label: 'Lead Management', badge: leads.filter(l => l.status === 'new').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedLead(null); }}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid var(--fs-blue)" : "2px solid transparent",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? "var(--fs-blue)" : "var(--fs-gray-500)",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{ 
                    background: activeTab === tab.id ? 'var(--fs-blue)' : 'var(--fs-gray-200)', 
                    color: activeTab === tab.id ? 'white' : 'var(--fs-gray-600)', 
                    fontSize: 11, 
                    padding: '2px 8px', 
                    borderRadius: 10,
                    fontWeight: 600
                  }}>
                    {tab.badge}
                  </span>
                )}
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

            {/* LEAD MANAGEMENT TAB */}
            {activeTab === 'leads' && (
              <>
                {!selectedLead ? (
                  <>
                    <div style={{ padding: "20px", borderBottom: "1px solid var(--fs-gray-100)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Lead Management</h3>
                        <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Finance, Insurance & Valuation inquiries</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['all', 'finance', 'insurance', 'valuation'].map(filter => (
                          <button 
                            key={filter}
                            onClick={() => setLeadStatusFilter(filter)}
                            style={{ 
                              padding: "6px 12px", 
                              background: leadStatusFilter === filter ? 'var(--fs-blue)' : 'var(--fs-gray-100)', 
                              color: leadStatusFilter === filter ? 'white' : 'var(--fs-gray-700)',
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: "pointer",
                              textTransform: 'capitalize'
                            }}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--fs-gray-200)", background: '#fafafa' }}>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Type</th>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Contact</th>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Aircraft/Amount</th>
                          <th style={{ padding: "16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                          <th style={{ padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Provider</th>
                          <th style={{ padding: "16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--fs-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads
                          .filter(l => leadStatusFilter === 'all' || l.type === leadStatusFilter)
                          .map(lead => (
                          <tr key={lead.id} style={{ borderBottom: "1px solid var(--fs-gray-100)" }}>
                            <td style={{ padding: "16px" }}>
                              <span style={{ fontSize: 13 }}>{getLeadTypeLabel(lead.type)}</span>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <p style={{ fontWeight: 500, fontSize: 14 }}>{lead.name}</p>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{lead.email}</p>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <p style={{ fontSize: 14 }}>{lead.aircraft}</p>
                              {lead.amount && <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>${lead.amount.toLocaleString()}</p>}
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              {getLeadStatusBadge(lead.status)}
                            </td>
                            <td style={{ padding: "16px" }}>
                              {lead.provider ? (
                                <span style={{ fontSize: 13 }}>{lead.provider}</span>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--fs-gray-400)', fontStyle: 'italic' }}>Unassigned</span>
                              )}
                            </td>
                            <td style={{ padding: "16px", textAlign: "right" }}>
                              <button 
                                onClick={() => setSelectedLead(lead)}
                                style={{ 
                                  padding: "6px 12px", 
                                  background: "var(--fs-blue)", 
                                  color: "white",
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: "pointer"
                                }}
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  /* Lead Detail View */
                  <div style={{ padding: "24px" }}>
                    <button 
                      onClick={() => setSelectedLead(null)}
                      style={{ 
                        marginBottom: 16,
                        fontSize: 14, 
                        color: 'var(--fs-gray-500)', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      ← Back to leads
                    </button>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                      {/* Main Info */}
                      <div>
                        <div className="fs-detail-specs" style={{ padding: "24px", borderRadius: 12, marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{selectedLead.name}</h2>
                              <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>{getLeadTypeLabel(selectedLead.type)} • {selectedLead.aircraft}</p>
                            </div>
                            {getLeadStatusBadge(selectedLead.status)}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Email</p>
                              <a href={`mailto:${selectedLead.email}`} style={{ fontSize: 14, color: 'var(--fs-blue)' }}>{selectedLead.email}</a>
                            </div>
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Phone</p>
                              <a href={`tel:${selectedLead.phone}`} style={{ fontSize: 14, color: 'var(--fs-blue)' }}>{selectedLead.phone}</a>
                            </div>
                            {selectedLead.amount && (
                              <div>
                                <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Amount</p>
                                <p style={{ fontSize: 14, fontWeight: 600 }}>${selectedLead.amount.toLocaleString()}</p>
                              </div>
                            )}
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 4 }}>Received</p>
                              <p style={{ fontSize: 14 }}>{new Date(selectedLead.date).toLocaleString()}</p>
                            </div>
                          </div>

                          <div>
                            <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginBottom: 8 }}>Notes</p>
                            <p style={{ fontSize: 14, lineHeight: 1.6, padding: 12, background: '#f9fafb', borderRadius: 8 }}>{selectedLead.notes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar Actions */}
                      <div>
                        <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12, marginBottom: 16 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Update Status</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['new', 'contacted', 'qualified', 'assigned', 'converted', 'lost'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleLeadStatusChange(selectedLead.id, status)}
                                style={{ 
                                  padding: "10px 16px", 
                                  background: selectedLead.status === status ? '#eff6ff' : 'var(--fs-gray-100)', 
                                  color: selectedLead.status === status ? 'var(--fs-blue)' : 'var(--fs-gray-700)',
                                  border: selectedLead.status === status ? '1px solid var(--fs-blue)' : 'none',
                                  borderRadius: 8,
                                  fontSize: 13,
                                  cursor: "pointer",
                                  textAlign: 'left',
                                  textTransform: 'capitalize',
                                  fontWeight: selectedLead.status === status ? 600 : 400
                                }}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12, marginBottom: 16 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Assign Provider</h4>
                          <select 
                            className="fs-form-select"
                            value={selectedLead.provider || ''}
                            onChange={(e) => handleAssignProvider(selectedLead.id, e.target.value)}
                            style={{ marginBottom: 12 }}
                          >
                            <option value="">Select Provider...</option>
                            {selectedLead.type === 'finance' && (
                              <>
                                <option value="Aviation Finance Australia">Aviation Finance Australia</option>
                                <option value="Aircraft Lending Centre">Aircraft Lending Centre</option>
                                <option value="Bank of Queensland Aviation">Bank of Queensland Aviation</option>
                              </>
                            )}
                            {selectedLead.type === 'insurance' && (
                              <>
                                <option value="Avemco Insurance">Avemco Insurance</option>
                                <option value="QBE Aviation">QBE Aviation</option>
                                <option value="Allianz Aircraft Insurance">Allianz Aircraft Insurance</option>
                              </>
                            )}
                            {selectedLead.type === 'valuation' && (
                              <>
                                <option value="Aircraft Valuations Pty Ltd">Aircraft Valuations Pty Ltd</option>
                                <option value="ASA Accredited Appraiser">ASA Accredited Appraiser</option>
                              </>
                            )}
                          </select>
                          <button className="fs-form-submit" style={{ width: '100%' }}>
                            Send to Provider
                          </button>
                        </div>

                        <div className="fs-detail-specs" style={{ padding: "20px", borderRadius: 12 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Staff Notes</h4>
                          <textarea
                            className="fs-form-textarea"
                            placeholder="Add internal notes..."
                            style={{ minHeight: 100, fontSize: 13 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
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
  const [toast, setToast] = useState(null);
  const [searchFilters, setSearchFilters] = useState(null);

  // Real auth
  const { user: authUser, loading: authLoading, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const { profile } = useProfile(authUser?.id);

  // Construct a user object compatible with all child components
  const user = authUser ? {
    id: authUser.id,
    email: authUser.email,
    full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
    phone: profile?.phone || '',
    location: profile?.location || '',
    role: profile?.is_dealer ? 'dealer' : (authUser.email === 'admin@flightsales.com.au' ? 'admin' : 'private'),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || authUser.email || 'User')}&background=0a0a0a&color=fff`,
    created_at: authUser.created_at
  } : null;

  // Real saved aircraft
  const { savedIds, savedListings, toggleSave } = useSavedAircraft(authUser?.id);

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

  const onSave = async (id) => {
    if (!authUser) { setToast("Sign in to save aircraft"); return; }
    const isSaved = await toggleSave(id);
    setToast(isSaved ? "Added to watchlist ❤️" : "Removed from watchlist");
  };

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }
  }, [toast]);

  const getBreadcrumbs = () => {
    const crumbs = { home: [], buy: [['home', 'Home'], ['buy', 'Buy Aircraft']], detail: [['home', 'Home'], ['buy', 'Buy Aircraft'], ['detail', 'Aircraft Details']], sell: [['home', 'Home'], ['sell', 'Sell Aircraft']], dealers: [['home', 'Home'], ['dealers', 'Dealers']], news: [['home', 'Home'], ['news', 'News']], valuate: [['home', 'Home'], ['valuate', 'Valuation']], about: [['home', 'Home'], ['about', 'About Us']], contact: [['home', 'Home'], ['contact', 'Contact']], login: [['home', 'Home'], ['login', 'Sign In']], dashboard: [['home', 'Home'], ['dashboard', 'Dashboard']], admin: [['home', 'Home'], ['admin', 'Admin']] };
    return crumbs[page] || [];
  };

  const Breadcrumbs = () => {
    const crumbs = getBreadcrumbs();
    if (crumbs.length === 0) return null;
    return (
      <div className="fs-container" style={{ paddingTop: 16, paddingBottom: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--fs-gray-500)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {crumbs.map(([p, label], i) => (
            <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <span>{Icons.chevronRight}</span>}
              <button onClick={() => setPageWrap(p)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: i === crumbs.length - 1 ? 'var(--fs-gray-900)' : 'var(--fs-gray-500)', fontWeight: i === crumbs.length - 1 ? 600 : 400, fontSize: 13 }}>{label}</button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{STYLES}</style>
      <Nav page={page} setPage={setPageWrap} setMobileOpen={setMobileOpen} mobileOpen={mobileOpen} user={user} />
      {page !== 'home' && page !== 'detail' && <Breadcrumbs />}

      {page === "home" && <HomePage setPage={setPageWrap} setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} setSearchFilters={setSearchFilters} />}
      {page === "buy" && <BuyPage setSelectedListing={setSelectedListing} savedIds={savedIds} onSave={onSave} initialFilters={searchFilters} />}
      {page === "detail" && <ListingDetail listing={selectedListing} onBack={() => setPageWrap("buy")} savedIds={savedIds} onSave={onSave} user={user} />}
      {page === "sell" && <SellPage user={user} setPage={setPageWrap} />}
      {page === "dealers" && <DealersPage />}
      {page === "valuate" && <ContactPage />}
      {page === "news" && <NewsPage />}
      {page === "about" && <AboutPage />}
      {page === "contact" && <ContactPage />}
      {page === "login" && <LoginPage setPage={setPageWrap} signIn={signIn} signUp={signUp} signInWithGoogle={signInWithGoogle} />}
      {page === "dashboard" && <DashboardPage user={user} setPage={setPageWrap} signOut={signOut} savedIds={savedIds} savedListings={savedListings} onSave={onSave} onSelectListing={setSelectedListing} />}
      {page === "admin" && <AdminPage user={user} setPage={setPageWrap} signOut={signOut} />}
      {(page === "finance" || page === "insurance") && <ContactPage />}

      <Footer setPage={setPageWrap} />

      {toast && (
        <div className="fs-toast">
          {Icons.check} {toast}
        </div>
      )}
    </>
  );
}
