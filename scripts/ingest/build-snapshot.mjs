// Snapshot builder — the zero-backend data pipeline.
//
//   node scripts/ingest/build-snapshot.mjs
//
// Produces public/data/snapshot.json: REAL congressional trades scraped from
// official filings, plus REAL entry/latest prices so the app computes genuine
// ROI. The app loads this file at runtime, so it shows live-scraped data with
// no server at all. When Supabase is connected later, that takes precedence.
//
// Sources (all free, no keys):
//   - House Clerk index + PTR PDFs (house.mjs)
//   - Senate eFD electronic PTRs (senate.mjs), skipped gracefully if blocked
//   - unitedstates/congress-legislators for party/state (public domain)
//   - Yahoo chart API for daily closes (entry + latest per traded symbol)
//
// Parsed filings are cached in scripts/ingest/cache/ so re-runs (and the daily
// CI job) only fetch documents they haven't seen.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchIndex, fetchPtr, stateFromDistrict } from './house.mjs';
import { fetchSenatePtrs } from './senate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_DIR = path.join(ROOT, 'scripts', 'ingest', 'cache');
const OUT = path.join(ROOT, 'public', 'data', 'snapshot.json');
const YEAR = new Date().getFullYear();

fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* small helpers (duplicated from src/ so this script has no app deps) */
/* ------------------------------------------------------------------ */

const titleCase = (s) =>
  String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, ' ').trim();

// Filed names arrive as "MCCONNELL, Jr." / "Moran," — normalize to a clean
// display name ("A. Mitchell McConnell") with suffixes dropped and Mc/Mac
// capitalisation restored after title-casing.
export function displayName(first, last) {
  const cleanLast = String(last)
    .replace(/,/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv|v)\.?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return titleCase(`${first} ${cleanLast}`)
    .replace(/\bMc(\w)/g, (m, c) => `Mc${c.toUpperCase()}`)
    .replace(/\bMac(\w)/g, (m, c) => `Mac${c.toUpperCase()}`);
}

const cleanAssetName = (desc) =>
  String(desc || '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

const SECTOR_KEYWORDS = [
  ['HEALTH', /pharma|health|bio|medical|therapeut|pfizer|merck|lilly/i],
  ['TECH', /tech|micro|software|semi|cloud|nvidia|apple|alphabet|meta|intel|oracle|cisco/i],
  ['FINANCE', /bank|financ|capital|insur|jpmorgan|goldman|visa|mastercard|schwab/i],
  ['ENERGY', /energy|oil|gas|petro|chevron|exxon|solar/i],
  ['DEFENSE', /defense|aerospace|lockheed|raytheon|northrop|dynamics|boeing/i],
];
const sectorFromName = (name) => {
  for (const [sector, re] of SECTOR_KEYWORDS) if (re.test(name)) return sector;
  return 'CONSUMER';
};

/* ------------------------------------------------------------------ */
/* 1. party/state for every current member (public domain dataset)    */
/* ------------------------------------------------------------------ */

// Accent-insensitive key ("Sánchez" must match "Sanchez" as filed).
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export async function fetchLegislators() {
  const cur = await fetch('https://unitedstates.github.io/congress-legislators/legislators-current.json');
  if (!cur.ok) throw new Error(`legislators: HTTP ${cur.status}`);
  const list = await cur.json();

  // Members who left during this congress still have filings in the feed
  // (e.g. a senator who resigned mid-term) — merge recent departures from the
  // historical dataset so their trades don't fall back to party "I".
  try {
    const hist = await fetch('https://unitedstates.github.io/congress-legislators/legislators-historical.json');
    if (hist.ok) {
      const cutoff = new Date(new Date().getFullYear() - 1, 0, 1);
      for (const m of await hist.json()) {
        if (new Date(m.terms.at(-1).end) >= cutoff) list.push(m);
      }
    }
  } catch {
    /* historical is a nice-to-have; current members still resolve */
  }

  const map = new Map(); // "first last" (normalized) -> {party, state, chamber}
  const byLast = new Map(); // "last|STATE" -> same, for middle-name mismatches
  const byChamberLast = { senate: new Map(), house: new Map() }; // last -> rec | 'AMBIG'
  for (const m of list) {
    const t = m.terms.at(-1);
    const rec = {
      party: t.party === 'Democrat' ? 'D' : t.party === 'Republican' ? 'R' : 'I',
      state: t.state,
      chamber: t.type === 'sen' ? 'senate' : 'house',
    };
    map.set(norm(`${m.name.first} ${m.name.last}`), rec);
    if (m.name.nickname) map.set(norm(`${m.name.nickname} ${m.name.last}`), rec);
    byLast.set(`${norm(m.name.last)}|${t.state}`, rec);
    const lk = norm(m.name.last);
    const bucket = byChamberLast[rec.chamber];
    bucket.set(lk, bucket.has(lk) ? 'AMBIG' : rec);
  }
  return { map, byLast, byChamberLast };
}

export function resolveParty(leg, rawFirst, rawLast, state, chamber) {
  // Filing systems decorate names: "McConnell, Jr.", "Moran,", "A. Mitchell".
  // Strip punctuation and generational suffixes before matching.
  const first = String(rawFirst).replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
  const last = String(rawLast)
    .replace(/,/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv|v)\.?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const full = norm(`${first} ${last}`);
  if (leg.map.has(full)) return leg.map.get(full);
  // "Richard W. Allen" -> "Richard Allen" (strip middle initials/names)
  const noMiddle = norm(`${first.split(/\s+/)[0]} ${last}`);
  if (leg.map.has(noMiddle)) return leg.map.get(noMiddle);
  if (state) {
    const ls = `${norm(last)}|${state}`;
    if (leg.byLast.has(ls)) return leg.byLast.get(ls);
  }
  // Filing systems and the members dataset disagree on first names constantly
  // ("Thomas H" vs "Tommy"). A surname unique within the filer's chamber is
  // identification enough.
  const bucket = chamber ? leg.byChamberLast[chamber] : null;
  const only = bucket?.get(norm(last));
  if (only && only !== 'AMBIG') return only;
  return { party: 'I', state, chamber: null };
}

/* ------------------------------------------------------------------ */
/* 2. House filings (cached)                                          */
/* ------------------------------------------------------------------ */

async function collectHouse() {
  const cachePath = path.join(CACHE_DIR, `house-${YEAR}.json`);
  const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};

  const index = await fetchIndex(YEAR);
  console.log(`House ${YEAR}: ${index.length} PTRs in index, ${Object.keys(cache).length} cached`);

  let fetched = 0;
  for (const f of index) {
    if (cache[f.docId]) continue;
    let entry;
    try {
      const { transactions, hasTextLayer } = await fetchPtr(f.year, f.docId);
      entry = {
        status: hasTextLayer ? (transactions.length ? 'parsed' : 'empty') : 'no_text_layer',
        transactions,
      };
    } catch {
      // Not cached as permanent failure: the Clerk sometimes indexes a filing
      // before the PDF is posted, so retry it on the next run.
      console.log(`  fetch failed (will retry next run): ${f.docId}`);
      continue;
    }
    cache[f.docId] = { ...entry, meta: f };
    fetched++;
    if (fetched % 25 === 0) {
      console.log(`  ...${fetched} new filings fetched`);
      fs.writeFileSync(cachePath, JSON.stringify(cache)); // checkpoint
    }
    await sleep(150);
  }
  fs.writeFileSync(cachePath, JSON.stringify(cache));
  console.log(`House: ${fetched} newly fetched, cache now ${Object.keys(cache).length}`);
  return cache;
}

/* ------------------------------------------------------------------ */
/* 3. prices — real entry + latest closes via Yahoo                   */
/* ------------------------------------------------------------------ */

async function yahooDaily(symbol) {
  const ysym = symbol.replace(/\./g, '-');
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ysym)}?range=2y&interval=1d`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (res.status === 429) {
      await sleep(4000);
      continue;
    }
    if (!res.ok) return null;
    const j = await res.json();
    const r = j.chart?.result?.[0];
    if (!r?.timestamp?.length) return null;
    const closes = r.indicators?.quote?.[0]?.close || [];
    const out = [];
    for (let i = 0; i < r.timestamp.length; i++) {
      if (closes[i] == null) continue;
      out.push({ date: new Date(r.timestamp[i] * 1000).toISOString().slice(0, 10), close: +closes[i].toFixed(4) });
    }
    return out.length ? out : null;
  }
  return null;
}

const onOrAfter = (series, date) => series.find((p) => p.date >= date) || null;

/**
 * Build a compact price map: for each symbol, only the closes actually needed —
 * the first close on/after each of its trade dates, plus the latest close.
 * Keeps the snapshot small while making ROI math exact.
 */
async function buildPrices(trades) {
  const datesBySym = new Map();
  const allDates = new Set();
  for (const t of trades) {
    if (!t.symbol || !t.transactionDate) continue;
    if (!datesBySym.has(t.symbol)) datesBySym.set(t.symbol, new Set());
    datesBySym.get(t.symbol).add(t.transactionDate);
    allDates.add(t.transactionDate);
  }
  datesBySym.set('SPY', allDates); // benchmark needs every trade date

  const prices = {};
  const seriesBySym = new Map(); // full daily series, kept in memory for P/L curves
  let done = 0, missing = 0;
  for (const [sym, dates] of datesBySym) {
    const series = await yahooDaily(sym);
    if (!series) {
      missing++;
    } else {
      seriesBySym.set(sym, series);
      const points = new Map();
      for (const d of dates) {
        const p = onOrAfter(series, d);
        if (p) points.set(p.date, p.close);
      }
      const last = series.at(-1);
      points.set(last.date, last.close);
      prices[sym] = {
        last: last.close,
        history: [...points.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, close]) => ({ date, close })),
      };
    }
    done++;
    if (done % 40 === 0) console.log(`  prices: ${done}/${datesBySym.size} (${missing} unavailable)`);
    await sleep(250);
  }
  console.log(`prices: ${Object.keys(prices).length} symbols priced, ${missing} unavailable`);
  return { prices, seriesBySym };
}

/* ------------------------------------------------------------------ */
/* 4. per-politician P/L curves (real mark-to-market, weekly samples)  */
/* ------------------------------------------------------------------ */

// Close at-or-before a date (positions are valued at the last known close).
function closeAtOrBefore(series, date) {
  let lo = 0, hi = series.length - 1, ans = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid].date <= date) { ans = series[mid].close; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans;
}

/**
 * For each politician: estimated dollars made, over time, from their disclosed
 * buys — Σ amountMid × (close(t)/entry − 1) across positions open by t.
 * Weekly samples + today. Real math from real closes; sells are not modelled
 * (consistent with the app's ROI figure, and stated in the UI caption).
 */
function buildPnlCurves(trades, seriesBySym) {
  const byPol = new Map();
  for (const t of trades) {
    if (t.type !== 'buy' || !t.symbol || !t.transactionDate) continue;
    const series = seriesBySym.get(t.symbol);
    if (!series) continue;
    const entryPt = series.find((p) => p.date >= t.transactionDate);
    if (!entryPt || entryPt.close <= 0) continue;
    if (!byPol.has(t.name)) byPol.set(t.name, []);
    byPol.get(t.name).push({ symbol: t.symbol, date: entryPt.date, entry: entryPt.close, weight: t.amountMid });
  }

  const today = new Date().toISOString().slice(0, 10);
  const pnl = {};
  for (const [name, positions] of byPol) {
    const start = positions.reduce((a, p) => (p.date < a ? p.date : a), today);
    // weekly sample dates from first entry to today
    const dates = [];
    for (let d = new Date(start); d < new Date(today); d.setDate(d.getDate() + 7)) {
      dates.push(d.toISOString().slice(0, 10));
    }
    dates.push(today);
    const series = dates.map((d) => {
      let v = 0;
      for (const p of positions) {
        if (p.date > d) continue;
        const close = closeAtOrBefore(seriesBySym.get(p.symbol), d);
        if (close != null) v += p.weight * (close / p.entry - 1);
      }
      return Math.round(v);
    });
    if (series.length >= 2) pnl[name] = series;
  }
  console.log(`P/L curves: ${Object.keys(pnl).length} politicians`);
  return pnl;
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

const leg = await fetchLegislators();
const houseCache = await collectHouse();

let senate = { trades: [], filings: 0, skippedPaper: 0, error: null };
try {
  senate = await fetchSenatePtrs(YEAR, { cacheDir: CACHE_DIR });
} catch (e) {
  senate.error = e.message;
  console.log(`Senate: skipped (${e.message})`);
}

const trades = [];
const tally = { parsed: 0, empty: 0, no_text_layer: 0 };

for (const [docId, entry] of Object.entries(houseCache)) {
  tally[entry.status] = (tally[entry.status] || 0) + 1;
  if (entry.status !== 'parsed') continue;
  const f = entry.meta;
  const state = stateFromDistrict(f.district);
  const who = resolveParty(leg, f.first, f.last, state, 'house');
  const sourceUrl = `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${f.year}/${docId}.pdf`;
  entry.transactions.forEach((t, i) => {
    const company = cleanAssetName(t.asset) || t.symbol || '';
    trades.push({
      id: `${docId}:${i}`,
      name: displayName(f.first, f.last),
      party: who.party,
      state,
      chamber: 'house',
      symbol: t.symbol || '',
      company,
      sector: sectorFromName(company),
      type: t.type,
      owner: t.owner,
      amountLow: t.amountLow,
      amountHigh: t.amountHigh,
      amountMid: t.amountMid,
      transactionDate: t.transactionDate,
      disclosureDate: t.disclosureDate,
      link: sourceUrl,
    });
  });
}

for (const t of senate.trades) {
  const who = resolveParty(leg, t.first, t.last, t.state || '', 'senate');
  const company = cleanAssetName(t.asset) || t.symbol || '';
  trades.push({
    id: t.id,
    name: displayName(t.first, t.last),
    party: who.party,
    state: t.state || who.state || '',
    chamber: 'senate',
    symbol: t.symbol || '',
    company,
    sector: sectorFromName(company),
    type: t.type,
    owner: t.owner || 'self',
    amountLow: t.amountLow,
    amountHigh: t.amountHigh,
    amountMid: t.amountMid,
    transactionDate: t.transactionDate,
    disclosureDate: t.disclosureDate,
    link: t.link,
  });
}

trades.sort((a, b) => (a.disclosureDate < b.disclosureDate ? 1 : -1));
console.log(`\ntrades: ${trades.length} total (${trades.filter((t) => t.chamber === 'senate').length} senate)`);
console.log('house filings:', tally);

const { prices, seriesBySym } = await buildPrices(trades);
const pnl = buildPnlCurves(trades, seriesBySym);

const snapshot = {
  meta: {
    generatedAt: Date.now(),
    year: YEAR,
    coverage: senate.trades.length ? 'House + Senate' : 'House',
    houseFilings: tally,
    senate: { filings: senate.filings, skippedPaper: senate.skippedPaper, error: senate.error },
    note: 'Real congressional PTR filings scraped from official sources. Amounts are disclosure brackets (low/high bounds). Every trade links to its source filing.',
  },
  trades,
  prices,
  pnl,
};

fs.writeFileSync(OUT, JSON.stringify(snapshot));
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`\nwrote ${OUT} (${kb} KB)`);
