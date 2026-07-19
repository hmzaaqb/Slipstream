// Alpaca paper-trading client.
//
// Alpaca's brokerage API doesn't allow direct browser calls (no permissive
// CORS), so every request goes through a proxy:
//   • In production (Supabase + VITE_USE_BACKEND_PROXY): the `alpaca` Edge
//     Function, which forwards to paper-api.alpaca.markets — works on any host.
//   • In local dev: the Vite dev/preview proxy mounted at `/alpaca`.
//
// Credentials live in localStorage only — they are sent to Alpaca via the proxy
// and are never persisted server-side. This is PAPER trading: no real money.

import { functionsBase, hasSupabase } from './supabase';
import { USE_BACKEND_PROXY } from './config';

const STORE_KEY = 'slipstream.alpaca';

// Resolve the request base: the Edge Function in production, else the dev proxy.
function apiBase() {
  if (USE_BACKEND_PROXY && hasSupabase && functionsBase) return `${functionsBase}/alpaca`;
  return '/alpaca'; // Vite proxy -> https://paper-api.alpaca.markets
}

export function getCreds() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCreds(creds) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(creds));
  } catch {
    /* ignore */
  }
}

export function clearCreds() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
}

export function isConnected() {
  const c = getCreds();
  return !!(c && c.key && c.secret);
}

function authHeaders(creds) {
  return {
    'APCA-API-KEY-ID': creds.key,
    'APCA-API-SECRET-KEY': creds.secret,
    'Content-Type': 'application/json',
  };
}

async function call(path, { method = 'GET', body, creds } = {}) {
  const c = creds || getCreds();
  if (!c) throw new Error('Not connected');
  let res;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      method,
      headers: authHeaders(c),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(
      'Could not reach Alpaca. In local dev the proxy runs under `npm run dev` / `npm run preview`; in production it routes through the Supabase Edge Function.',
      { cause: e },
    );
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.raw)) || `Alpaca error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Validate credentials by fetching the account. Returns the account object.
export async function connect(key, secret) {
  const creds = { key: key.trim(), secret: secret.trim() };
  const account = await call('/v2/account', { creds });
  saveCreds(creds);
  return account;
}

export function getAccount() {
  return call('/v2/account');
}

export function getPositions() {
  return call('/v2/positions');
}

// Place a market order. `notional` (dollar amount) is preferred for fractional
// mirroring; falls back to `qty` if provided.
export function placeOrder({ symbol, side = 'buy', notional, qty }) {
  const body = {
    symbol,
    side,
    type: 'market',
    time_in_force: 'day',
  };
  if (notional != null) body.notional = String(notional);
  else if (qty != null) body.qty = String(qty);
  else body.notional = '100';
  return call('/v2/orders', { method: 'POST', body });
}

export function getOrders() {
  return call('/v2/orders?status=all&limit=50');
}

// Equity curve behind the portfolio hero chart. `range` uses the design's
// period labels; Alpaca wants its own period/timeframe pair.
const HISTORY_RANGE = {
  '1D': { period: '1D', timeframe: '5Min' },
  '1W': { period: '1W', timeframe: '1H' },
  '1M': { period: '1M', timeframe: '1D' },
  '3M': { period: '3M', timeframe: '1D' },
  '1Y': { period: '1A', timeframe: '1D' },
  ALL: { period: '5A', timeframe: '1D' },
};

export function getPortfolioHistory(range = '1M') {
  const { period, timeframe } = HISTORY_RANGE[range] || HISTORY_RANGE['1M'];
  return call(`/v2/account/portfolio/history?period=${period}&timeframe=${timeframe}&extended_hours=false`);
}
