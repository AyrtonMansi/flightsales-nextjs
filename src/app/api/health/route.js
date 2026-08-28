import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    databaseConfig: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleConfig: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    distributedRateLimit: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    emailConfig: Boolean(process.env.RESEND_API_KEY),
  };

  // CAPTCHA can remain optional during protected preview. Once the public site
  // gate is removed, production launch policy should require Turnstile.
  const publicLaunch = process.env.NEXT_PUBLIC_SITE_PASSWORD_PROTECTED === 'false';
  const captchaReady = Boolean(process.env.TURNSTILE_SECRET_KEY);
  const coreReady = Object.values(checks).every(Boolean);
  const launchReady = coreReady && (!publicLaunch || captchaReady);

  return NextResponse.json(
    {
      ok: launchReady,
      status: launchReady ? 'ready' : 'degraded',
      checks: {
        database: checks.databaseConfig,
        privilegedDatabaseWrites: checks.serviceRoleConfig,
        abuseProtection: checks.distributedRateLimit,
        transactionalEmail: checks.emailConfig,
        captcha: captchaReady,
        publicLaunch,
      },
      billing: 'disabled',
      timestamp: new Date().toISOString(),
    },
    {
      status: launchReady ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
