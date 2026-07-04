import { rateLimit, callerIp } from '@/lib/ratelimit';

export async function POST(request) {
  // This endpoint checks a single shared site-wide password — a prime
  // brute-force target with no rate limiting until now. 10 guesses/min/IP
  // is generous for a real user, punishing for a script.
  const ip = callerIp(request);
  const rl = await rateLimit(`site-password:${ip}`, { limit: 10, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const { password } = await request.json();

    // Check if password protection is enabled (default to true for safety)
    const isProtected = process.env.SITE_PASSWORD_PROTECTED !== 'false';

    if (!isProtected) {
      return Response.json({ ok: true });
    }

    // Verify password
    if (password === process.env.SITE_PASSWORD) {
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: 'incorrect_password' }, { status: 401 });
  } catch (err) {
    return Response.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }
}
