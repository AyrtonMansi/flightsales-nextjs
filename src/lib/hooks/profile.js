import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// Per-user profile fetch + updateProfile mutation. RLS enforces that
// the authenticated user can only update their own row, AND the
// profiles column-lock trigger blocks writes to role / is_dealer /
// abn_* / pending_dealer / suspended_at / subscription_* — those
// are admin-only via /api/admin/users.

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) { setProfile(null); setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.warn('[useProfile] Failed to fetch profile:', error.message);
        setProfile(null);
      } else {
        setProfile(data || null);
      }
    } catch (err) {
      console.warn('[useProfile] Exception fetching profile:', err.message);
      setProfile(null);
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
