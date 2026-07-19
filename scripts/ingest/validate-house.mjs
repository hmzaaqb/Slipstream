// Validation harness — how much of the real House PTR corpus do we actually
// parse? Run this after touching the parser; extraction rate is the number that
// decides whether this pipeline is trustworthy.
//
//   node scripts/ingest/validate-house.mjs [sampleSize] [year]

import { fetchIndex, fetchPtr } from './house.mjs';

const size = Number(process.argv[2] || 60);
const year = Number(process.argv[3] || new Date().getFullYear());

const filings = await fetchIndex(year);
console.log(`PTR filings in ${year}: ${filings.length}`);

const sample = filings.slice(-size);
let noText = 0, empty = 0, rows = 0, failed = 0;
const emptyDocs = [];
const suspect = new Set();

for (const f of sample) {
  try {
    const { transactions, hasTextLayer } = await fetchPtr(f.year, f.docId);
    if (!hasTextLayer) { noText++; continue; }
    if (!transactions.length) { empty++; emptyDocs.push(f.docId); continue; }
    rows += transactions.length;
    for (const t of transactions) {
      if (t.symbol && !/^[A-Z][A-Z.]{0,5}$/.test(t.symbol)) suspect.add(`symbol:${t.symbol}`);
      if (!t.transactionDate) suspect.add(`date:${t.symbol}`);
      if (!t.amountHigh) suspect.add(`amount:${t.symbol}`);
      if (!t.asset) suspect.add(`asset:${t.symbol}`);
    }
  } catch (e) {
    failed++;
    console.log('  ERR', f.docId, e.message);
  }
}

const parsed = sample.length - noText - empty - failed;
console.log(`
sampled:          ${sample.length}
fetch failed:     ${failed}
no text layer:    ${noText}    (scanned/paper filings — need OCR)
text but 0 rows:  ${empty}    ${emptyDocs.slice(0, 8).join(',')}
filings parsed:   ${parsed}    (${((parsed / sample.length) * 100).toFixed(1)}%)
transactions:     ${rows}
suspect fields:   ${[...suspect].slice(0, 12).join(', ') || 'none'}
`);

const last = sample.at(-1);
const { transactions } = await fetchPtr(last.year, last.docId);
console.log(`sample rows — ${last.first} ${last.last} (${last.district}) doc ${last.docId}`);
console.table(transactions.slice(0, 6));
