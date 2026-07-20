// Senate eFD ingester.
//
// Flow (no browser needed — plain fetch with a manual cookie jar):
//   1. GET  /search/home/          -> csrftoken cookie + form token
//   2. POST /search/home/ (agree)  -> sessionid cookie
//   3. POST /search/report/data/   -> DataTables JSON of PTR filings
//   4. GET  /search/view/ptr/<id>/ -> clean HTML transaction table
//
// Electronic PTRs parse from the HTML table. Paper filings (scanned images at
// /search/view/paper/) are counted and skipped — they need OCR.
//
// Results are cached per-UUID in cacheDir so repeat runs only fetch new
// filings. The eFD terms checkbox (step 2) is the access-agreement the site
// requires; we submit it exactly as a browser user would.

import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://efdsearch.senate.gov';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ----- session ----- */

function jarFor() {
  const jar = new Map();
  return {
    header: () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; '),
    absorb: (res) => {
      for (const c of res.headers.getSetCookie?.() || []) {
        const [kv] = c.split(';');
        const i = kv.indexOf('=');
        jar.set(kv.slice(0, i), kv.slice(i + 1));
      }
    },
    get: (k) => jar.get(k),
  };
}

async function openSession() {
  const jar = jarFor();
  const home = await fetch(`${BASE}/search/home/`, { headers: UA });
  jar.absorb(home);
  const csrf = ((await home.text()).match(/name="csrfmiddlewaretoken" value="([^"]+)"/) || [])[1];
  if (!csrf) throw new Error('eFD: no csrf token on home page');

  const agree = await fetch(`${BASE}/search/home/`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      ...UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: jar.header(),
      Referer: `${BASE}/search/home/`,
    },
    body: new URLSearchParams({ prohibition_agreement: '1', csrfmiddlewaretoken: csrf }),
  });
  jar.absorb(agree);
  if (agree.status !== 302) throw new Error(`eFD: agreement not accepted (HTTP ${agree.status})`);
  return jar;
}

/* ----- filing list ----- */

async function listPtrFilings(jar, year) {
  const filings = [];
  let start = 0;
  for (;;) {
    const res = await fetch(`${BASE}/search/report/data/`, {
      method: 'POST',
      headers: {
        ...UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: jar.header(),
        Referer: `${BASE}/search/`,
        'X-CSRFToken': jar.get('csrftoken'),
      },
      body: new URLSearchParams({
        start: String(start),
        length: '100',
        report_types: '[11]', // Periodic Transaction Report
        filer_types: '[]',
        submitted_start_date: `01/01/${year} 00:00:00`,
        submitted_end_date: '',
        candidate_state: '',
        senator_state: '',
        office_id: '',
        first_name: '',
        last_name: '',
      }),
    });
    if (!res.ok) throw new Error(`eFD search: HTTP ${res.status}`);
    const j = await res.json();
    for (const row of j.data || []) {
      const [first, last, , linkHtml, dateFiled] = row;
      const uuid = (linkHtml.match(/\/search\/view\/(ptr|paper)\/([0-9a-f-]+)\//) || [])[2];
      const kind = /view\/paper\//.test(linkHtml) ? 'paper' : 'ptr';
      if (uuid) filings.push({ first: first.trim(), last: last.trim(), uuid, kind, dateFiled });
    }
    start += 100;
    if (start >= (j.recordsTotal || 0)) break;
    await sleep(300);
  }
  return filings;
}

/* ----- one filing's transactions ----- */

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&#\d+;|&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

const TYPE = (s) => (/purchase/i.test(s) ? 'buy' : 'sell');
const OWNER = (s) => {
  const o = s.toLowerCase();
  if (o.includes('spouse')) return 'SP';
  if (o.includes('joint')) return 'JT';
  if (o.includes('child')) return 'DC';
  return 'self';
};

function parseAmount(raw) {
  const nums = (raw.match(/[\d,]+(?:\.\d+)?/g) || []).map((n) => Number(n.replace(/,/g, '')));
  if (!nums.length) return { low: 0, high: 0 };
  return { low: nums[0], high: nums.length > 1 ? nums[1] : nums[0] };
}

const toISO = (s) => {
  const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
};

export function parseSenateHtml(html) {
  const out = [];
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/g) || []) {
    const cells = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []).map(stripTags);
    // [#, txDate, Owner, Ticker, Asset Name, Asset Type, Type, Amount, Comment]
    if (cells.length < 8 || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cells[1])) continue;
    let ticker = cells[3] === '--' ? '' : cells[3];
    // Some rows put the ticker only in the asset name: "ACN - Accenture plc..."
    if (!ticker) ticker = (cells[4].match(/^([A-Z]{1,5})\s+-\s/) || [])[1] || '';
    const { low, high } = parseAmount(cells[7]);
    out.push({
      symbol: ticker,
      asset: cells[4],
      owner: OWNER(cells[2]),
      type: TYPE(cells[6]),
      partial: /partial/i.test(cells[6]),
      transactionDate: toISO(cells[1]),
      amountLow: low,
      amountHigh: high,
      amountMid: Math.round((low + high) / 2),
    });
  }
  return out;
}

/* ----- public entry ----- */

export async function fetchSenatePtrs(year, { cacheDir } = {}) {
  const cachePath = cacheDir ? path.join(cacheDir, `senate-${year}.json`) : null;
  const cache = cachePath && fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};

  const jar = await openSession();
  const filings = await listPtrFilings(jar, year);
  const paper = filings.filter((f) => f.kind === 'paper');
  const electronic = filings.filter((f) => f.kind === 'ptr');
  console.log(`Senate ${year}: ${filings.length} PTRs (${paper.length} paper, skipped), ${Object.keys(cache).length} cached`);

  const newUuids = new Set(); // filings first seen this run, for push fan-out
  let fetched = 0;
  for (const f of electronic) {
    if (cache[f.uuid]) continue;
    const link = `${BASE}/search/view/ptr/${f.uuid}/`;
    const res = await fetch(link, { headers: { ...UA, Cookie: jar.header(), Referer: `${BASE}/search/` } });
    if (!res.ok) {
      console.log(`  view failed (retry next run): ${f.uuid} HTTP ${res.status}`);
      continue;
    }
    cache[f.uuid] = { meta: f, transactions: parseSenateHtml(await res.text()) };
    newUuids.add(f.uuid);
    fetched++;
    if (cachePath && fetched % 20 === 0) fs.writeFileSync(cachePath, JSON.stringify(cache));
    await sleep(400);
  }
  if (cachePath) fs.writeFileSync(cachePath, JSON.stringify(cache));
  console.log(`Senate: ${fetched} newly fetched`);

  const trades = [];
  for (const [uuid, entry] of Object.entries(cache)) {
    const f = entry.meta;
    entry.transactions.forEach((t, i) => {
      trades.push({
        id: `s-${uuid}:${i}`,
        first: f.first,
        last: f.last,
        state: '',
        ...t,
        disclosureDate: toISO(f.dateFiled),
        link: `${BASE}/search/view/ptr/${uuid}/`,
        _newThisRun: newUuids.has(uuid),
      });
    });
  }
  return { trades, filings: filings.length, skippedPaper: paper.length, error: null };
}
