// Server-side Turnstile token verification. Called from API routes that
// accept user form submissions (enquiry, contact, signup, report).
//
// If TURNSTILE_SECRET_KEY is unset the verifier is a no-op that returns
// true — so the app stays usable in development without setting up the
// Cloudflare account first. In production with the key set, an invalid or
// missing token returns false and the API rejects the submission with 400.
//
// In production with the key MISSING we fail closed instead. This used to
// return true unconditionally, which meant a single forgotten env var
// silently disabled bot protection on every public form at once — and
// .env.example ships TURNSTILE_SECRET_KEY blank, so that was the default
// outcome of a by-the-book deploy rather than an unlikely slip. A hard
// failure on the first submission is far easier to notice and fix than an
// open spam relay nobody spots until the mail domain is burnt.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.error('[turnstile] TURNSTILE_SECRET_KEY is not set — rejecting submission. Set it in the deploy environment.');
      return false;
    }
    return true; // soft-disabled in dev / preview
  }
  if (!token) return false;
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }).toString(),
    });
    const json = await res.json();
    return !!json?.success;
  } catch {
    return false;
  }
}
