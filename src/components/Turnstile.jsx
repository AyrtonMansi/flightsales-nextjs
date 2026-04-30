'use client';
import { useEffect, useRef } from 'react';

// Cloudflare Turnstile widget — invisible-when-idle CAPTCHA. Drops onto
// signup, contact, and enquiry forms. The widget renders into a div and
// posts back a token via the onToken callback; the server then verifies
// the token via /api/turnstile-verify before honoring the form submit.
//
// Free, GDPR-friendly, drop-in alternative to reCAPTCHA. Single global
// script tag injected once, then `turnstile.render()` per widget.
//
// Env required: NEXT_PUBLIC_TURNSTILE_SITE_KEY (Cloudflare dashboard
// → Turnstile → site key). Without it the widget silently no-ops so
// development without a key still works.

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

function ensureScript() {
  if (typeof window === 'undefined') return;
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const s = document.createElement('script');
  s.src = SCRIPT_SRC;
  s.async = true; s.defer = true;
  document.head.appendChild(s);
}

export default function Turnstile({ onToken, action = 'submit' }) {
  const ref = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return undefined;
    ensureScript();

    let attempts = 0;
    const tryRender = () => {
      attempts++;
      if (!window.turnstile) {
        if (attempts < 50) setTimeout(tryRender, 100);
        return;
      }
      if (ref.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          action,
          callback: (token) => onToken?.(token),
          'error-callback': () => onToken?.(null),
          'expired-callback': () => onToken?.(null),
        });
      }
    };
    tryRender();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, action, onToken]);

  // No site key set → soft no-op so dev / preview flows still work.
  // Server-side verifier also no-ops when secret key is unset.
  if (!siteKey) return null;
  return <div ref={ref} className="fs-turnstile" />;
}
