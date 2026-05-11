// Shared helpers used across the per-domain hook modules. Kept in a
// separate file so each domain hook can import only what it needs and
// nothing else (e.g. the affiliates module doesn't need to pull
// supabase auth helpers).

export function isSupabaseConfigured() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder';
}
