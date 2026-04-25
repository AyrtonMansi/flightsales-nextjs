import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase';

// ─── Aircraft ───────────────────────────────────────────────────────────────

export function useAircraft(filters = {}) {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  const fetchAircraft = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('aircraft')
        .select(`*, dealer:dealers(id, name, location, rating, verified)`, { count: 'exact' })
        .eq('status', 'active');

      if (stableFilters.category) query = query.eq('category', stableFilters.category);
      if (stableFilters.manufacturer) query = query.eq('manufacturer', stableFilters.manufacturer);
      if (stableFilters.state) query = query.eq('state', stableFilters.state);
      if (stableFilters.condition) query = query.eq('condition', stableFilters.condition);
      if (stableFilters.minPrice) query = query.gte('price', Number(stableFilters.minPrice));
      if (stableFilters.maxPrice) query = query.lte('price', Number(stableFilters.maxPrice));
      if (stableFilters.maxHours) query = query.lte('ttaf', Number(stableFilters.maxHours));
      if (stableFilters.ifrOnly) query = query.eq('ifr', true);
      if (stableFilters.glassOnly) query = query.eq('glass_cockpit', true);
      if (stableFilters.search) {
        query = query.or(
          `title.ilike.%${stableFilters.search}%,manufacturer.ilike.%${stableFilters.search}%,model.ilike.%${stableFilters.search}%`
        );
      }

      if (stableFilters.sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (stableFilters.sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (stableFilters.sortBy === 'hours-low') query = query.order('ttaf', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      if (stableFilters.page && stableFilters.pageSize) {
        const from = (stableFilters.page - 1) * stableFilters.pageSize;
        query = query.range(from, from + stableFilters.pageSize - 1);
      }

      const { data, error: err, count } = await query;
      if (err) throw err;
      setAircraft(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [stableFilters]);

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
          .limit(4);
        if (err) throw err;
        setAircraft(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
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
          .limit(4);
        setAircraft(data || []);
      } finally {
        setLoading(false);
      }
    }
    fetch();
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, signUp, signIn, signInWithGoogle, signOut };
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

  const deleteListing = async (id) => {
    await supabase.from('aircraft').delete().eq('id', id).eq('user_id', userId);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const updateListingStatus = async (id, status) => {
    const { data } = await supabase
      .from('aircraft')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    setListings(prev => prev.map(l => l.id === id ? data : l));
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
      const { data } = await supabase
        .from('enquiries')
        .select(`*, aircraft:aircraft(id, title, rego, price, user_id)`)
        .order('created_at', { ascending: false });
      // Filter to only enquiries on listings owned by this user
      const mine = (data || []).filter(e => e.aircraft?.user_id === userId);
      setEnquiries(mine);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

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
      message: `[${type.toUpperCase()} LEAD] ${leadData.message || ''}`,
      status: 'new'
    });
  if (error) throw error;
  return data;
}
