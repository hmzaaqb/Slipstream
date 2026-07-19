// Pure return-math module: no imports, no environment access, so it runs
// identically in the browser (via api.js) and under `node --test`.

/** First close on/after a date; falls back to the latest close. */
export function priceOnOrAfter(history, dateStr) {
  if (!history || !history.length || !dateStr) return null;
  const target = new Date(dateStr).getTime();
  for (let i = 0; i < history.length; i++) {
    if (new Date(history[i].date).getTime() >= target) return history[i].close;
  }
  return history[history.length - 1].close;
}

/**
 * Sell-aware FIFO returns: { roi, sp, winRate, scored }.
 *
 * Buys open dollar lots at the entry close; sells close open dollars (oldest
 * first) at the sale-date close, locking in a REALIZED return — a position
 * sold at a loss stays a loss, instead of being marked to today's price
 * forever. Whatever remains open is UNREALIZED at the latest close.
 * ROI = total P/L over total dollars deployed. "vs S&P" runs SPY through the
 * identical entry/exit dates and weights. Sells with no prior disclosed buy
 * are skipped (the entry price is unknowable from filings).
 */
export function computeReturns(trades, priceMap) {
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
