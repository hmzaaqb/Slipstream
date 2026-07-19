// Central configuration. The FMP key can be overridden at runtime (e.g. from a
// settings screen) by writing `slipstream.fmpKey` into localStorage, which is
// handy for distributing the app without rebuilding.

// No bundled key. The previously committed key was verified dead (FMP returns
// 403 "legacy endpoint") and shipping any key in a client bundle leaks it —
// set one at runtime via localStorage, or use the Supabase proxy.
const DEFAULT_FMP_KEY = '';

export function getFmpKey() {
  try {
    return localStorage.getItem('slipstream.fmpKey') || DEFAULT_FMP_KEY;
  } catch {
    return DEFAULT_FMP_KEY;
  }
}

export function setFmpKey(key) {
  try {
    if (key) localStorage.setItem('slipstream.fmpKey', key);
    else localStorage.removeItem('slipstream.fmpKey');
  } catch {
    /* ignore */
  }
}

// DEMO MODE.
// While true, the app runs entirely on the bundled sample dataset (synthetic
// trades + synthetic price histories): no network calls, instant load, and
// every metric (ROI / win-rate / S&P alpha / sparklines) renders fully.
//
// AT LAUNCH: set this to false AND point getFmpKey() at a PAID FMP key (the
// congressional endpoints are premium-only). Nothing else needs to change —
// the live fetch + real-price pipeline below take over automatically.
export const DEMO_MODE = true;

// FMP hosts. We try the modern "stable" API first and fall back to the legacy
// v3/v4 hosts, since accounts differ in which surface they expose.
export const FMP_STABLE = 'https://financialmodelingprep.com/stable';
export const FMP_V4 = 'https://financialmodelingprep.com/api/v4';
export const FMP_V3 = 'https://financialmodelingprep.com/api/v3';

// When true (and Supabase is configured), congressional + price data is fetched
// through the `fmp` Edge Function instead of calling FMP directly — so the paid
// FMP key lives server-side and never ships to the browser. Toggle via
// VITE_USE_BACKEND_PROXY in .env. Falls back to direct FMP calls when off.
export const USE_BACKEND_PROXY = import.meta.env.VITE_USE_BACKEND_PROXY === 'true';

// How many pages of the congressional feeds to pull (each ~100 trades). Higher
// = more historical trades = more unique politicians on the leaderboard, at the
// cost of a slightly longer initial load.
export const FEED_PAGES = 18;

// Cache TTLs (ms)
export const TRADES_TTL = 1000 * 60 * 30; // 30 min
export const PRICE_TTL = 1000 * 60 * 60 * 24; // 24 h
