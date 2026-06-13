// FMP's congressional-trading endpoints return the trade and the politician's
// name, but NOT their party or home state. This module supplies that metadata
// for the members who actually appear in the trading feeds (the active traders
// + leadership cover the overwhelming majority of disclosed volume).
//
// party: 'D' | 'R' | 'I'   state: USPS code   chamber: 'senate' | 'house'
//
// Names are matched case-insensitively and punctuation-insensitively, so
// "Mr. Ro Khanna" or "KHANNA, RO" both resolve. Unknown names fall back to the
// chamber implied by the data source and an 'I'/neutral styling.

const RAW = [
  // ---- Senate ----
  ['Tommy Tuberville', 'R', 'AL', 'senate'],
  ['Tuberville', 'R', 'AL', 'senate'],
  ['Sheldon Whitehouse', 'D', 'RI', 'senate'],
  ['Jerry Moran', 'R', 'KS', 'senate'],
  ['Thomas Carper', 'D', 'DE', 'senate'],
  ['Tom Carper', 'D', 'DE', 'senate'],
  ['Shelley Moore Capito', 'R', 'WV', 'senate'],
  ['John Hickenlooper', 'D', 'CO', 'senate'],
  ['Markwayne Mullin', 'R', 'OK', 'senate'],
  ['Rick Scott', 'R', 'FL', 'senate'],
  ['Ron Wyden', 'D', 'OR', 'senate'],
  ['Jeff Merkley', 'D', 'OR', 'senate'],
  ['Gary Peters', 'D', 'MI', 'senate'],
  ['Susan Collins', 'R', 'ME', 'senate'],
  ['Roger Marshall', 'R', 'KS', 'senate'],
  ['Bill Hagerty', 'R', 'TN', 'senate'],
  ['Cynthia Lummis', 'R', 'WY', 'senate'],
  ['John Boozman', 'R', 'AR', 'senate'],
  ['Tina Smith', 'D', 'MN', 'senate'],
  ['Dan Sullivan', 'R', 'AK', 'senate'],
  ['Mark Warner', 'D', 'VA', 'senate'],
  ['Pat Roberts', 'R', 'KS', 'senate'],
  ['David Perdue', 'R', 'GA', 'senate'],
  ['Kelly Loeffler', 'R', 'GA', 'senate'],
  ['Richard Burr', 'R', 'NC', 'senate'],
  ['Dianne Feinstein', 'D', 'CA', 'senate'],
  ['Lindsey Graham', 'R', 'SC', 'senate'],
  ['Ted Cruz', 'R', 'TX', 'senate'],
  ['John Cornyn', 'R', 'TX', 'senate'],
  ['Mitch McConnell', 'R', 'KY', 'senate'],
  ['Rand Paul', 'R', 'KY', 'senate'],
  ['Angus King', 'I', 'ME', 'senate'],
  ['Bernie Sanders', 'I', 'VT', 'senate'],
  ['Chuck Grassley', 'R', 'IA', 'senate'],
  ['Joni Ernst', 'R', 'IA', 'senate'],
  ['Mike Crapo', 'R', 'ID', 'senate'],
  ['James Risch', 'R', 'ID', 'senate'],
  ['Tammy Duckworth', 'D', 'IL', 'senate'],

  // ---- House ----
  ['Nancy Pelosi', 'D', 'CA', 'house'],
  ['Pelosi', 'D', 'CA', 'house'],
  ['Paul Pelosi', 'D', 'CA', 'house'],
  ['Dan Crenshaw', 'R', 'TX', 'house'],
  ['Ro Khanna', 'D', 'CA', 'house'],
  ['Marjorie Taylor Greene', 'R', 'GA', 'house'],
  ['Josh Gottheimer', 'D', 'NJ', 'house'],
  ['Michael McCaul', 'R', 'TX', 'house'],
  ['Mike McCaul', 'R', 'TX', 'house'],
  ['Kevin Hern', 'R', 'OK', 'house'],
  ['Virginia Foxx', 'R', 'NC', 'house'],
  ['Richard Hudson', 'R', 'NC', 'house'],
  ['Adrian Smith', 'R', 'NE', 'house'],
  ['Earl Blumenauer', 'D', 'OR', 'house'],
  ['Suzan DelBene', 'D', 'WA', 'house'],
  ['Donald Beyer', 'D', 'VA', 'house'],
  ['Don Beyer', 'D', 'VA', 'house'],
  ['John Curtis', 'R', 'UT', 'house'],
  ['Bill Keating', 'D', 'MA', 'house'],
  ['Garret Graves', 'R', 'LA', 'house'],
  ['Tom Malinowski', 'D', 'NJ', 'house'],
  ['Brian Mast', 'R', 'FL', 'house'],
  ['Pat Fallon', 'R', 'TX', 'house'],
  ['Patrick Fallon', 'R', 'TX', 'house'],
  ['Greg Gianforte', 'R', 'MT', 'house'],
  ['Lois Frankel', 'D', 'FL', 'house'],
  ['Debbie Wasserman Schultz', 'D', 'FL', 'house'],
  ['Mark Green', 'R', 'TN', 'house'],
  ['Scott Franklin', 'R', 'FL', 'house'],
  ['Daniel Goldman', 'D', 'NY', 'house'],
  ['Dan Goldman', 'D', 'NY', 'house'],
  ['Marie Newman', 'D', 'IL', 'house'],
  ['Diana Harshbarger', 'R', 'TN', 'house'],
  ['Blake Moore', 'R', 'UT', 'house'],
  ['Kathy Manning', 'D', 'NC', 'house'],
  ['Susie Lee', 'D', 'NV', 'house'],
  ['Cindy Axne', 'D', 'IA', 'house'],
  ['Austin Scott', 'R', 'GA', 'house'],
  ['August Pfluger', 'R', 'TX', 'house'],
  ['French Hill', 'R', 'AR', 'house'],
  ['Nicole Malliotakis', 'R', 'NY', 'house'],
  ['Carol Miller', 'R', 'WV', 'house'],
  ['Michael Conaway', 'R', 'TX', 'house'],
  ['Donna Shalala', 'D', 'FL', 'house'],
  ['David McKinley', 'R', 'WV', 'house'],
  ['Gilbert Cisneros', 'D', 'CA', 'house'],
  ['Kurt Schrader', 'D', 'OR', 'house'],
  ['Doris Matsui', 'D', 'CA', 'house'],
  ['John Rutherford', 'R', 'FL', 'house'],
  ['Bob Gibbs', 'R', 'OH', 'house'],
  ['Steve Cohen', 'D', 'TN', 'house'],
  ['Tom Suozzi', 'D', 'NY', 'house'],
  ['Vern Buchanan', 'R', 'FL', 'house'],
  ['Rohit Khanna', 'D', 'CA', 'house'],
  ['Seth Moulton', 'D', 'MA', 'house'],
  ['Katherine Clark', 'D', 'MA', 'house'],
  ['Jared Moskowitz', 'D', 'FL', 'house'],
];

function norm(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|dr|sen|rep|hon)\.?\b/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const MAP = new Map();
for (const [name, party, state, chamber] of RAW) {
  MAP.set(norm(name), { party, state, chamber });
}

// US state abbreviation -> full handled elsewhere; here we just normalize a
// raw "office"/"district" string into a 2-letter state code when possible.
export function stateFromDistrict(district) {
  if (!district) return '';
  const m = String(district).trim().match(/^([A-Za-z]{2})/);
  return m ? m[1].toUpperCase() : '';
}

// Resolve party/state/chamber for a politician name. `hintChamber` is the
// chamber implied by the data source (which feed the trade came from).
export function resolveMember(name, hintChamber, hintState) {
  const key = norm(name);
  let info = MAP.get(key);
  if (!info) {
    // try last-name-only match
    const parts = key.split(' ');
    if (parts.length > 1) {
      info = MAP.get(parts[parts.length - 1]);
    }
  }
  if (info) {
    return {
      party: info.party,
      state: hintState || info.state || '',
      chamber: info.chamber || hintChamber || 'house',
    };
  }
  return { party: '?', state: hintState || '', chamber: hintChamber || 'house' };
}

// Visual gradient for an avatar, keyed off party with a deterministic fallback
// so unknown members still get a stable, distinct color.
const NEUTRAL_GRADIENTS = [
  ['#7B6BE8', '#4F3BCB'],
  ['#2EE5A6', '#15A874'],
  ['#FF7A59', '#E5432C'],
  ['#5B9CFF', '#2C5FE0'],
  ['#F0B583', '#C2723A'],
];

export function avatarColors(name, party) {
  if (party === 'D') return ['#5B9CFF', '#2C5FE0'];
  if (party === 'R') return ['#FF7A59', '#E5432C'];
  let h = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return NEUTRAL_GRADIENTS[h % NEUTRAL_GRADIENTS.length];
}

export function initials(name) {
  const parts = String(name || '')
    .replace(/[^A-Za-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
