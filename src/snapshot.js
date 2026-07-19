// Loader for the bundled data snapshot (public/data/snapshot.json), produced
// by scripts/ingest/build-snapshot.mjs. It contains REAL congressional trades
// scraped from official House/Senate filings plus real entry/latest prices —
// so the app shows genuine data with no backend at all. Priority in api.js:
// Supabase (live DB) > snapshot (real, as of build time) > sample (fake).

let _promise = null;

export function loadSnapshot() {
  if (_promise) return _promise;
  _promise = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/snapshot.json`);
      if (!res.ok) return null;
      const snap = await res.json();
      if (!Array.isArray(snap?.trades) || snap.trades.length < 12) return null;
      return snap;
    } catch {
      return null;
    }
  })();
  return _promise;
}

/** Convert the snapshot's price object into the Map shape computeReturns expects. */
export function snapshotPriceMap(snap) {
  const map = new Map();
  if (!snap?.prices) return map;
  for (const [sym, p] of Object.entries(snap.prices)) {
    map.set(sym, { history: p.history, last: p.last });
  }
  return map;
}
