// Edge Function: Alpaca proxy.
//
// Alpaca's brokerage API has no permissive CORS, so the browser can't call it
// directly in production. This function forwards requests to the Alpaca PAPER
// host, relaying the user's APCA-API-* credentials. It stores nothing: the keys
// are passed through per-request and never persisted.
//
// Deploy:  supabase functions deploy alpaca --no-verify-jwt
// Auth:    verify_jwt is OFF here because the request carries Alpaca creds (the
//          real secret) in its own headers rather than a Supabase JWT. The
//          function only relays to Alpaca — it grants no access to your project.
//
// The client calls `${functionsBase}/alpaca/v2/account` etc. — everything after
// `/alpaca` is the Alpaca path.

import { corsHeaders } from '../_shared/cors.ts';

const ALPACA_PAPER = 'https://paper-api.alpaca.markets';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  // Strip the function mount prefix to recover the Alpaca path + query.
  const path = url.pathname.replace(/^\/alpaca/, '') || '/';
  const target = `${ALPACA_PAPER}${path}${url.search}`;

  const key = req.headers.get('APCA-API-KEY-ID');
  const secret = req.headers.get('APCA-API-SECRET-KEY');
  if (!key || !secret) {
    return new Response(JSON.stringify({ message: 'Missing Alpaca credentials' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret,
        'Content-Type': 'application/json',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text(),
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ message: 'Could not reach Alpaca' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
