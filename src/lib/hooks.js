import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// Helper to check if Supabase is properly configured
function isSupabaseConfigured() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder';
}

// ─── Aircraft ───────────────────────────────────────────────────────────────

export function useAircraft(filters = {}) {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  // Destructure to primitives so useCallback can depend on each value directly.
  // Avoids the JSON.stringify(filters) hack that ran on every render.
  // Multi-select fields (categories, manufacturers, states, conditions) are
  // arrays — joined to a string for the dep array so identity churn doesn't
  // refetch when the contents are unchanged.
  const {
    // legacy single-string filters kept for back-compat with hooks that still
    // pass scalars (useFeaturedAircraft, dealer detail page, etc.)
    category, manufacturer, state, condition, dealerId,
    // new array-shaped multi-select fields used by BuyPage
    categories, manufacturers, states, conditions,
    engineCounts, engineTypes, engineMakes,
    avionicsSuites, autopilots, damageHistory,
    minPrice, maxPrice, maxHours, ifrOnly, glassOnly,
    yearFrom, yearTo,
    cruiseMin, rangeMin, usefulLoadMin, fuelBurnMax,
    mtowMin, mtowMax, ceilingMin,
    smohMax, tboPctMin,
    adsbIn, adsbOut, synVis, deIce, airCon,
    retractable, pressurised, cargoDoor, parachute,
    logbooksComplete, hangared, ownerMaxCount,
    dealerOnly, privateOnly, featuredOnly,
    search, sortBy, page, pageSize,
  } = filters;

  const catKey = (categories || []).join('|');
  const makeKey = (manufacturers || []).join('|');
  const stateKey = (states || []).join('|');
  const condKey = (conditions || []).join('|');
  const engCountKey = (engineCounts || []).join('|');
  const engTypeKey = (engineTypes || []).join('|');
  const engMakeKey = (engineMakes || []).join('|');
  const avSuiteKey = (avionicsSuites || []).join('|');
  const apKey = (autopilots || []).join('|');
  const damageKey = (damageHistory || []).join('|');

  const fetchAircraft = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setAircraft([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('aircraft')
        .select(`*, dealer:dealers(id, name, location, rating, verified)`, { count: 'exact' })
        .eq('status', 'active');

      // Single-string back-compat path (used by Home / dealer detail).
      if (category) query = query.eq('category', category);
      if (manufacturer) query = query.eq('manufacturer', manufacturer);
      if (state) query = query.eq('state', state);
      if (condition) query = query.eq('condition', condition);
      if (dealerId) query = query.eq('dealer_id', dealerId);

      // New multi-select path — Supabase `.in()` for OR-within-field.
      if (categories && categories.length) query = query.in('category', categories);
      if (manufacturers && manufacturers.length) query = query.in('manufacturer', manufacturers);
      if (states && states.length) query = query.in('state', states);
      if (conditions && conditions.length) query = query.in('condition', conditions);

      // Numeric ranges
      if (minPrice) query = query.gte('price', Number(minPrice));
      if (maxPrice) query = query.lte('price', Number(maxPrice));
      if (yearFrom) query = query.gte('year', Number(yearFrom));
      if (yearTo) query = query.lte('year', Number(yearTo));
      if (maxHours) query = query.lte('ttaf', Number(maxHours));

      // Performance specs
      if (cruiseMin) query = query.gte('cruise_kts', Number(cruiseMin));
      if (rangeMin) query = query.gte('range_nm', Number(rangeMin));
      if (usefulLoadMin) query = query.gte('useful_load', Number(usefulLoadMin));
      if (fuelBurnMax) query = query.lte('fuel_burn', Number(fuelBurnMax));
      if (mtowMin) query = query.gte('mtow', Number(mtowMin));
      if (mtowMax) query = query.lte('mtow', Number(mtowMax));
      if (ceilingMin) query = query.gte('service_ceiling', Number(ceilingMin));

      // Engine
      if (engineCounts && engineCounts.length) query = query.in('engine_count', engineCounts.map(Number));
      if (engineTypes && engineTypes.length) query = query.in('engine_type', engineTypes);
      if (engineMakes && engineMakes.length) query = query.in('engine_make', engineMakes);
      if (smohMax) query = query.lte('eng_hours', Number(smohMax));
      if (tboPctMin) {
        // TBO remaining % is (eng_tbo - eng_hours) / eng_tbo * 100. Computed
        // client-side after fetch — Supabase doesn't have computed-column
        // .filter without an RPC and we'd rather keep the query path simple.
      }

      // Avionics & equipment
      if (avionicsSuites && avionicsSuites.length) query = query.in('avionics_suite', avionicsSuites);
      if (autopilots && autopilots.length) query = query.in('autopilot', autopilots);
      if (ifrOnly) query = query.eq('ifr', true);
      if (glassOnly) query = query.eq('glass_cockpit', true);
      if (retractable) query = query.eq('retractable', true);
      if (pressurised) query = query.eq('pressurised', true);
      if (adsbIn) query = query.eq('adsb_in', true);
      if (adsbOut) query = query.eq('adsb_out', true);
      if (synVis) query = query.eq('syn_vis', true);
      if (deIce) query = query.eq('de_ice', true);
      if (airCon) query = query.eq('air_con', true);
      if (cargoDoor) query = query.eq('cargo_door', true);
      if (parachute) query = query.eq('parachute', true);

      // History & condition
      if (damageHistory && damageHistory.length) query = query.in('damage_history', damageHistory);
      if (logbooksComplete) query = query.eq('logbooks_complete', true);
      if (hangared) query = query.eq('hangared', true);
      if (ownerMaxCount) query = query.lte('owner_count', Number(ownerMaxCount));

      // Seller filters
      if (dealerOnly && !privateOnly) query = query.not('dealer_id', 'is', null);
      if (privateOnly && !dealerOnly) query = query.is('dealer_id', null);
      if (featuredOnly) query = query.eq('featured', true);

      // Search
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,manufacturer.ilike.%${search}%,model.ilike.%${search}%`
        );
      }

      // Sort
      if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (sortBy === 'hours-low') query = query.order('ttaf', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      if (page && pageSize) {
        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);
      }

      const { data, error: err, count } = await query;
      if (err) throw err;

      // Apply TBO % filter client-side (see note above).
      let rows = data || [];
      if (tboPctMin) {
        const minPct = Number(tboPctMin);
        rows = rows.filter(r => {
          if (!r.eng_tbo || !r.eng_hours) return false;
          const remaining = ((r.eng_tbo - r.eng_hours) / r.eng_tbo) * 100;
          return remaining >= minPct;
        });
      }

      setAircraft(rows);
      setTotal(tboPctMin ? rows.length : (count || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    category, manufacturer, state, condition, dealerId,
    catKey, makeKey, stateKey, condKey,
    engCountKey, engTypeKey, engMakeKey,
    avSuiteKey, apKey, damageKey,
    minPrice, maxPrice, maxHours, ifrOnly, glassOnly,
    yearFrom, yearTo,
    cruiseMin, rangeMin, usefulLoadMin, fuelBurnMax,
    mtowMin, mtowMax, ceilingMin,
    smohMax, tboPctMin,
    adsbIn, adsbOut, synVis, deIce, airCon,
    retractable, pressurised, cargoDoor, parachute,
    logbooksComplete, hangared, ownerMaxCount,
    dealerOnly, privateOnly, featuredOnly,
    search, sortBy, page, pageSize,
    // arrays referenced indirectly via *Key keys above
    categories, manufacturers, states, conditions,
    engineCounts, engineTypes, engineMakes,
    avionicsSuites, autopilots, damageHistory,
  ]);

  useEffect(() => { fetchAircraft(); }, [fetchAircraft]);

  return { aircraft, loading, error, total, refetch: fetchAircraft };
}

export function useFeaturedAircraft() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error: err } = await supabase
          .from('aircraft')
          .select(`*, dealer:dealers(id, name, location, rating, verified)`)
          .eq('featured', true)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);
        if (err) throw err;
        setAircraft(data || []);
      } catch (err) {
        setError(err.message);
        console.error('[useFeaturedAircraft]', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
    // Timeout: stop loading after 5s if Supabase is unresponsive
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return { aircraft, loading, error };
}

export function useLatestAircraft() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await supabase
          .from('aircraft')
          .select(`*, dealer:dealers(id, name, location, rating, verified)`)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);
        setAircraft(data || []);
      } catch (err) {
        console.error('[useLatestAircraft]', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
    // Timeout: stop loading after 5s if Supabase is unresponsive
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return { aircraft, loading };
}

// ─── Dealers ─────────────────────────────────────────────────────────────────

export function useDealers() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error: err } = await supabase
          .from('dealers')
          .select('*')
          .eq('verified', true)
          .order('rating', { ascending: false });
        if (err) throw err;
        setDealers(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { dealers, loading, error };
}

// ─── News ────────────────────────────────────────────────────────────────────

export function useNews(limit = 6) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error: err } = await supabase
          .from('news_articles')
          .select('*')
          .eq('published', true)
          .order('date', { ascending: false })
          .limit(limit);
        if (err) throw err;
        setArticles(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [limit]);

  return { articles, loading, error };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth if Supabase is not properly configured
    if (!isSupabaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.warn('[useAuth] Failed to get session:', err.message);
      setUser(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication not available - Supabase not configured');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication not available - Supabase not configured');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication not available - Supabase not configured');
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return; // No-op when not configured
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Password reset not available - Supabase not configured');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Password update not available - Supabase not configured');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return { user, loading, signUp, signIn, signInWithGoogle, signOut, resetPassword, updatePassword };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) { setProfile(null); setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data || null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  return { profile, loading, refetch: fetchProfile, updateProfile };
}

// ─── User's own aircraft listings ────────────────────────────────────────────

export function useMyListings(userId) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    if (!userId) { setListings([]); setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('aircraft')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setListings(data || []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Mutations throw on failure so callers can toast the message. Previously
  // we swallowed errors silently — user clicked "Delete", nothing happened,
  // no feedback. Throwing lets the call site decide on UX (toast, modal, etc.)
  // and keeps the hook itself stateless about presentation.
  const deleteListing = async (id) => {
    const { error } = await supabase.from('aircraft').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const updateListingStatus = async (id, status) => {
    const { data, error } = await supabase
      .from('aircraft')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    setListings(prev => prev.map(l => l.id === id ? data : l));
    return data;
  };

  return { listings, loading, refetch: fetchListings, deleteListing, updateListingStatus };
}

// ─── Enquiries for user's listings ───────────────────────────────────────────

export function useMyEnquiries(userId) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = useCallback(async () => {
    if (!userId) { setEnquiries([]); setLoading(false); return; }
    try {
      // Filter at the database level via the foreign join (aircraft.user_id).
      // Previously we fetched all enquiries and filtered client-side, which
      // relied entirely on RLS to prevent leaking other sellers' data — a
      // brittle pattern. Pushing the filter to the query makes the principal
      // explicit at the wire boundary too.
      const { data } = await supabase
        .from('enquiries')
        .select(`*, aircraft:aircraft!inner(id, title, rego, price, user_id)`)
        .eq('aircraft.user_id', userId)
        .order('created_at', { ascending: false });
      setEnquiries(data || []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

  // Light polling — refetch every 30s while the tab is visible so sellers see new enquiries
  // without manual refresh. Safe with Supabase; no Realtime channel required.
  useEffect(() => {
    if (!userId) return undefined;
    const tick = () => { if (document.visibilityState === 'visible') fetchEnquiries(); };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [userId, fetchEnquiries]);

  const updateStatus = async (id, status) => {
    await supabase.from('enquiries').update({ status }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  return { enquiries, loading, refetch: fetchEnquiries, updateStatus };
}

// ─── Saved aircraft ───────────────────────────────────────────────────────────

export function useSavedAircraft(userId) {
  const [savedIds, setSavedIds] = useState(new Set());
  const [savedListings, setSavedListings] = useState([]);

  useEffect(() => {
    if (!userId) { setSavedIds(new Set()); setSavedListings([]); return; }
    async function fetch() {
      const { data } = await supabase
        .from('saved_aircraft')
        .select(`aircraft_id, aircraft:aircraft(*, dealer:dealers(name, rating))`)
        .eq('user_id', userId);
      if (data) {
        setSavedIds(new Set(data.map(s => s.aircraft_id)));
        setSavedListings(data.map(s => s.aircraft).filter(Boolean));
      }
    }
    fetch();
  }, [userId]);

  const toggleSave = async (aircraftId) => {
    if (!userId) return false;
    const isSaved = savedIds.has(aircraftId);
    if (isSaved) {
      await supabase.from('saved_aircraft').delete().eq('user_id', userId).eq('aircraft_id', aircraftId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(aircraftId); return n; });
      setSavedListings(prev => prev.filter(l => l.id !== aircraftId));
      return false;
    } else {
      await supabase.from('saved_aircraft').insert({ user_id: userId, aircraft_id: aircraftId });
      setSavedIds(prev => new Set([...prev, aircraftId]));
      // Fetch the listing to add to savedListings
      const { data } = await supabase
        .from('aircraft')
        .select(`*, dealer:dealers(name, rating)`)
        .eq('id', aircraftId)
        .single();
      if (data) setSavedListings(prev => [...prev, data]);
      return true;
    }
  };

  return { savedIds, savedListings, toggleSave };
}

// ─── Notifications ───────────────────────────────────────────────────────────

// Per-user notification feed. Polls every 30s while the tab is visible
// (light cost — single indexed query). Returns the list, an unread
// count, and a markRead helper.
export function useNotifications(userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      setItems(data || []);
    } catch {
      // Table may not exist yet on the target Supabase project. Render
      // as empty so the bell doesn't crash the nav.
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!userId) return undefined;
    const tick = () => { if (document.visibilityState === 'visible') fetchAll(); };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [userId, fetchAll]);

  const unreadCount = items.filter(n => !n.read_at).length;

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const markAllRead = async () => {
    const unreadIds = items.filter(n => !n.read_at).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
    setItems(prev => prev.map(n => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
  };

  return { items, loading, unreadCount, refetch: fetchAll, markRead, markAllRead };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function submitEnquiry(aircraftId, enquiryData) {
  const { data, error } = await supabase
    .from('enquiries')
    .insert({
      aircraft_id: aircraftId,
      name: enquiryData.name,
      email: enquiryData.email,
      phone: enquiryData.phone || null,
      message: enquiryData.message,
      finance_status: enquiryData.financeStatus || null,
      status: 'new'
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createListing(listingData, userId) {
  const { data, error } = await supabase
    .from('aircraft')
    .insert({
      ...listingData,
      user_id: userId,
      status: 'pending',
      images: listingData.images || []
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadImage(file, listingId) {
  const ext = file.name.split('.').pop();
  const path = `${listingId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('aircraft-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('aircraft-images')
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function submitLead(type, leadData) {
  const { data, error } = await supabase
    .from('enquiries')
    .insert({
      aircraft_id: null,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone || null,
      message: leadData.message || '',
      type, // 'finance' | 'insurance' | 'valuation' | 'contact'
      status: 'new'
    });
  if (error) throw error;
  return data;
}

// ─── Admin: cross-user views (RLS must allow admin role) ────────────────────

export function useAdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('aircraft')
        .select(`*, dealer:dealers(id, name)`)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setListings(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id, status) => {
    const { data, error: err } = await supabase
      .from('aircraft').update({ status }).eq('id', id).select().single();
    if (err) throw err;
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    return data;
  };

  // Reject + capture a reason in a single round-trip. The seller can read
  // the reason on their dashboard and resubmit.
  const rejectListing = async (id, reason) => {
    const { data, error: err } = await supabase
      .from('aircraft')
      .update({ status: 'rejected', rejection_reason: reason || null })
      .eq('id', id)
      .select()
      .single();
    if (err) throw err;
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    return data;
  };

  const setFeatured = async (id, featured) => {
    const { data, error: err } = await supabase
      .from('aircraft').update({ featured }).eq('id', id).select().single();
    if (err) throw err;
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    return data;
  };

  // Bulk status change. One request per id; failures are returned per-id so
  // partial success is recoverable. Could be one query with `.in('id', ids)`,
  // but per-id keeps the audit log entries one-per-listing.
  const bulkUpdateStatus = async (ids, status) => {
    const results = await Promise.allSettled(ids.map(id => updateStatus(id, status)));
    return {
      succeeded: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
    };
  };

  return { listings, loading, error, refetch: fetchAll, updateStatus, rejectListing, setFeatured, bulkUpdateStatus };
}

export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Client-side aggregation. Slow at scale, but works without requiring
      // the admin_users_with_listings_count RPC to exist in Supabase. Once
      // the schema migration runs that defines the function, we can switch
      // to the RPC for cheaper aggregation.
      const { data: profiles } = await supabase
        .from('profiles').select('*').order('created_at', { ascending: false });
      const { data: counts } = await supabase
        .from('aircraft').select('user_id');
      const listingsByUser = (counts || []).reduce((acc, r) => {
        if (r.user_id) acc[r.user_id] = (acc[r.user_id] || 0) + 1;
        return acc;
      }, {});
      setUsers((profiles || []).map(p => ({ ...p, listings_count: listingsByUser[p.id] || 0 })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const promoteToDealer = async (userId, dealerId = null) => {
    const { error: err } = await supabase
      .from('profiles').update({ is_dealer: true, dealer_id: dealerId }).eq('id', userId);
    if (err) throw err;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_dealer: true, dealer_id: dealerId } : u));
  };

  // Suspend a user with a reason. RLS should reject any further mutations
  // from suspended profiles; we also stamp the timestamp so the UI can
  // surface "suspended for X days" tooltips.
  const suspendUser = async (userId, reason) => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ suspended_at: new Date().toISOString(), suspension_reason: reason || null })
      .eq('id', userId);
    if (err) throw err;
    setUsers(prev => prev.map(u => u.id === userId
      ? { ...u, suspended_at: new Date().toISOString(), suspension_reason: reason || null }
      : u));
  };

  const unsuspendUser = async (userId) => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ suspended_at: null, suspension_reason: null })
      .eq('id', userId);
    if (err) throw err;
    setUsers(prev => prev.map(u => u.id === userId
      ? { ...u, suspended_at: null, suspension_reason: null }
      : u));
  };

  return { users, loading, refetch: fetchAll, promoteToDealer, suspendUser, unsuspendUser };
}

export function useAdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('enquiries')
        .select(`*, aircraft:aircraft(id, title)`)
        .order('created_at', { ascending: false });
      setEnquiries(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Light polling so the admin inbox stays fresh while open.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') fetchAll(); };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const updateStatus = async (id, status) => {
    await supabase.from('enquiries').update({ status }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  return { enquiries, loading, refetch: fetchAll, updateStatus };
}

// ─── Dealer applications ────────────────────────────────────────────────────

// Public: a logged-in user can submit an application; admin reviews it.
// Approval flips the user's profiles.is_dealer + (optionally) creates a
// dealers row that ties listings to a verified org. This replaces the
// hardcoded "No pending dealer applications" placeholder in AdminPage.
export function useDealerApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // dealer_applications.user_id FKs to auth.users(id), not profiles —
      // PostgREST can't auto-join on that, so we fetch separately and merge
      // by id. Cheap: applications are low-volume.
      const { data: rows, error: err } = await supabase
        .from('dealer_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      const userIds = [...new Set((rows || []).map(r => r.user_id).filter(Boolean))];
      let profileById = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        profileById = (profiles || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
      }
      setApps((rows || []).map(r => ({ ...r, applicant: profileById[r.user_id] || null })));
    } catch (err) {
      // dealer_applications table may not exist yet in environments where
      // the schema migration hasn't been applied. Render as empty rather
      // than throwing in the admin tab.
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const approveApp = async (app, reviewerId) => {
    // 1) Create a dealers row mirroring the application's business info so
    // listings can FK to it. Idempotent-ish — if a dealer with this name
    // already exists, we still link the user.
    const { data: dealer, error: dErr } = await supabase
      .from('dealers')
      .insert({
        name: app.business_name,
        location: app.location,
        verified: true,
      })
      .select()
      .single();
    if (dErr && dErr.code !== '23505') throw dErr;
    const dealerId = dealer?.id || null;
    // 2) Flip the applicant's profile
    const { error: pErr } = await supabase
      .from('profiles')
      .update({ is_dealer: true, dealer_id: dealerId })
      .eq('id', app.user_id);
    if (pErr) throw pErr;
    // 3) Mark the application approved
    const { data: updated, error: aErr } = await supabase
      .from('dealer_applications')
      .update({ status: 'approved', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq('id', app.id)
      .select()
      .single();
    if (aErr) throw aErr;
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, ...updated } : a));
    return updated;
  };

  const rejectApp = async (appId, reason, reviewerId) => {
    const { data, error: err } = await supabase
      .from('dealer_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', appId)
      .select()
      .single();
    if (err) throw err;
    setApps(prev => prev.map(a => a.id === appId ? { ...a, ...data } : a));
    return data;
  };

  const submitApp = async (userId, payload) => {
    const { data, error: err } = await supabase
      .from('dealer_applications')
      .insert({ user_id: userId, ...payload })
      .select()
      .single();
    if (err) throw err;
    setApps(prev => [data, ...prev]);
    return data;
  };

  return { apps, loading, refetch: fetchAll, approveApp, rejectApp, submitApp };
}

// ─── News articles (admin CRUD) ─────────────────────────────────────────────

export function useNewsArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .order('date', { ascending: false });
      setArticles(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createArticle = async (payload) => {
    const { data, error: err } = await supabase
      .from('news_articles').insert(payload).select().single();
    if (err) throw err;
    setArticles(prev => [data, ...prev]);
    return data;
  };

  const updateArticle = async (id, patch) => {
    const { data, error: err } = await supabase
      .from('news_articles').update(patch).eq('id', id).select().single();
    if (err) throw err;
    setArticles(prev => prev.map(a => a.id === id ? data : a));
    return data;
  };

  const deleteArticle = async (id) => {
    const { error: err } = await supabase
      .from('news_articles').delete().eq('id', id);
    if (err) throw err;
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  return { articles, loading, refetch: fetchAll, createArticle, updateArticle, deleteArticle };
}
