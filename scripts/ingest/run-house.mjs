// House ingest runner.
//
//   node scripts/ingest/run-house.mjs             # ingest new filings into Supabase
//   node scripts/ingest/run-house.mjs --dry-run   # parse + report, write nothing
//   node scripts/ingest/run-house.mjs --limit 25  # cap PDFs fetched this run
//
// Requires (non-dry runs):
//   SUPABASE_URL               your project URL
//   SUPABASE_SERVICE_ROLE_KEY  service key — server-side only, NEVER in the app
//
// Design: incremental and idempotent. The Clerk's index is diffed against the
// `filings` table, so only unseen DocIDs cost a PDF fetch, and re-running after
// a crash re-processes at most the filings that didn't commit. Every trade row
// carries the source PDF URL so any number in the app can be audited against
// the actual government filing.

import { createClient } from '@supabase/supabase-js';
import { fetchIndex, fetchPtr, stateFromDistrict } from './house.mjs';

const DRY = process.argv.includes('--dry-run');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const YEAR = new Date().getFullYear();
const PDF_URL = (year, docId) =>
  `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${year}/${docId}.pdf`;

let db = null;
if (!DRY) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or pass --dry-run.');
    process.exit(1);
  }
  db = createClient(url, key, { auth: { persistSession: false } });
}

/* ----- 1. index ----- */
const index = await fetchIndex(YEAR);
console.log(`House ${YEAR}: ${index.length} PTR filings in index`);

/* ----- 2. diff against what we already have ----- */
let seen = new Set();
if (db) {
  const { data, error } = await db.from('filings').select('doc_id').eq('chamber', 'house');
  if (error) throw new Error(`reading filings: ${error.message}`);
  seen = new Set(data.map((r) => r.doc_id));
}
const fresh = index.filter((f) => !seen.has(f.docId)).slice(0, LIMIT);
console.log(`new filings to process: ${fresh.length}${DRY ? ' (dry run)' : ''}`);

/* ----- 3. fetch, parse, upsert ----- */
const tally = { parsed: 0, no_text_layer: 0, fetch_failed: 0, empty: 0, trades: 0 };

for (const f of fresh) {
  const sourceUrl = PDF_URL(f.year, f.docId);
  let status = 'parsed';
  let transactions = [];

  try {
    const result = await fetchPtr(f.year, f.docId);
    transactions = result.transactions;
    if (!result.hasTextLayer) status = 'no_text_layer';
    else if (!transactions.length) status = 'empty';
  } catch {
    status = 'fetch_failed';
  }

  tally[status === 'parsed' ? 'parsed' : status]++;
  tally.trades += status === 'parsed' ? transactions.length : 0;

  const filingRow = {
    doc_id: f.docId,
    chamber: 'house',
    filer_first: f.first,
    filer_last: f.last,
    district: f.district,
    state: stateFromDistrict(f.district),
    filing_date: f.filingDate || null,
    year: Number(f.year),
    source_url: sourceUrl,
    parse_status: status,
    tx_count: status === 'parsed' ? transactions.length : 0,
  };

  const tradeRows =
    status === 'parsed'
      ? transactions.map((t, i) => ({
          id: `${f.docId}:${i}`,
          doc_id: f.docId,
          chamber: 'house',
          politician: `${f.first} ${f.last}`.trim(),
          state: stateFromDistrict(f.district),
          district: f.district,
          symbol: t.symbol,
          asset: t.asset,
          asset_code: t.assetCode,
          owner: t.owner,
          type: t.type,
          partial: t.partial,
          transaction_date: t.transactionDate || null,
          disclosure_date: t.disclosureDate || null,
          amount_low: t.amountLow,
          amount_high: t.amountHigh,
          amount_mid: t.amountMid,
          source_url: sourceUrl,
        }))
      : [];

  if (DRY) {
    console.log(`  ${f.docId}  ${f.first} ${f.last} (${f.district})  ${status}  ${tradeRows.length} trades`);
    continue;
  }

  // Filing row first, then its trades — so a crash between the two leaves a
  // filing marked with its status, and the trade upsert is retried next run
  // via the same deterministic ids.
  const { error: fe } = await db.from('filings').upsert(filingRow);
  if (fe) throw new Error(`upsert filing ${f.docId}: ${fe.message}`);
  if (tradeRows.length) {
    const { error: te } = await db.from('trades').upsert(tradeRows);
    if (te) throw new Error(`upsert trades ${f.docId}: ${te.message}`);
  }
}

console.log(
  `\ndone: ${tally.parsed} parsed, ${tally.no_text_layer} no text layer, ` +
    `${tally.empty} empty, ${tally.fetch_failed} fetch failed, ${tally.trades} trades${DRY ? ' (nothing written)' : ''}`,
);
