import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Reject anything that isn't a single-leading-slash relative path. This
// closes the open-redirect via `?next=//evil.com` (which browsers can
// interpret as protocol-relative) and `?next=/\evil.com` (path traversal
// past the origin). Same-origin paths only.
function safeNext(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return '/';
  if (raw[0] !== '/' || raw[1] === '/' || raw[1] === '\\') return '/';
  return raw;
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(`${origin}/?error=configuration`);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
