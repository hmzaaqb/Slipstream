// Slipstream data layer.
//
// Responsibilities:
//   1. Fetch real congressional trades from FMP (resilient across the modern
//      "stable" API and the legacy v3/v4 hosts), normalize them to one shape.
//   2. Fetch historical prices per ticker (cached, concurrency-limited) and
//      compute REAL ROI / win-rate / S&P alpha per politician.
//   3. Build the data each view needs (leaderboard, party sentiment, sector
//      intel, hot tickers, feed, profile).
//
// Everything degrades gracefully: if the live API is unreachable we fall back
// to a bundled sample dataset, and if prices can't be fetched ROI shows "—".

import { FMP_STABLE, FMP_V4, FMP_V3, getFmpKey, FEED_PAGES, TRADES_TTL, PRICE_TTL, DEMO_MODE, USE_BACKEND_PROXY } from './config';
import { functionsBase, supabase, hasSupabase } from './supabase';
import { resolveMember, stateFromDistrict, avatarColors, initials } from './members';
import { SAMPLE_TRADES, COMPANIES, buildSamplePriceMap } from './sample-data';
import { loadSnapshot, snapshotPriceMap } from './snapshot';

/* ------------------------------------------------------------------ */
/* small utilities                                                     */
/* ------------------------------------------------------------------ */

const cacheGet = (key, ttl) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (Date.now() - t > ttl) return null;
    return data;
  } catch {
    return null;
  }
};
const cacheSet = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* quota — ignore */
  }
};

async function fetchJson(url, { timeout = 20000, headers } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

/* ------------------------------------------------------------------ */
/* FMP access — direct (key in browser) or via the Edge Function proxy */
/* ------------------------------------------------------------------ */

const FMP_HOSTS = { stable: FMP_STABLE, v4: FMP_V4, v3: FMP_V3 };

// Whether to route FMP through the server-side proxy (keeps the key secret).
const proxyOn = () => USE_BACKEND_PROXY && hasSupabase && Boolean(functionsBase);

// Fetch from FMP by host + path + query. In proxy mode the request goes to the
// `fmp` Edge Function (which injects the real key); otherwise it calls FMP
// directly with the key appended.
async function fmpFetch(host, path, query = {}) {
  const qs = new URLSearchParams(query);
  if (proxyOn()) {
    qs.set('host', host);
    qs.set('path', path);
    // Authorize with the user's session (falls back to the public anon key,
    // which is itself a valid JWT) so the function's verify_jwt gate passes.
    let token = supabase?.supabaseKey;
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) token = data.session.access_token;
    } catch {
      /* use anon key */
    }
    return fetchJson(`${functionsBase}/fmp?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, apikey: supabase?.supabaseKey },
    });
  }
  qs.set('apikey', getFmpKey());
  return fetchJson(`${FMP_HOSTS[host]}/${path}?${qs.toString()}`);
}

// Run async tasks with a concurrency cap.
async function pool(items, limit, worker) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return results;
}

/* ------------------------------------------------------------------ */
/* normalization                                                       */
/* ------------------------------------------------------------------ */

function parseAmount(str) {
  if (str == null) return { low: 0, high: 0, mid: 0 };
  const s = String(str);
  const nums = (s.match(/[\d,]+(?:\.\d+)?/g) || []).map((n) => Number(n.replace(/,/g, '')));
  if (nums.length === 0) return { low: 0, high: 0, mid: 0 };
  const low = nums[0];
  const high = nums.length > 1 ? nums[1] : nums[0];
  return { low, high, mid: Math.round((low + high) / 2) };
}

function normalizeType(t) {
  const s = String(t || '').toLowerCase();
  if (s.includes('purchase') || s.includes('buy')) return 'buy';
  if (s.includes('sale') || s.includes('sell')) return 'sell';
  if (s.includes('exchange')) return 'sell';
  return 'buy';
}

function pickDate(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  }
  return '';
}

// Normalize one raw FMP record (senate or house, stable or legacy) to our shape.
function normalizeTrade(raw, hintChamber, idx) {
  const name =
    raw.representative ||
    raw.senator ||
    raw.name ||
    [raw.firstName || raw.first_name, raw.lastName || raw.last_name].filter(Boolean).join(' ') ||
    'Unknown';

  const symbol = String(raw.symbol || raw.ticker || '').toUpperCase().trim();
  const district = raw.district || raw.office || '';
  const hintState = stateFromDistrict(district);
  const member = resolveMember(name, hintChamber, hintState);

  const amount = parseAmount(raw.amount || raw.range || raw.value);
  const transactionDate = pickDate(raw.transactionDate, raw.dateTraded, raw.date, raw.transaction_date);
  const disclosureDate = pickDate(
    raw.disclosureDate,
    raw.dateRecieved,
    raw.dateReceived,
    raw.filingDate,
    raw.disclosure_date,
    transactionDate,
  );

  const company =
    (COMPANIES[symbol] && COMPANIES[symbol].name) ||
    cleanAssetName(raw.assetDescription || raw.asset_description) ||
    symbol;

  return {
    id: `${hintChamber}-${idx}-${symbol}-${transactionDate}`,
    name: titleCase(name),
    party: member.party,
    state: member.state,
    chamber: member.chamber,
    symbol,
    company,
    sector: (COMPANIES[symbol] && COMPANIES[symbol].sector) || sectorFromName(company),
    type: normalizeType(raw.type || raw.transactionType),
    amountLow: amount.low,
    amountHigh: amount.high,
    amountMid: amount.mid,
    transactionDate,
    disclosureDate,
    link: raw.link || '',
  };
}

function cleanAssetName(desc) {
  if (!desc) return '';
  return String(desc).replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
}

function titleCase(s) {
  return String(s)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

const SECTOR_KEYWORDS = [
  ['HEALTH', /pharma|health|bio|medical|therapeut|pfizer|merck|lilly/i],
  ['TECH', /tech|micro|software|semi|cloud|nvidia|apple|alphabet|meta/i],
  ['FINANCE', /bank|financ|capital|insur|jpmorgan|goldman|visa|mastercard/i],
  ['ENERGY', /energy|oil|gas|petro|chevron|exxon|solar/i],
  ['DEFENSE', /defense|aerospace|lockheed|raytheon|northrop|dynamics/i],
];
function sectorFromName(name) {
  for (const [sector, re] of SECTOR_KEYWORDS) if (re.test(name)) return sector;
  return 'CONSUMER';
}

/* ------------------------------------------------------------------ */
/* live fetch with fallbacks                                           */
/* ------------------------------------------------------------------ */

async function fetchChamber(chamber) {
  const out = [];

  // 1) modern stable API (paged "latest")
  const latestPath = chamber === 'senate' ? 'senate-latest' : 'house-latest';
  for (let p = 0; p < FEED_PAGES; p++) {
    const data = await fmpFetch('stable', latestPath, { page: p, limit: 100 });
    if (Array.isArray(data) && data.length) out.push(...data);
    else break;
  }
  if (out.length) return out;

  // 2) legacy v4 RSS feed (paged)
  const v4rss = chamber === 'senate' ? 'senate-trading-rss-feed' : 'house-disclosure-rss-feed';
  for (let p = 0; p < FEED_PAGES; p++) {
    const data = await fmpFetch('v4', v4rss, { page: p });
    if (Array.isArray(data) && data.length) out.push(...data);
    else break;
  }
  if (out.length) return out;

  // 3) legacy v4 non-paged
  const v4flat = chamber === 'senate' ? 'senate-trading' : 'house-disclosure';
  const flat = await fmpFetch('v4', v4flat);
  if (Array.isArray(flat) && flat.length) return flat;

  return [];
}

// Our own scraped data: the `trades` table in Supabase, filled by the House
// ingest runner (scripts/ingest/run-house.mjs) from actual Clerk filings.
// Rows keep the source PDF URL, so everything shown is auditable. Ticker-less
// rows (treasury bills, notes) are included — ROI code already skips symbols
// it has no prices for, but volume math must count them.
async function fetchScrapedTrades() {
  if (!hasSupabase) return null;
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('disclosure_date', { ascending: false })
      .limit(2000);
    if (error || !data || data.length < 12) return null;
    return data.map((r) => {
      const member = resolveMember(r.politician, r.chamber, r.state);
      const company =
        (COMPANIES[r.symbol] && COMPANIES[r.symbol].name) || cleanAssetName(r.asset) || r.symbol || r.asset;
      return {
        id: r.id,
        name: titleCase(r.politician),
        party: member.party,
        state: r.state || member.state,
        chamber: r.chamber,
        symbol: r.symbol || '',
        company,
        sector: (COMPANIES[r.symbol] && COMPANIES[r.symbol].sector) || sectorFromName(company),
        type: r.type,
        amountLow: Number(r.amount_low) || 0,
        amountHigh: Number(r.amount_high) || 0,
        amountMid: Number(r.amount_mid) || 0,
        transactionDate: r.transaction_date || '',
        disclosureDate: r.disclosure_date || '',
        link: r.source_url || '',
      };
    });
  } catch {
    return null;
  }
}

// Per-politician dollar P/L series (weekly samples), precomputed at snapshot
// build time from full daily closes. Keyed by display name.
let _pnlByName = null;

let _tradesPromise = null;

export async function getTrades({ force = false } = {}) {
  // Real data first: our own scraped filings in Supabase beat everything,
  // including demo mode — the whole point is showing actual disclosures.
  const scraped = await fetchScrapedTrades();
  if (scraped) {
    return { trades: scraped, source: 'live', generatedAt: Date.now() };
  }

  // Bundled snapshot next: real filings scraped at build time (see
  // scripts/ingest/build-snapshot.mjs). Real data — just as-of the build,
  // so generatedAt reflects when it was scraped, not now.
  const snap = await loadSnapshot({ force });
  if (snap) {
    _pnlByName = snap.pnl || null;
    return {
      trades: snap.trades.slice(),
      source: 'snapshot',
      generatedAt: snap.meta?.generatedAt || Date.now(),
      coverage: snap.meta?.coverage || 'House',
    };
  }

  // Demo mode: skip the (paid-only) live fetch entirely and serve the bundled
  // sample dataset immediately. Flip DEMO_MODE in config.js at launch.
  if (DEMO_MODE) {
    return { trades: SAMPLE_TRADES.slice(), source: 'sample', generatedAt: Date.now() };
  }

  if (!force) {
    const cached = cacheGet('slipstream.trades', TRADES_TTL);
    if (cached) return cached;
    if (_tradesPromise) return _tradesPromise;
  }

  _tradesPromise = (async () => {
    const [senateRaw, houseRaw] = await Promise.all([fetchChamber('senate'), fetchChamber('house')]);
    let trades = [
      ...senateRaw.map((r, i) => normalizeTrade(r, 'senate', i)),
      ...houseRaw.map((r, i) => normalizeTrade(r, 'house', i)),
    ].filter((t) => t.symbol && /^[A-Z.]{1,6}$/.test(t.symbol));

    // Falling back to sample data is a DEGRADED state, not a neutral one: the
    // user is about to be shown fabricated returns. Log it loudly and mark the
    // result so the UI can say so — an API outage must never render as a
    // healthy app full of plausible numbers.
    let source = 'live';
    if (trades.length < 12) {
      console.error(
        `[slipstream] Live congressional feed returned only ${trades.length} usable trades ` +
        `(expected 12+). Falling back to SIMULATED sample data.`
      );
      trades = SAMPLE_TRADES.slice();
      source = 'sample';
    }

    trades.sort((a, b) => new Date(b.disclosureDate) - new Date(a.disclosureDate));
    const result = { trades, source, generatedAt: Date.now() };
    if (source === 'live') cacheSet('slipstream.trades', result);
    return result;
  })();

  try {
    return await _tradesPromise;
  } finally {
    _tradesPromise = null;
  }
}

/* ------------------------------------------------------------------ */
/* price history + ROI                                                 */
/* ------------------------------------------------------------------ */

async function fetchHistory(symbol) {
  const cacheKey = `slipstream.px.${symbol}`;
  const cached = cacheGet(cacheKey, PRICE_TTL);
  if (cached) return cached;

  let hist = null;

  // legacy v3 (line series is compact)
  const v3 = await fmpFetch('v3', `historical-price-full/${symbol}`, { serietype: 'line' });
  if (v3 && Array.isArray(v3.historical)) {
    hist = v3.historical.map((h) => ({ date: h.date, close: h.close }));
  }
  // modern stable
  if (!hist) {
    const st = await fmpFetch('stable', 'historical-price-eod/light', { symbol });
    if (Array.isArray(st)) hist = st.map((h) => ({ date: h.date, close: h.close ?? h.price }));
  }
  if (!hist || !hist.length) return null;

  hist = hist
    .filter((h) => h.date && h.close != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-520); // ~2y of trading days

  cacheSet(cacheKey, hist);
  return hist;
}

// Build a price map for the given symbols. Concurrency-limited; failures are
// simply absent from the returned map (callers treat that as "no ROI").
export async function getPriceMap(symbols, { force = false } = {}) {
  // Snapshot prices first: REAL entry + latest closes fetched at build time
  // for exactly the symbols the scraped trades contain. Makes ROI genuine.
  const snap = await loadSnapshot({ force });
  if (snap?.prices && Object.keys(snap.prices).length) return snapshotPriceMap(snap);

  // Demo mode: synthetic, deterministic price histories so every metric renders
  // without touching the (paid-only) FMP price endpoints.
  if (DEMO_MODE) return buildSamplePriceMap();

  const unique = Array.from(new Set(symbols.filter(Boolean)));
  unique.push('SPY'); // benchmark
  const map = new Map();
  await pool(unique, 5, async (sym) => {
    const hist = await fetchHistory(sym);
    if (hist && hist.length) {
      map.set(sym, { history: hist, last: hist[hist.length - 1].close });
    }
  });
  return map;
}

function priceOnOrAfter(history, dateStr) {
  if (!history || !history.length || !dateStr) return null;
  const target = new Date(dateStr).getTime();
  for (let i = 0; i < history.length; i++) {
    if (new Date(history[i].date).getTime() >= target) return history[i].close;
  }
  return history[history.length - 1].close;
}

// Returns { roi, sp, winRate, scored } for a politician's trades using prices.
//
// Sell-aware FIFO model. Buys open dollar lots at the entry close; sells close
// open dollars (oldest first) at the sale-date close, locking in a REALIZED
// return — a position sold at a loss stays a loss, instead of being marked to
// today's price forever. Whatever remains open is UNREALIZED at the latest
// close. ROI = total P/L over total dollars deployed. "vs S&P" runs SPY
// through the identical entry/exit dates and weights. Sells with no prior
// disclosed buy are skipped (the entry price is unknowable from filings).
function computeReturns(trades, priceMap) {
  const spy = priceMap.get('SPY');
  const spyAt = (date) => (spy ? priceOnOrAfter(spy.history, date) : null);

  // chronological, per-symbol lot books
  const ordered = trades
    .filter((t) => t.symbol && t.transactionDate)
    .slice()
    .sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));

  const lots = new Map(); // symbol -> [{dollars, entry, spyEntry}]
  let deployed = 0;
  let pnl = 0; // dollars, realized + unrealized
  let spPnl = 0; // dollar alpha vs SPY on the same flows
  let wins = 0;
  let scored = 0; // one outcome per realized close + per open lot remainder

  for (const t of ordered) {
    const px = priceMap.get(t.symbol);
    if (!px) continue;

    if (t.type === 'buy') {
      const entry = priceOnOrAfter(px.history, t.transactionDate);
      if (!entry || entry <= 0) continue;
      const dollars = Math.max(1, t.amountMid);
      if (!lots.has(t.symbol)) lots.set(t.symbol, []);
      lots.get(t.symbol).push({ dollars, entry, spyEntry: spyAt(t.transactionDate) });
      deployed += dollars;
      continue;
    }

    // sell: close open dollars FIFO at the sale-date close
    const book = lots.get(t.symbol);
    if (!book || !book.length) continue;
    const exit = priceOnOrAfter(px.history, t.transactionDate);
    if (!exit || exit <= 0) continue;
    const spyExit = spyAt(t.transactionDate);
    let toClose = Math.max(1, t.amountMid);
    while (toClose > 0 && book.length) {
      const lot = book[0];
      const closed = Math.min(lot.dollars, toClose);
      const ret = exit / lot.entry - 1;
      pnl += closed * ret;
      if (spyExit && lot.spyEntry) spPnl += closed * (ret - (spyExit / lot.spyEntry - 1));
      wins += ret > 0 ? 1 : 0;
      scored++;
      lot.dollars -= closed;
      toClose -= closed;
      if (lot.dollars <= 0) book.shift();
    }
  }

  // remaining open lots: unrealized at the latest close
  for (const [sym, book] of lots) {
    const px = priceMap.get(sym);
    if (!px) continue;
    for (const lot of book) {
      if (lot.dollars <= 0) continue;
      const ret = px.last / lot.entry - 1;
      pnl += lot.dollars * ret;
      if (spy && lot.spyEntry) spPnl += lot.dollars * (ret - (spy.last / lot.spyEntry - 1));
      wins += ret > 0 ? 1 : 0;
      scored++;
    }
  }

  if (scored === 0 || deployed === 0) return { roi: null, sp: null, winRate: null, scored: 0 };
  return {
    roi: pnl / deployed,
    sp: spPnl / deployed,
    winRate: wins / scored,
    scored,
  };
}

/* ------------------------------------------------------------------ */
/* formatting                                                          */
/* ------------------------------------------------------------------ */

export function fmtMoneyShort(n) {
  if (!n || isNaN(n)) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export function fmtPct(x, withSign = true) {
  if (x == null || isNaN(x)) return '—';
  const v = x * 100;
  const sign = v > 0 && withSign ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

export function fmtDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  if (days === 0) return 'TODAY';
  if (days === 1) return '1 DAY AGO';
  if (days < 7) return `${days} DAYS AGO`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 WEEK AGO';
  if (weeks < 5) return `${weeks} WEEKS AGO`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 MONTH AGO';
  if (months < 12) return `${months} MONTHS AGO`;
  const years = Math.floor(days / 365);
  return years === 1 ? '1 YEAR AGO' : `${years} YEARS AGO`;
}

function fmtDisclosedShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const md = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  return `DISCLOSED ${md} · ${timeAgo(dateStr).replace(' AGO', ' AGO')}`;
}

export function chamberLabel(chamber, state) {
  const base = chamber === 'senate' ? 'U.S. SENATE' : 'U.S. HOUSE';
  return state ? `${base} · ${state}` : base;
}

// NOTE: `sparkline()` used to live here. It hashed the politician's *name* to
// draw a jittered line sloped by their ROI — it never read a price series, so
// it was a chart of nothing shown on every card. Removed deliberately. If a
// sparkline comes back it must be built from real per-trade price history.

/* ------------------------------------------------------------------ */
/* aggregation builders                                                */
/* ------------------------------------------------------------------ */

const RANK_TINTS = {
  1: 'linear-gradient(150deg,#FFE08A,#E0A52E)',
  2: 'linear-gradient(150deg,#EEF1F6,#AEB6C4)',
  3: 'linear-gradient(150deg,#F0B583,#C2723A)',
};

// One politician aggregate with everything the leaderboard + profile need.
export function buildPoliticians(trades, priceMap) {
  const byName = new Map();
  for (const t of trades) {
    if (!byName.has(t.name)) {
      byName.set(t.name, {
        name: t.name,
        party: t.party,
        state: t.state,
        chamber: t.chamber,
        trades: [],
      });
    }
    const p = byName.get(t.name);
    p.trades.push(t);
    // prefer a known party/state if any trade carries it
    if (p.party === '?' && t.party !== '?') p.party = t.party;
    if (!p.state && t.state) p.state = t.state;
  }

  const list = [];
  for (const p of byName.values()) {
    const buys = p.trades.filter((t) => t.type === 'buy').length;
    const sells = p.trades.length - buys;
    const volume = p.trades.reduce((s, t) => s + t.amountMid, 0);
    const lastDisc = p.trades.reduce(
      (m, t) => (t.disclosureDate > m ? t.disclosureDate : m),
      p.trades[0].disclosureDate,
    );
    const returns = priceMap ? computeReturns(p.trades, priceMap) : { roi: null, sp: null, winRate: null, scored: 0 };
    const [from, to] = avatarColors(p.name, p.party);
    list.push({
      ...p,
      buys,
      sells,
      tradeCount: p.trades.length,
      volume,
      lastDisclosure: lastDisc,
      roi: returns.roi,
      sp: returns.sp,
      winRate: returns.winRate,
      scored: returns.scored,
      from,
      to,
      initials: initials(p.name),
    });
  }
  return list;
}

// Convert politician aggregates to leaderboard card view-models.
export function toLeaderCards(politicians, metric) {
  return politicians.map((p, i) => {
    const rank = i + 1;
    const metricVal = metric === 'sp' ? p.sp : p.roi;
    return {
      rank,
      name: p.name,
      chamber: chamberLabel(p.chamber, p.state),
      disclosed: `${fmtMoneyShort(p.volume)} DISCLOSED`,
      time: timeAgo(p.lastDisclosure),
      roi: fmtPct(metricVal),
      roiPositive: metricVal == null ? null : metricVal >= 0,
      trades: `${p.tradeCount} TRADE${p.tradeCount === 1 ? '' : 'S'}`,
      win: p.winRate == null ? '—' : `${Math.round(p.winRate * 100)}% WINRATE`,
      initials: p.initials,
      from: p.from,
      to: p.to,
      metricTag: metric === 'sp' ? 'VS S&P' : 'ROI',
      rankTint: RANK_TINTS[rank] || 'linear-gradient(150deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))',
      rankTextDark: rank <= 3,
    };
  });
}

export function sortPoliticians(politicians, sort, metric) {
  const arr = politicians.slice();
  const roiOf = (p) => (metric === 'sp' ? p.sp : p.roi);
  const cmp = {
    recent: (a, b) => new Date(b.lastDisclosure) - new Date(a.lastDisclosure),
    roi: (a, b) => (roiOf(b) ?? -Infinity) - (roiOf(a) ?? -Infinity),
    win: (a, b) => (b.winRate ?? -Infinity) - (a.winRate ?? -Infinity),
    volume: (a, b) => b.volume - a.volume,
    trades: (a, b) => b.tradeCount - a.tradeCount,
  };
  arr.sort(cmp[sort] || cmp.recent);
  return arr;
}

export function filterPoliticians(politicians, { party, chamber, search }) {
  return politicians.filter((p) => {
    if (party && party !== 'all') {
      if (party === 'dem' && p.party !== 'D') return false;
      if (party === 'rep' && p.party !== 'R') return false;
    }
    if (chamber && chamber !== 'both') {
      if (chamber === 'senate' && p.chamber !== 'senate') return false;
      if (chamber === 'house' && p.chamber !== 'house') return false;
    }
    // The search box offers "name or state", so match both — it previously
    // only matched name, which made every state query return nothing.
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${p.name} ${p.state || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function buildPartyReturn(politicians) {
  const agg = (party) => {
    const ps = politicians.filter((p) => p.party === party && p.roi != null);
    if (!ps.length) return null;
    let wSum = 0;
    let acc = 0;
    for (const p of ps) {
      const w = Math.max(1, p.volume);
      acc += p.roi * w;
      wSum += w;
    }
    return wSum ? acc / wSum : null;
  };
  return { dem: agg('D'), rep: agg('R') };
}

export function buildSectors(trades, days = 90) {
  const cutoff = Date.now() - days * 86400000;
  const map = new Map();
  for (const t of trades) {
    const when = new Date(t.disclosureDate).getTime();
    if (isNaN(when) || when < cutoff) continue;
    const sec = t.sector || 'CONSUMER';
    if (!map.has(sec)) map.set(sec, { buy: 0, sell: 0 });
    const e = map.get(sec);
    if (t.type === 'buy') e.buy += t.amountMid;
    else e.sell += t.amountMid;
  }
  const order = ['HEALTH', 'TECH', 'FINANCE', 'CONSUMER', 'ENERGY', 'DEFENSE'];
  const sectors = [];
  for (const name of order) {
    const e = map.get(name);
    if (!e) continue;
    const net = e.buy - e.sell;
    sectors.push({ name, net, up: net >= 0, val: fmtMoneyShort(Math.abs(net)) });
  }
  // include any extra sectors not in the canonical order
  for (const [name, e] of map) {
    if (order.includes(name)) continue;
    const net = e.buy - e.sell;
    sectors.push({ name, net, up: net >= 0, val: fmtMoneyShort(Math.abs(net)) });
  }
  return sectors.sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 6);
}

export function buildHotItems(trades, priceMap, days = 30) {
  const cutoff = Date.now() - days * 86400000;
  const map = new Map();
  for (const t of trades) {
    const when = new Date(t.disclosureDate).getTime();
    if (isNaN(when) || when < cutoff) continue;
    if (!map.has(t.symbol)) map.set(t.symbol, { vol: 0, count: 0, pols: new Set() });
    const e = map.get(t.symbol);
    e.vol += t.amountMid;
    e.count++;
    e.pols.add(t.name);
  }
  const items = Array.from(map.entries()).map(([ticker, e]) => {
    let up = true;
    if (priceMap && priceMap.get(ticker)) {
      const h = priceMap.get(ticker).history;
      if (h.length > 20) up = h[h.length - 1].close >= h[h.length - 21].close;
    }
    return {
      ticker,
      val: fmtMoneyShort(e.vol),
      up,
      meta: `${e.pols.size} POL · ${e.count} TRADE${e.count === 1 ? '' : 'S'}`,
    };
  });
  return items.sort((a, b) => parseVol(b.val) - parseVol(a.val)).slice(0, 8);
}

function parseVol(s) {
  const n = parseFloat(s.replace(/[$,]/g, ''));
  if (s.includes('M')) return n * 1e6;
  if (s.includes('K')) return n * 1e3;
  return n;
}

const SIZE_THRESHOLD = { '250': 250000, '1m': 1000000 };

export function buildFeed(trades, politicians, priceMap, { ticker, ftype, fsize, period }) {
  const polByName = new Map(politicians.map((p) => [p.name, p]));
  const periodDays = { all: Infinity, '3mo': 90, month: 30, week: 7, today: 1 }[period] ?? Infinity;
  const cutoff = periodDays === Infinity ? -Infinity : Date.now() - periodDays * 86400000;

  let rows = trades.filter((t) => {
    const when = new Date(t.disclosureDate).getTime();
    if (!isNaN(when) && when < cutoff) return false;
    if (ticker && ticker.trim() && !t.symbol.includes(ticker.trim().toUpperCase())) return false;
    if (ftype === 'buys' && t.type !== 'buy') return false;
    if (ftype === 'sells' && t.type !== 'sell') return false;
    if (fsize && fsize !== 'any' && t.amountHigh < SIZE_THRESHOLD[fsize]) return false;
    return true;
  });

  rows = rows.slice(0, 60);

  return rows.map((t) => {
    const pol = polByName.get(t.name);
    const [from, to] = avatarColors(t.name, t.party);
    let ret = null;
    if (priceMap && t.type === 'buy' && priceMap.get(t.symbol)) {
      const px = priceMap.get(t.symbol);
      const entry = priceOnOrAfter(px.history, t.transactionDate);
      if (entry && entry > 0) ret = px.last / entry - 1;
    }
    return {
      id: t.id,
      ticker: t.symbol,
      company: t.company,
      side: t.type === 'buy' ? 'BUY' : 'SELL',
      isBuy: t.type === 'buy',
      pol: t.name,
      polSub: chamberLabel(t.chamber, t.state).replace('U.S. ', ''),
      initials: initials(t.name),
      from,
      to,
      disclosed: fmtDisclosedShort(t.disclosureDate),
      traded: t.transactionDate ? `TRADED ${fmtDateLong(t.transactionDate).toUpperCase()}` : '',
      amt: amountRangeLabel(t),
      ret: fmtPct(ret),
      retPositive: ret == null ? null : ret >= 0,
      large: t.amountHigh >= 250000,
      link: t.link || '',
      _pol: pol,
    };
  });
}

function amountRangeLabel(t) {
  if (!t.amountLow && !t.amountHigh) return '—';
  // match the design's "$15K–50K" form (currency symbol only on the low end)
  return `${fmtMoneyShort(t.amountLow)}–${fmtMoneyShort(t.amountHigh).replace('$', '')}`;
}

// Everything the Profile view needs for a single politician.
export function buildProfile(pol, priceMap, metric = 'roi') {
  if (!pol) return null;
  const trades = pol.trades.slice().sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

  // holdings: net volume by ticker
  const holdMap = new Map();
  for (const t of pol.trades) {
    if (!holdMap.has(t.symbol)) holdMap.set(t.symbol, { vol: 0, company: t.company });
    holdMap.get(t.symbol).vol += t.amountMid;
  }
  const holdings = Array.from(holdMap.entries())
    .sort((a, b) => b[1].vol - a[1].vol)
    .slice(0, 5)
    .map(([ticker, e], i) => {
      let ret = null;
      if (priceMap && priceMap.get(ticker)) {
        const px = priceMap.get(ticker);
        const firstBuy = pol.trades
          .filter((t) => t.symbol === ticker && t.type === 'buy')
          .sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate))[0];
        if (firstBuy) {
          const entry = priceOnOrAfter(px.history, firstBuy.transactionDate);
          if (entry && entry > 0) ret = px.last / entry - 1;
        }
      }
      return {
        rank: `#${i + 1}`,
        ticker,
        company: e.company,
        val: fmtMoneyShort(e.vol),
        ret: ret == null ? '—' : fmtPct(ret),
        up: ret == null ? null : ret >= 0,
      };
    });

  const recent = trades.slice(0, 6).map((t) => ({
    side: t.type === 'buy' ? 'BUY' : 'SELL',
    isBuy: t.type === 'buy',
    ticker: t.symbol,
    date: fmtDateLong(t.transactionDate),
    amt: fmtMoneyShort(t.amountLow || t.amountMid),
    link: t.link || '',
  }));

  // Per-position mark-to-market returns for the profile chart. Real math only:
  // entry = first close on/after the first disclosed buy, exit = latest close.
  // (The bundled snapshot keeps sparse price history, so an equity curve isn't
  // honestly computable — per-position bars are.)
  const roiBars = [];
  if (priceMap) {
    const bySym = new Map();
    for (const t of pol.trades) {
      if (t.type !== 'buy' || !t.symbol || !priceMap.get(t.symbol)) continue;
      const cur = bySym.get(t.symbol);
      if (!cur || new Date(t.transactionDate) < new Date(cur.transactionDate)) bySym.set(t.symbol, t);
    }
    for (const [sym, t] of bySym) {
      const px = priceMap.get(sym);
      const entry = priceOnOrAfter(px.history, t.transactionDate);
      if (!entry || entry <= 0) continue;
      roiBars.push({ ticker: sym, ret: px.last / entry - 1, weight: t.amountMid });
    }
    roiBars.sort((a, b) => b.weight - a.weight);
    roiBars.length = Math.min(roiBars.length, 8);
  }

  const metricVal = metric === 'sp' ? pol.sp : pol.roi;
  const stats = [
    { label: 'TRADES', value: String(pol.tradeCount), valColor: '#F7F7F5', sub: '' },
    { label: 'BUYS', value: String(pol.buys), valColor: '#42C989', sub: '' },
    { label: 'SELLS', value: String(pol.sells), valColor: '#D4AF37', sub: '' },
    {
      label: 'WINRATE',
      value: pol.winRate == null ? '—' : `${Math.round(pol.winRate * 100)}%`,
      valColor: '#42C989',
      sub: pol.scored ? `${pol.scored} SCORED` : '',
    },
    {
      label: metric === 'sp' ? 'VS S&P' : 'ROI',
      value: fmtPct(metricVal),
      valColor: metricVal == null ? 'rgba(247,247,245,0.5)' : metricVal >= 0 ? '#42C989' : '#F0646E',
      sub: 'TAP TO TOGGLE',
    },
  ];

  return {
    name: pol.name,
    party: pol.party,
    state: pol.state,
    chamber: pol.chamber,
    initials: pol.initials,
    from: pol.from,
    to: pol.to,
    volume: fmtMoneyShort(pol.volume),
    stats,
    holdings,
    recent,
    roiBars,
    // Real weekly mark-to-market P/L curve (dollars), when the snapshot has it.
    pnlSeries: _pnlByName?.[pol.name] || null,
  };
}
