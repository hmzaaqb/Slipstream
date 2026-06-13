import { FONT, COLOR, glass, chipStyle, metricStyle, avatarStyle } from '../ui/styles';
import { SearchIcon, FilterIcon, Chevron } from '../ui/icons';
import { toLeaderCards } from '../api';

const SORT_LABELS = { recent: 'MOST RECENT', roi: 'BEST ROI', win: 'BEST WIN RATE', volume: 'MOST VOLUME', trades: 'MOST TRADES' };

const PARTY_OPTS = [
  { id: 'all', label: 'All Parties' },
  { id: 'dem', label: 'Democrat', dot: '#5B9CFF' },
  { id: 'rep', label: 'Republican', dot: '#FF6B5B' },
];
const CHAMBER_OPTS = [
  { id: 'both', label: 'Both Chambers' },
  { id: 'senate', label: 'Senate Only' },
  { id: 'house', label: 'House of Representatives' },
];
const SORT_OPTS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'roi', label: 'Best ROI' },
  { id: 'win', label: 'Best Win Rate' },
  { id: 'volume', label: 'Most Volume' },
  { id: 'trades', label: 'Most Trades' },
];

function Dot({ color }) {
  if (!color) return null;
  return <span style={{ width: 11, height: 11, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, display: 'inline-block' }} />;
}

function ChipRow({ opts, current, group, onPick }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 11 }}>
      {opts.map((o) => (
        <button key={o.id} onClick={() => onPick(group, o.id)} style={chipStyle(current === o.id)}>
          <Dot color={o.dot} />
          {o.label}
        </button>
      ))}
    </div>
  );
}

function label(group, text) {
  return <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '2px', color: 'rgba(243,241,248,0.5)', marginTop: group === 'party' ? 0 : 20 }}>{text}</div>;
}

function LeaderCard({ card, onClick }) {
  return (
    <div onClick={onClick} className="lg card-int" style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 14, padding: 18, cursor: 'pointer', borderRadius: 26, ...glass('card', { borderRadius: 26, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28),inset 0 -1px 2px rgba(0,0,0,0.25),0 14px 34px rgba(0,0,0,0.45)', overflow: 'hidden' }) }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flex: 'none' }}>
        <div style={{ width: 30, height: 30, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.black, fontSize: 14, color: card.rankTextDark ? '#1a1208' : '#fff', background: card.rankTint, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5),0 4px 10px rgba(0,0,0,0.4)' }}>{card.rank}</div>
        <div style={avatarStyle(card.from, card.to, 62)}>
          <span style={{ fontFamily: FONT.black, fontSize: 19, color: '#fff', letterSpacing: '-0.5px', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{card.initials}</span>
          <div style={{ position: 'absolute', top: 7, left: 11, width: 18, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', filter: 'blur(2px)' }} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONT.black, fontSize: 23, lineHeight: 1, letterSpacing: '-0.4px' }}>{card.name}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '1px', color: 'rgba(243,241,248,0.5)', marginTop: 7 }}>{card.chamber}</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 14, color: COLOR.pink, marginTop: 9 }}>{card.disclosed}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', color: 'rgba(243,241,248,0.4)', marginTop: 8 }}>{card.time}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', flex: 'none', textAlign: 'right' }}>
        <svg width="74" height="34" viewBox="0 0 74 34" fill="none" style={{ marginBottom: 6 }}>
          <polyline points={card.points} fill="none" stroke={card.roiPositive === false ? COLOR.red : COLOR.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={card.dotX} cy={card.dotY} r="3.2" fill={card.roiPositive === false ? COLOR.red : COLOR.green} />
        </svg>
        <div style={{ fontFamily: FONT.black, fontSize: 30, lineHeight: 0.95, color: card.roiPositive === false ? COLOR.red : COLOR.green, letterSpacing: '-1px' }}>{card.roi}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '2px', color: 'rgba(243,241,248,0.45)', marginTop: 6 }}>{card.metricTag}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', color: 'rgba(243,241,248,0.55)', marginTop: 4 }}>{card.trades}</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 11, letterSpacing: '1px', color: COLOR.green, marginTop: 4 }}>{card.win}</div>
      </div>
    </div>
  );
}

export default function Leaders({ politicians, metric, setMetric, search, setSearch, filtersOpen, toggleFilters, party, chamber, sort, onPick, onSelect, pricesLoading }) {
  const cards = toLeaderCards(politicians, metric);
  return (
    <div>
      {/* search */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderRadius: 20, ...glass('mid', { borderRadius: 20, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2),0 8px 22px rgba(0,0,0,0.35)' }) }}>
        <SearchIcon />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search politician name…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 15, color: '#F3F1F8' }}
        />
      </div>

      {/* filters row */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={toggleFilters} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', cursor: 'pointer', borderRadius: 16, background: 'linear-gradient(160deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)', color: '#F3F1F8', fontFamily: FONT.black, fontSize: 13, letterSpacing: '1px' }}>
          <FilterIcon />
          FILTERS
          <Chevron style={{ transition: 'transform .25s', transform: `rotate(${filtersOpen ? 180 : 0}deg)` }} />
        </button>
        <div style={{ display: 'flex', padding: 5, borderRadius: 16, ...glass('mid', { borderRadius: 16 }) }}>
          <button onClick={() => setMetric('roi')} style={metricStyle(metric === 'roi')}>ROI</button>
          <button onClick={() => setMetric('sp')} style={metricStyle(metric === 'sp')}>vs S&amp;P</button>
        </div>
      </div>

      {/* filters panel */}
      {filtersOpen && (
        <div style={{ marginTop: 14, padding: 20, borderRadius: 24, ...glass('mid', { borderRadius: 24, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.24),0 14px 34px rgba(0,0,0,0.45)' }) }}>
          {label('party', 'PARTY')}
          <ChipRow opts={PARTY_OPTS} current={party} group="party" onPick={onPick} />
          {label('chamber', 'CHAMBER')}
          <ChipRow opts={CHAMBER_OPTS} current={chamber} group="chamber" onPick={onPick} />
          {label('sort', 'SORT BY')}
          <ChipRow opts={SORT_OPTS} current={sort} group="sort" onPick={onPick} />
        </div>
      )}

      {/* count */}
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT.mono, fontSize: 12, letterSpacing: '2px', color: 'rgba(243,241,248,0.45)' }}>
        <span style={{ color: 'rgba(243,241,248,0.8)' }}>{politicians.length} POLITICIANS</span>
        <span>·</span>
        <span style={{ color: COLOR.pink }}>SORTED BY {SORT_LABELS[sort]}</span>
        {pricesLoading && <span style={{ color: 'rgba(243,241,248,0.4)' }}>· computing ROI…</span>}
      </div>

      {/* cards */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {cards.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', fontFamily: FONT.mono, fontSize: 12, color: 'rgba(243,241,248,0.4)' }}>No politicians match these filters.</div>
        )}
        {cards.map((card, i) => (
          <LeaderCard key={card.name} card={card} onClick={() => onSelect(politicians[i])} />
        ))}
      </div>
    </div>
  );
}
