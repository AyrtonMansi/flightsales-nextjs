// GET /api/cron/saved-search-digest
// Vercel Cron, daily at 09:30 UTC. Walks every saved_search row whose
// frequency='daily' (every run) or 'weekly' (only Mondays), counts new
// matching listings since last_sent_at, and emails the user a digest
// when there's anything new. Stamps last_sent_at on send.
//
// Match query is intentionally minimal — supports the most-used filter
// fields (categories, manufacturers, states, price). Adding more
// fields later is a matter of expanding applyFilters() below.

import { NextResponse } from 'next/server';
import { sendEmail } from '../../../../lib/email';
import { adminClient } from '../../../../lib/requireAdmin';

export const runtime = 'nodejs';

function applyFilters(query, filters) {
  const f = filters || {};
  if (Array.isArray(f.categories) && f.categories.length) query = query.in('category', f.categories);
  if (Array.isArray(f.manufacturers) && f.manufacturers.length) query = query.in('manufacturer', f.manufacturers);
  if (Array.isArray(f.states) && f.states.length) query = query.in('state', f.states);
  if (f.minPrice) query = query.gte('price', Number(f.minPrice));
  if (f.maxPrice) query = query.lte('price', Number(f.maxPrice));
  if (f.yearFrom) query = query.gte('year', Number(f.yearFrom));
  if (f.yearTo) query = query.lte('year', Number(f.yearTo));
  if (f.ifrOnly) query = query.eq('ifr', true);
  if (f.glassOnly) query = query.eq('glass_cockpit', true);
  return query;
}

export async function GET(req) {
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 500 });

  const now = new Date();
  const isMonday = now.getUTCDay() === 1;

  const { data: searches } = await supabase
    .from('saved_searches')
    .select('id, user_id, name, filters, frequency, last_sent_at')
    .in('frequency', ['daily', 'weekly']);

  const due = (searches || []).filter(s => s.frequency !== 'weekly' || isMonday);

  // One batched profile lookup for every search owner instead of one
  // query per search inside the loop.
  const ownerIds = [...new Set(due.map(s => s.user_id).filter(Boolean))];
  const { data: owners } = ownerIds.length
    ? await supabase.from('profiles').select('id, email').in('id', ownerIds)
    : { data: [] };
  const emailByOwnerId = new Map((owners || []).map(o => [o.id, o.email]));

  // Each search's match-count query has its own filter shape, so it
  // can't be collapsed into one query — but the searches are otherwise
  // independent, so run them concurrently instead of one-at-a-time.
  const sentFlags = await Promise.all(due.map(async (s) => {
    const email = emailByOwnerId.get(s.user_id);
    if (!email) return false;

    const since = s.last_sent_at || new Date(Date.now() - 7 * 86400000).toISOString();

    let q = supabase
      .from('aircraft')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', since);
    q = applyFilters(q, s.filters);
    const { count } = await q;

    if (!count || count === 0) return false;

    // Reconstruct a /buy querystring so the digest CTA links straight
    // to the filtered list. URL-encode any list values.
    const params = new URLSearchParams();
    const f = s.filters || {};
    for (const k of ['categories', 'manufacturers', 'states']) {
      if (Array.isArray(f[k])) f[k].forEach(v => params.append(k, v));
    }
    if (f.minPrice) params.set('minPrice', String(f.minPrice));
    if (f.maxPrice) params.set('maxPrice', String(f.maxPrice));

    await sendEmail({
      to: email,
      template: 'search.digest',
      vars: {
        searchName: s.name,
        matchCount: count,
        queryString: params.toString(),
      },
    });

    await supabase
      .from('saved_searches')
      .update({ last_sent_at: now.toISOString() })
      .eq('id', s.id);

    return true;
  }));

  const sent = sentFlags.filter(Boolean).length;

  return NextResponse.json({ ok: true, sent, walked: searches?.length || 0 });
}
