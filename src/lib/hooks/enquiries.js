import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// useMyEnquiries — seller view: enquiries against the user's own
// listings. Filters at the DB layer via the foreign join
// (aircraft.user_id), so we don't rely solely on RLS to keep cross-
// seller enquiries out of the response.
//
// submitEnquiry is the direct insert path. The /api/enquiries route is
// the preferred caller — it adds rate-limiting, Turnstile validation,
// listing-availability check, and side effects (admin notification,
// in-app bell). This direct function is kept for callers that already
// run server-side or have their own validation.

export function useMyEnquiries(userId) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = useCallback(async () => {
    if (!userId) { setEnquiries([]); setLoading(false); return; }
    try {
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

  // Light polling — refetch every 30s while the tab is visible so
  // sellers see new enquiries without manual refresh.
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
