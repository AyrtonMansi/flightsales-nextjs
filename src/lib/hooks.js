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
    minPrice, maxPrice, maxHours, ifrOnly, glassOnly,
    yearFrom, yearTo,
    cruiseMin, rangeMin, usefulLoadMin, fuelBurnMax,
    smohMax, tboPctMin,
    retractable, pressurised,
    dealerOnly, privateOnly, featuredOnly,
    search, sortBy, page, pageSize,
  } = filters;

  const catKey = (categories || []).join('|');
  const makeKey = (manufacturers || []).join('|');
  const stateKey = (states || []).join('|');
  const condKey = (conditions || []).join('|');

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

      // Engine specs
      if (smohMax) query = query.lte('eng_hours', Number(smohMax));
      if (tboPctMin) {
        // TBO remaining % is computed (eng_tbo - eng_hours) / eng_tbo. Pushing
        // this filter to a dedicated DB-side computed column or RPC would be
        // cleaner; for now we apply it client-side after fetch.
      }

      // Boolean equipment
      if (ifrOnly) query = query.eq('ifr', true);
      if (glassOnly) query = query.eq('glass_cockpit', true);
      if (retractable) query = query.eq('retractable', true);
      if (pressurised) query = query.eq('pressurised', true);

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
    minPrice, maxPrice, maxHours, ifrOnly, glassOnly,
    yearFrom, yearTo,
    cruiseMin, rangeMin, usefulLoadMin, fuelBurnMax,
    smohMax, tboPctMin,
    retractable, pressurised,
    dealerOnly, privateOnly, featuredOnly,
    search, sortBy, page, pageSize,
    // categories/manufacturers/states/conditions referenced indirectly via *Key
    categories, manufacturers, states, conditions,
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

  return { listings, loading, error, refetch: fetchAll, updateStatus };
}

export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
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

  return { users, loading, refetch: fetchAll, promoteToDealer };
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
