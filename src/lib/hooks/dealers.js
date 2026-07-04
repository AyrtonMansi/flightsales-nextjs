import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Public-read of verified dealers — used by /dealers + the Home rail.

export function useDealers() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const { data, error: err } = await supabase
          .from('dealers')
          .select('*')
          .eq('verified', true)
          .order('rating', { ascending: false });
        if (err) throw err;
        if (cancelled) return;
        setDealers(data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  return { dealers, loading, error };
}

// Single-row fetch by id — used by FlightSalesApp's mount-time fallback
// and its popstate handler (browser back/forward into /dealers/:id).
// Centralised here so both call sites share one query shape instead of
// duplicating it inline.
export async function fetchDealerById(id) {
  const { data } = await supabase
    .from('dealers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data || null;
}
