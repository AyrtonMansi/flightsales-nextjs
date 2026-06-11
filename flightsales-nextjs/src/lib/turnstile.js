// Server-side Turnstile token verification. Called from API routes that
// accept user form submissions (enquiry, contact, signup, report).
//
// If TURNSTILE_SECRET_KEY is unset (development), the verifier is a
// no-op that returns true — so the app stays usable without setting up
// the Cloudflare account first. In production with the key set, an
// invalid or missing token returns false and the API rejects the
// submission with 400.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // soft-disabled in dev / preview
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
