// FIFO return-math tests. These protect the single most important number in
// the app — run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeReturns, priceOnOrAfter } from '../src/lib/returns.js';

const px = (points, last) => ({ history: points.map(([date, close]) => ({ date, close })), last });
const buy = (symbol, date, mid) => ({ type: 'buy', symbol, transactionDate: date, amountMid: mid });
const sell = (symbol, date, mid) => ({ type: 'sell', symbol, transactionDate: date, amountMid: mid });

test('priceOnOrAfter picks first close on/after the date', () => {
  const h = [{ date: '2026-01-05', close: 10 }, { date: '2026-01-12', close: 12 }];
  assert.equal(priceOnOrAfter(h, '2026-01-05'), 10);
  assert.equal(priceOnOrAfter(h, '2026-01-06'), 12);
  assert.equal(priceOnOrAfter(h, '2026-02-01'), 12); // falls back to latest
  assert.equal(priceOnOrAfter([], '2026-01-01'), null);
});

test('buy-only: marked to latest close', () => {
  const map = new Map([['AAA', px([['2026-01-05', 100]], 110)]]);
  const r = computeReturns([buy('AAA', '2026-01-05', 1000)], map);
  assert.ok(Math.abs(r.roi - 0.10) < 1e-9); // +10%
  assert.equal(r.scored, 1);
  assert.equal(r.winRate, 1);
});

test('a loss sold stays a loss even if the price later recovers', () => {
  // bought at 100, sold at 80, price now back at 120. Old buys-only math would
  // report +20%; sell-aware must report the realized -20%.
  const map = new Map([['AAA', px([['2026-01-05', 100], ['2026-02-05', 80]], 120)]]);
  const r = computeReturns([buy('AAA', '2026-01-05', 1000), sell('AAA', '2026-02-05', 1000)], map);
  assert.ok(Math.abs(r.roi - -0.20) < 1e-9);
  assert.equal(r.winRate, 0);
});

test('partial sell: realized on closed dollars, rest unrealized', () => {
  // buy $1000 @100; sell $400 @120 (+20% realized on 400);
  // remaining $600 marked at last=90 (-10%). pnl = 80 - 60 = 20 → roi 2%.
  const map = new Map([['AAA', px([['2026-01-05', 100], ['2026-02-05', 120]], 90)]]);
  const r = computeReturns([buy('AAA', '2026-01-05', 1000), sell('AAA', '2026-02-05', 400)], map);
  assert.ok(Math.abs(r.roi - 0.02) < 1e-9);
  assert.equal(r.scored, 2); // one realized close + one open remainder
});

test('sell exceeding open dollars is clamped, never negative exposure', () => {
  const map = new Map([['AAA', px([['2026-01-05', 100], ['2026-02-05', 120]], 200)]]);
  const r = computeReturns([buy('AAA', '2026-01-05', 500), sell('AAA', '2026-02-05', 5000)], map);
  // whole 500 realized at +20%; nothing left open
  assert.ok(Math.abs(r.roi - 0.20) < 1e-9);
  assert.equal(r.scored, 1);
});

test('sell with no prior buy is skipped (entry unknowable)', () => {
  const map = new Map([['AAA', px([['2026-01-05', 100]], 50)]]);
  const r = computeReturns([sell('AAA', '2026-01-05', 1000)], map);
  assert.equal(r.roi, null);
  assert.equal(r.scored, 0);
});

test('FIFO: oldest lot closes first', () => {
  // lot1 $100 @100, lot2 $100 @200. Sell $100 @150: closes lot1 (+50%).
  // lot2 stays open, marked at last=200 (0%). pnl = 50 → roi = 50/200 = 25%.
  const map = new Map([['AAA', px([['2026-01-05', 100], ['2026-01-10', 200], ['2026-02-05', 150]], 200)]]);
  const r = computeReturns(
    [buy('AAA', '2026-01-05', 100), buy('AAA', '2026-01-10', 100), sell('AAA', '2026-02-05', 100)],
    map,
  );
  assert.ok(Math.abs(r.roi - 0.25) < 1e-9);
});

test('vs S&P uses matching entry/exit dates', () => {
  // stock +20%, SPY +10% over the same window → alpha +10%.
  const map = new Map([
    ['AAA', px([['2026-01-05', 100]], 120)],
    ['SPY', px([['2026-01-05', 500]], 550)],
  ]);
  const r = computeReturns([buy('AAA', '2026-01-05', 1000)], map);
  assert.ok(Math.abs(r.sp - 0.10) < 1e-9);
});

test('symbols without prices are ignored, not crashed on', () => {
  const map = new Map([['AAA', px([['2026-01-05', 100]], 110)]]);
  const r = computeReturns([buy('AAA', '2026-01-05', 1000), buy('ZZZ', '2026-01-05', 99999)], map);
  assert.equal(r.scored, 1);
  assert.ok(Math.abs(r.roi - 0.10) < 1e-9);
});
