// Edge Function: FMP proxy.
//
// Keeps the PAID Financial Modeling Prep key server-side. The browser calls
// this function with `?host=stable|v4|v3&path=<endpoint>&...other query`; the
// function injects the secret key and forwards to the right FMP host.
//
// Deploy:   supabase functions deploy fmp
// Secret:   supabase secrets set FMP_KEY=your_paid_fmp_key
// Auth:     verify_jwt stays ON (default) — only signed-in users (or the anon
//           key) can reach it. The client sends an Authorization: Bearer token.

import { corsHeaders } from '../_shared/cors.ts';

const FMP_HOSTS: Record<string, string> = {
  stable: 'https://financialmodelingprep.com/stable',
  v4: 'https://financialmodelingprep.com/api/v4',
  v3: 'https://financialmodelingprep.com/api/v3',
};

// Only allow the endpoints the app actually uses (prevents this becoming an
// open proxy for someone else's FMP usage on your dime).
const ALLOWED = [
  /^senate-latest$/,
  /^house-latest$/,
  /^senate-trading-rss-feed$/,
  /^house-disclosure-rss-feed$/,
  /^senate-trading$/,
  /^house-disclosure$/,
  /^historical-price-full\/[A-Z.]{1,6}$/,
  /^historical-price-eod\/light$/,
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const key = Deno.env.get('FMP_KEY');
  if (!key) {
    return json({ error: 'FMP_KEY not configured' }, 500);
  }

  const url = new URL(req.url);
  const host = url.searchParams.get('host') || 'stable';
  const path = url.searchParams.get('path') || '';

  if (!FMP_HOSTS[host]) return json({ error: 'bad host' }, 400);
  if (!ALLOWED.some((re) => re.test(path))) return json({ error: 'path not allowed' }, 403);

  // Rebuild the query for FMP: pass everything through except our control params,
  // then append the secret key.
  const params = new URLSearchParams(url.searchParams);
  params.delete('host');
  params.delete('path');
  params.set('apikey', key);

  const target = `${FMP_HOSTS[host]}/${path}?${params.toString()}`;

  try {
    const res = await fetch(target);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_e) {
    return json({ error: 'upstream fetch failed' }, 502);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
