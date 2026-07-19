// Currency formatting for brokerage values (Alpaca returns strings).

export function fmtUSD(n, { decimals = 2 } = {}) {
  const v = Number(n);
  if (n == null || isNaN(v)) return '—';
  return (
    '$' + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  );
}

export function fmtSignedUSD(n) {
  const v = Number(n);
  if (n == null || isNaN(v)) return '—';
  return (v >= 0 ? '+' : '-') + fmtUSD(Math.abs(v));
}
