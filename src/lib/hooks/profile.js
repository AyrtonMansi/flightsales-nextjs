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

      // Backfill: if the handle_new_user trigger silently failed at signup
      // (RLS misconfig, schema drift), the auth.users row exists but the
      // profile is missing. Insert it now from the auth-side metadata so
      // the user isn't stuck. RLS allows this — the policy is auth.uid() = id.
      // PGRST116 is PostgREST's "no rows returned" code from .single().
      if (!data && (!error || error.code === 'PGRST116')) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && authUser.id === userId) {
          const meta = authUser.user_metadata || {};
          const accountType = meta.account_type === 'business' ? 'business' : 'private';
          const { data: inserted, error: insertErr } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: meta.full_name || authUser.email?.split('@')[0] || null,
              phone: meta.phone || null,
              account_type: accountType,
              pending_dealer: accountType === 'business',
            })
            .select()
            .single();
          if (insertErr) {
            console.warn('[useProfile] Backfill insert failed:', insertErr.message);
          }
          setProfile(inserted || null);
          return;
        }
      }
      if (error && error.code !== 'PGRST116') {
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
