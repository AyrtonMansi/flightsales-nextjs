import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// Affiliate partners — public-read of active partners (used by listing
// detail CTAs and the /partners directory) + admin CRUD + admin lead
// pipeline.

export function useActiveAffiliates(filters = {}) {
  const { type, listingPrice, listingCategory, listingState } = filters;
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let q = supabase
          .from('affiliates')
          .select('*')
          .eq('status', 'active')
          .order('display_priority', { ascending: true });
        if (type) q = q.eq('type', type);
        const { data } = await q;
        if (cancelled) return;
        // Apply listing-context filters client-side — they're cheap and
        // letting Postgres handle every combo would mean N queries.
        const filtered = (data || []).filter((a) => {
          if (listingPrice != null) {
            if (a.min_listing_price && listingPrice < a.min_listing_price) return false;
            if (a.max_listing_price && listingPrice > a.max_listing_price) return false;
          }
          if (listingCategory && a.categories?.length && !a.categories.includes(listingCategory)) return false;
          if (listingState && a.states?.length && !a.states.includes(listingState)) return false;
          return true;
        });
        setAffiliates(filtered);
      } catch {
        setAffiliates([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [type, listingPrice, listingCategory, listingState]);

  return { affiliates, loading };
}

// Admin-side hook — returns ALL affiliates regardless of status, plus
// CRUD helpers. Gated by RLS to admin role.
export function useAffiliates() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });
      setAffiliates(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (patch) => {
    const { data, error } = await supabase
      .from('affiliates').insert(patch).select().single();
    if (error) throw error;
    setAffiliates((prev) => [data, ...prev]);
    return data;
  };

  const update = async (id, patch) => {
    const { data, error } = await supabase
      .from('affiliates').update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    setAffiliates((prev) => prev.map((a) => a.id === id ? data : a));
    return data;
  };

  const remove = async (id) => {
    const { error } = await supabase.from('affiliates').delete().eq('id', id);
    if (error) throw error;
    setAffiliates((prev) => prev.filter((a) => a.id !== id));
  };

  return { affiliates, loading, refetch: fetchAll, create, update, remove };
}

// Admin lead pipeline. Returns leads joined with their affiliate name
// for display, plus a status updater.
export function useAffiliateLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('affiliate_leads')
        .select('*, affiliate:affiliates(id, name, type)')
        .order('created_at', { ascending: false });
      setLeads(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id, patch) => {
    const { data, error } = await supabase
      .from('affiliate_leads')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, affiliate:affiliates(id, name, type)')
      .single();
    if (error) throw error;
    setLeads((prev) => prev.map((l) => l.id === id ? data : l));
    return data;
  };

  return { leads, loading, refetch: fetchAll, updateStatus };
}
