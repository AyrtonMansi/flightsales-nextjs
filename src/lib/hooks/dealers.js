import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Public-read of verified dealers — used by /dealers + the Home rail.

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
