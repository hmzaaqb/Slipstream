// Bundled fallback dataset of congressional trades. Used only when the live FMP
// API is unreachable or returns nothing, so the app always renders something
// real-looking. Trades are generated deterministically (seeded) from real
// members, tickers and amount brackets, with plausible dates.

export const COMPANIES = {
  NVDA: { name: 'NVIDIA Corporation', sector: 'TECH' },
  AAPL: { name: 'Apple Inc.', sector: 'TECH' },
  MSFT: { name: 'Microsoft Corporation', sector: 'TECH' },
  GOOGL: { name: 'Alphabet Inc.', sector: 'TECH' },
  META: { name: 'Meta Platforms Inc.', sector: 'TECH' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'CONSUMER' },
  TSLA: { name: 'Tesla Inc.', sector: 'CONSUMER' },
  COST: { name: 'Costco Wholesale', sector: 'CONSUMER' },
  HD: { name: 'Home Depot Inc.', sector: 'CONSUMER' },
  WMT: { name: 'Walmart Inc.', sector: 'CONSUMER' },
  MCD: { name: "McDonald's Corporation", sector: 'CONSUMER' },
  JPM: { name: 'JPMorgan Chase & Co.', sector: 'FINANCE' },
  BAC: { name: 'Bank of America', sector: 'FINANCE' },
  GS: { name: 'Goldman Sachs Group', sector: 'FINANCE' },
  V: { name: 'Visa Inc.', sector: 'FINANCE' },
  CVX: { name: 'Chevron Corporation', sector: 'ENERGY' },
  XOM: { name: 'Exxon Mobil Corp.', sector: 'ENERGY' },
  COP: { name: 'ConocoPhillips', sector: 'ENERGY' },
  LMT: { name: 'Lockheed Martin', sector: 'DEFENSE' },
  RTX: { name: 'RTX Corporation', sector: 'DEFENSE' },
  NOC: { name: 'Northrop Grumman', sector: 'DEFENSE' },
  GD: { name: 'General Dynamics', sector: 'DEFENSE' },
  PFE: { name: 'Pfizer Inc.', sector: 'HEALTH' },
  JNJ: { name: 'Johnson & Johnson', sector: 'HEALTH' },
  UNH: { name: 'UnitedHealth Group', sector: 'HEALTH' },
  BMY: { name: 'Bristol-Myers Squibb', sector: 'HEALTH' },
  LLY: { name: 'Eli Lilly and Co.', sector: 'HEALTH' },
  DIS: { name: 'Walt Disney Co.', sector: 'CONSUMER' },
  NKE: { name: 'Nike Inc.', sector: 'CONSUMER' },
  CRM: { name: 'Salesforce Inc.', sector: 'TECH' },
};

const MEMBERS = [
  ['Nancy Pelosi', 'D', 'CA', 'house'],
  ['Dan Crenshaw', 'R', 'TX', 'house'],
  ['Ro Khanna', 'D', 'CA', 'house'],
  ['Tommy Tuberville', 'R', 'AL', 'senate'],
  ['Josh Gottheimer', 'D', 'NJ', 'house'],
  ['Marjorie Taylor Greene', 'R', 'GA', 'house'],
  ['Michael McCaul', 'R', 'TX', 'house'],
  ['Sheldon Whitehouse', 'D', 'RI', 'senate'],
  ['Jerry Moran', 'R', 'KS', 'senate'],
  ['Jeff Merkley', 'D', 'OR', 'senate'],
  ['Adrian Smith', 'R', 'NE', 'house'],
  ['Richard Hudson', 'R', 'NC', 'house'],
  ['Kevin Hern', 'R', 'OK', 'house'],
  ['Donald Beyer', 'D', 'VA', 'house'],
  ['Markwayne Mullin', 'R', 'OK', 'senate'],
  ['Susan Collins', 'R', 'ME', 'senate'],
  ['Gary Peters', 'D', 'MI', 'senate'],
  ['John Hickenlooper', 'D', 'CO', 'senate'],
  ['Earl Blumenauer', 'D', 'OR', 'house'],
  ['Brian Mast', 'R', 'FL', 'house'],
  ['Lois Frankel', 'D', 'FL', 'house'],
  ['Blake Moore', 'R', 'UT', 'house'],
  ['Daniel Goldman', 'D', 'NY', 'house'],
  ['Nicole Malliotakis', 'R', 'NY', 'house'],
];

const TICKERS = Object.keys(COMPANIES);
const BRACKETS = [
  [1001, 15000],
  [15001, 50000],
  [50001, 100000],
  [100001, 250000],
  [250001, 500000],
  [500001, 1000000],
];

// Small seeded PRNG (mulberry32) for deterministic generation.
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generate() {
  const rand = rng(20260611);
  const trades = [];
  const now = Date.UTC(2026, 5, 11); // 2026-06-11
  const day = 1000 * 60 * 60 * 24;
  let id = 0;

  for (let m = 0; m < MEMBERS.length; m++) {
    const [name, party, state, chamber] = MEMBERS[m];
    const count = 4 + Math.floor(rand() * 12); // 4-15 trades each
    for (let i = 0; i < count; i++) {
      const symbol = TICKERS[Math.floor(rand() * TICKERS.length)];
      const bracket = BRACKETS[Math.floor(rand() * BRACKETS.length)];
      const isBuy = rand() > 0.42;
      const tradedDaysAgo = 3 + Math.floor(rand() * 540);
      const discDelay = 5 + Math.floor(rand() * 40);
      const transactionDate = new Date(now - tradedDaysAgo * day).toISOString().slice(0, 10);
      const disclosureDate = new Date(now - Math.max(0, tradedDaysAgo - discDelay) * day)
        .toISOString()
        .slice(0, 10);
      trades.push({
        id: 'sample-' + id++,
        name,
        party,
        state,
        chamber,
        symbol,
        company: COMPANIES[symbol].name,
        sector: COMPANIES[symbol].sector,
        type: isBuy ? 'buy' : 'sell',
        amountLow: bracket[0],
        amountHigh: bracket[1],
        amountMid: Math.round((bracket[0] + bracket[1]) / 2),
        transactionDate,
        disclosureDate,
        link: '',
      });
    }
  }
  // newest disclosure first
  trades.sort((a, b) => new Date(b.disclosureDate) - new Date(a.disclosureDate));
  return trades;
}

export const SAMPLE_TRADES = generate();

// Deterministic synthetic price histories for DEMO_MODE, so ROI / win-rate /
// S&P alpha and sparklines all render without any network access. Covers every
// sample ticker plus the SPY benchmark — ~600 daily closes ending 2026-06-11,
// which spans the full date range of the generated sample trades.
export function buildSamplePriceMap() {
  const map = new Map();
  const end = Date.UTC(2026, 5, 11); // 2026-06-11
  const day = 1000 * 60 * 60 * 24;
  const N = 600;
  const symbols = [...TICKERS, 'SPY'];

  for (const sym of symbols) {
    let seed = 0;
    for (let i = 0; i < sym.length; i++) seed = (seed * 31 + sym.charCodeAt(i)) >>> 0;
    const rand = rng(seed + 7);
    // SPY drifts steadily up; individual names get a spread of trends (some down)
    // so the leaderboard shows a realistic mix of winners and losers.
    const drift = sym === 'SPY' ? 0.00035 : (rand() - 0.42) * 0.0016;
    let price = 20 + rand() * 380;
    const history = [];
    for (let i = N - 1; i >= 0; i--) {
      const date = new Date(end - i * day).toISOString().slice(0, 10);
      price = Math.max(1, price * (1 + drift + (rand() - 0.5) * 0.03));
      history.push({ date, close: Math.round(price * 100) / 100 });
    }
    map.set(sym, { history, last: history[history.length - 1].close });
  }
  return map;
}
