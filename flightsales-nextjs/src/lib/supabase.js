import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Surface misconfiguration loudly in the browser console so we never silently
// fall back to SAMPLE_LISTINGS in production thinking Supabase is wired.
if (typeof window !== 'undefined') {
  if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder') {
    // eslint-disable-next-line no-console
    console.warn(
      '[FlightSales] Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL and ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel project settings. The app will ' +
      'render SAMPLE_LISTINGS as a fallback until they are set.'
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
