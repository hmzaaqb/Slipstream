// Alpaca paper-trading client.
//
// Alpaca's brokerage API doesn't allow direct browser calls (no permissive
// CORS), so every request goes through the Vite dev/preview proxy mounted at
// `/alpaca` (see vite.config.js) which forwards to paper-api.alpaca.markets.
//
// Credentials live in localStorage only — they never leave the user's machine
// except to Alpaca itself via the proxy. This is PAPER trading: no real money.

const STORE_KEY = 'slipstream.alpaca';
const BASE = '/alpaca'; // proxied -> https://paper-api.alpaca.markets

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
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: authHeaders(c),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(
      'Could not reach Alpaca. The proxy only runs under `npm run dev` / `npm run preview`.',
    );
  }
  const text = await res.text();
  let data = null;
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
