import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export function useAircraft(filters = {}) {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAircraft = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('aircraft')
        .select(`
          *,
          dealer:dealers(id, name, location, rating, verified)
        `)
        .eq('status', 'active');

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.manufacturer) query = query.eq('manufacturer', filters.manufacturer);
      if (filters.state) query = query.eq('state', filters.state);
      if (filters.condition) query = query.eq('condition', filters.condition);
      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.maxHours) query = query.lte('ttaf', filters.maxHours);
      if (filters.ifrOnly) query = query.eq('ifr', true);
      if (filters.glassOnly) query = query.eq('glass_cockpit', true);
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,manufacturer.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
      }

      if (filters.sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (filters.sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (filters.sortBy === 'hours-low') query = query.order('ttaf', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setAircraft(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAircraft();
  }, [fetchAircraft]);

  return { aircraft, loading, error, refetch: fetchAircraft };
}

export function useFeaturedAircraft() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from('aircraft')
        .select(`*, dealer:dealers(id, name, location, rating, verified)`)
        .eq('featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);
      setAircraft(data || []);
      setLoading(false);
    }
    fetchFeatured();
  }, []);

  return { aircraft, loading };
}

export function useDealers() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDealers() {
      const { data } = await supabase
        .from('dealers')
        .select('*')
        .eq('verified', true)
        .order('rating', { ascending: false });
      setDealers(data || []);
      setLoading(false);
    }
    fetchDealers();
  }, []);

  return { dealers, loading };
}

export function useNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .eq('published', true)
        .order('date', { ascending: false })
        .limit(6);
      setArticles(data || []);
      setLoading(false);
    }
    fetchNews();
  }, []);

  return { articles, loading };
}

export function useSavedAircraft(userId) {
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    if (!userId) return;
    async function fetchSaved() {
      const { data } = await supabase
        .from('saved_aircraft')
        .select('aircraft_id')
        .eq('user_id', userId);
      if (data) {
        setSavedIds(new Set(data.map(s => s.aircraft_id)));
      }
    }
    fetchSaved();
  }, [userId]);

  const toggleSave = async (aircraftId) => {
    if (!userId) return false;
    
    const isSaved = savedIds.has(aircraftId);
    if (isSaved) {
      await supabase.from('saved_aircraft').delete().eq('user_id', userId).eq('aircraft_id', aircraftId);
      setSavedIds(prev => {
        const next = new Set(prev);
        next.delete(aircraftId);
        return next;
      });
      return false;
    } else {
      await supabase.from('saved_aircraft').insert({ user_id: userId, aircraft_id: aircraftId });
      setSavedIds(prev => new Set([...prev, aircraftId]));
      return true;
    }
  };

  return { savedIds, toggleSave };
}

export async function submitEnquiry(aircraftId, enquiryData) {
  const { data, error } = await supabase
    .from('enquiries')
    .insert({
      aircraft_id: aircraftId,
      name: enquiryData.name,
      email: enquiryData.email,
      phone: enquiryData.phone,
      message: enquiryData.message,
      status: 'new'
    });
  
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

export async function uploadImage(file, path) {
  const { data, error } = await supabase.storage
    .from('aircraft-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('aircraft-images')
    .getPublicUrl(data.path);
  
  return publicUrl;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
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
