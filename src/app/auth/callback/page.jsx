'use client';

// OAuth / email-confirmation landing page.
//
// This used to be a SERVER route that called
// `supabase.auth.exchangeCodeForSession(code)` on a freshly created server
// client. That could never work, for two independent reasons:
//
//   1. PKCE. `signInWithOAuth` runs in the browser and stores its
//      `code_verifier` in browser storage. The server has no access to it, so
//      the exchange fails and every user landed on /?error=auth.
//   2. Even on success, a default server client has no cookie adapter — the
//      session would be created in memory and thrown away without ever
//      reaching the browser. And the rest of this app reads its session from
//      localStorage (see src/lib/supabase.js), not cookies, so a cookie
//      wouldn't have helped either.
//
// Both Google sign-in and the signup confirmation email land here, so the net
// effect was that neither could complete. Doing the exchange in the browser
// puts the session exactly where the rest of the app looks for it.

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { safeNext } from '../../../lib/safeNext';

export default function AuthCallbackPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const next = safeNext(params.get('next'));
      const code = params.get('code');
      // Supabase reports provider-side failures (user hit "cancel", expired
      // link) as query params rather than by omitting the code.
      const providerError = params.get('error') || params.get('error_description');

      const goto = (path) => { if (!cancelled) window.location.replace(path); };

      if (providerError) return goto('/login?error=auth');

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) return goto(next);
        }

        // Two cases land here:
        //  - No `code` param: the email-confirmation link uses the hash-based
        //    flow, which the browser client consumes automatically on load.
        //  - The exchange errored because detectSessionInUrl already consumed
        //    the code before this effect ran.
        // Either way, the authoritative check is whether we now hold a session.
        const { data } = await supabase.auth.getSession();
        if (data?.session) return goto(next);

        if (!cancelled) setFailed(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 380 }}>
        {failed ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              We couldn&apos;t finish signing you in
            </h1>
            <p style={{ fontSize: 14, color: 'var(--fs-ink-3)', lineHeight: 1.55, marginBottom: 20 }}>
              The link may have already been used or expired. Sign-in links are
              single-use — request a fresh one and it&apos;ll work.
            </p>
            <a className="fs-detail-cta fs-detail-cta-primary" href="/login">
              Back to sign in
            </a>
          </>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--fs-ink-3)' }} role="status">
            Signing you in…
          </p>
        )}
      </div>
    </div>
  );
}
