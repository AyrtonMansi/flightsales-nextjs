import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// User's own aircraft listings + the mutation surfaces (create, update,
// upload image, report). Status flips by sellers are blocked at the DB
// layer (block_seller_status_flip trigger); admin paths go through
// /api/admin/listings.

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

// P0.1 — sellers need to be able to edit a listing after creation. Status
// changes don't count; this updates content (title, price, description,
// photos, specs). Caller's user_id MUST match the row's user_id (or be
// admin) — RLS enforces.
export async function updateListing(id, patch) {
  const { data, error } = await supabase
    .from('aircraft')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// P1.8 — anyone can flag a listing as suspicious. Note: client callers
// should prefer the /api/reports server route — it derives reporter
// identity from the auth cookie rather than trusting body-supplied values.
// This direct function is kept for back-compat with older surfaces.
export async function reportListing({ aircraftId, reason, details, reporterUserId, reporterEmail }) {
  const { data, error } = await supabase
    .from('listing_reports')
    .insert({
      aircraft_id: aircraftId,
      reason,
      details: details || null,
      reporter_user_id: reporterUserId || null,
      reporter_email: reporterEmail || null,
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
