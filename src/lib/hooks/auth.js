import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { isSupabaseConfigured } from './_shared';

// Single auth hook covering the full session lifecycle: getSession +
// onAuthStateChange subscription, plus signup / signin (password +
// Google OAuth) / signout / password reset / password update.
//
// Soft-fails when Supabase env isn't configured so the app still
// renders in local dev with stub data (instead of throwing).

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    // Anchor the confirmation link to the live origin. Without this Supabase
    // falls back to the project's Site URL, which has previously been wrong in
    // production (left as localhost or a stale Vercel preview), bouncing every
    // new user to a broken page.
    const emailRedirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?next=/dashboard` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata, emailRedirectTo }
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
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return;
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
