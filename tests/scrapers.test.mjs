// Scraper unit tests: the Senate HTML parser against a realistic fixture, and
// the House helpers. The House PDF parser is covered separately by the live
// validation harness (npm run validate-house) since it needs real PDFs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSenateHtml } from '../scripts/ingest/senate.mjs';
import { toISODate, stateFromDistrict, parseAmount } from '../scripts/ingest/house.mjs';

// Trimmed from a real eFD PTR view page (Tuberville, July 2026).
const SENATE_FIXTURE = `
<table>
<tr><th>&#35;</th><th>Transaction Date</th><th>Owner</th><th>Ticker</th><th>Asset Name</th><th>Asset Type</th><th>Type</th><th>Amount</th><th>Comment</th></tr>
<tr><td>11</td><td>06/09/2026</td><td>Self</td><td><a href="#">WAB</a></td><td>Westinghouse Air Brake Technologies Corporation Common Stock</td><td>Stock</td><td>Sale (Full)</td><td>$1,001 - $15,000</td><td>--</td></tr>
<tr><td>10</td><td>06/08/2026</td><td>Joint</td><td>--</td><td>ACN - Accenture plc Class A Ordinary Shares (Ireland)</td><td>Stock</td><td>Sale (Full)</td><td>$1,001 - $15,000</td><td>--</td></tr>
<tr><td>9</td><td>06/08/2026</td><td>Spouse</td><td><a href="#">AWK</a></td><td>American Water Works Company, Inc. Common Stock</td><td>Stock</td><td>Purchase</td><td>$15,001 - $50,000</td><td>--</td></tr>
<tr><td>8</td><td>06/07/2026</td><td>Self</td><td><a href="#">NVDA</a></td><td>NVIDIA Corporation</td><td>Stock</td><td>Sale (Partial)</td><td>$50,001 - $100,000</td><td>--</td></tr>
</table>`;

test('senate: parses all transaction rows, skips the header', () => {
  const rows = parseSenateHtml(SENATE_FIXTURE);
  assert.equal(rows.length, 4);
});

test('senate: field extraction on a plain row', () => {
  const [r] = parseSenateHtml(SENATE_FIXTURE);
  assert.equal(r.symbol, 'WAB');
  assert.equal(r.type, 'sell');
  assert.equal(r.owner, 'self');
  assert.equal(r.transactionDate, '2026-06-09');
  assert.equal(r.amountLow, 1001);
  assert.equal(r.amountHigh, 15000);
  assert.equal(r.amountMid, 8001);
});

test('senate: "--" ticker recovers symbol from "ACN - " asset-name prefix', () => {
  const rows = parseSenateHtml(SENATE_FIXTURE);
  assert.equal(rows[1].symbol, 'ACN');
});

test('senate: owner mapping (Joint/Spouse) and buy detection', () => {
  const rows = parseSenateHtml(SENATE_FIXTURE);
  assert.equal(rows[1].owner, 'JT');
  assert.equal(rows[2].owner, 'SP');
  assert.equal(rows[2].type, 'buy');
});

test('senate: partial sale flag', () => {
  const rows = parseSenateHtml(SENATE_FIXTURE);
  assert.equal(rows[3].partial, true);
  assert.equal(rows[0].partial, false);
});

test('house: toISODate handles US dates and rejects junk', () => {
  assert.equal(toISODate('7/2/2026'), '2026-07-02');
  assert.equal(toISODate('12/30/2025'), '2025-12-30');
  assert.equal(toISODate('not a date'), '');
  assert.equal(toISODate(''), '');
});

test('house: stateFromDistrict', () => {
  assert.equal(stateFromDistrict('VA01'), 'VA');
  assert.equal(stateFromDistrict('mn02'), 'MN');
  assert.equal(stateFromDistrict(''), '');
});

test('house: parseAmount handles a standard bracket range', () => {
  const { low, high } = parseAmount('$1,001 - $15,000');
  assert.equal(low, 1001);
  assert.equal(high, 15000);
});

test('house: parseAmount handles an exact decimal figure, not two numbers', () => {
  // Regression: "$15.00" used to split into 15 and 0 before the decimal group
  // was added to the amount regex — see house.mjs parseAmount.
  const { low, high } = parseAmount('$15.00');
  assert.equal(low, 15);
  assert.equal(high, 15);
});

test('house: parseAmount handles the top bracket ("Over $X")', () => {
  const { low, high } = parseAmount('Over $50,000,000');
  assert.equal(low, 50000000);
  assert.equal(high, 50000000);
});

test('house: parseAmount returns zeros for text with no figures', () => {
  const { low, high } = parseAmount('');
  assert.equal(low, 0);
  assert.equal(high, 0);
});
