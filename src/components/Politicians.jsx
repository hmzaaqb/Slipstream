import { FONT, COLOR, glass, chipStyle, avatarStyle, label, GOLD_GRADIENT } from '../ui/styles';
import { EmptyRow } from '../ui/bits';
import { ScreenTitle, IconButton, PartyReturn } from './Shell';
import { SearchIcon, FilterIcon } from '../ui/icons';
import { fmtPct, fmtMoneyShort, timeAgo, chamberLabel } from '../api';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'senate', label: 'Senate' },
  { id: 'house', label: 'House' },
  { id: 'followed', label: 'Followed' },
  { id: 'dem', label: 'Democrat' },
  { id: 'rep', label: 'Republican' },
];

const SORTS = [
  { id: 'recent', label: 'Recent' },
  { id: 'roi', label: 'Return' },
  { id: 'volume', label: 'Volume' },
  { id: 'trades', label: 'Trades' },
];

function PoliticianCard({ pol, followed, metric, onToggleFollow, onOpen }) {
  const metricVal = metric === 'sp' ? pol.sp : pol.roi;
  const up = (metricVal ?? 0) >= 0;

  return (
    <div style={{ padding: 16, borderRadius: 20, ...glass('mid', { borderRadius: 20, border: `1px solid ${followed ? COLOR.goldEdgeStrong : COLOR.hairline}` }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div onClick={() => onOpen(pol)} role="button" style={{ position: 'relative', cursor: 'pointer' }}>
          <div style={avatarStyle(pol.from, pol.to, 52, followed)}>{pol.initials}</div>
          {followed && (
            <div style={{ position: 'absolute', right: -1, bottom: -1, width: 14, height: 14, borderRadius: '50%', background: COLOR.gold, border: `2.5px solid ${COLOR.surface}` }} />
          )}
        </div>
        <div onClick={() => onOpen(pol)} role="button" style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 16.5, letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pol.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
            <span style={{ padding: '2.5px 7px', borderRadius: 6, background: COLOR.elevated, border: '1px solid rgba(255,255,255,0.10)', fontFamily: FONT.archivo, fontWeight: 700, fontSize: 10, color: pol.party === 'D' ? COLOR.dem : pol.party === 'R' ? COLOR.rep : COLOR.muted }}>
              {pol.party}{pol.state ? ` · ${pol.state}` : ''}
            </span>
            <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim }}>
              {chamberLabel(pol.chamber, '').replace('U.S. ', '')}
            </span>
          </div>
        </div>
        <button
          onClick={() => onToggleFollow(pol.name)}
          style={{
            flex: 'none',
            minHeight: 44,
            padding: '0 16px',
            cursor: 'pointer',
            borderRadius: 13,
            fontFamily: FONT.archivo,
            fontWeight: 800,
            fontSize: 12.5,
            transition: 'all .2s',
            background: followed ? 'rgba(212,175,55,0.12)' : GOLD_GRADIENT,
            color: followed ? COLOR.goldSoft : '#090909',
            border: `1px solid ${followed ? COLOR.goldEdgeStrong : 'rgba(255,255,255,0.18)'}`,
          }}
        >
          {followed ? 'Following' : 'Follow'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          {/* Amounts come from disclosure *brackets*, so this is a midpoint
              estimate, not a measured figure. Labelled as such. */}
          <div style={label()}>EST. VOLUME</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 16, marginTop: 3 }}>{fmtMoneyShort(pol.volume)}</div>
        </div>
        <div>
          <div style={label()}>TRADES</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 16, marginTop: 3 }}>{pol.tradeCount}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={label()}>{metric === 'sp' ? 'VS S&P' : 'EST. RETURN'}</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 16, marginTop: 3, color: metricVal == null ? COLOR.dim : up ? COLOR.green : COLOR.red }}>
            {fmtPct(metricVal)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim }}>
          {pol.tradeCount} disclosure{pol.tradeCount === 1 ? '' : 's'} · latest {timeAgo(pol.lastDisclosure).toLowerCase()}
        </span>
        <span onClick={() => onOpen(pol)} role="button" style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 12, color: COLOR.goldSoft, cursor: 'pointer' }}>
          View portfolio
        </span>
      </div>
    </div>
  );
}

export default function Politicians({
  politicians,
  totalCount,
  search,
  setSearch,
  filter,
  setFilter,
  sort,
  setSort,
  sortOpen,
  toggleSortOpen,
  metric,
  setMetric,
  partyReturn,
  followedNames,
  onToggleFollow,
  onOpen,
  pricesLoading,
}) {
  return (
    <div className="fade-in">
      <ScreenTitle
        title="Politicians"
        sub={`${totalCount} tracked · ${pricesLoading ? 'computing returns…' : `sorted by ${SORTS.find((s) => s.id === sort)?.label.toLowerCase()}`}`}
        right={<IconButton onClick={toggleSortOpen} title="Sort"><FilterIcon /></IconButton>}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 16, padding: '0 16px', height: 50, borderRadius: 16, background: COLOR.surface, border: '1px solid rgba(255,255,255,0.10)' }}>
        <SearchIcon size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or state"
          style={{ flex: 1, background: 'none', border: 'none', color: COLOR.text, fontFamily: FONT.archivo, fontWeight: 600, fontSize: 14, height: '100%', outline: 'none' }}
        />
      </div>

      <div className="hscroll" style={{ display: 'flex', gap: 8, marginTop: 12, paddingBottom: 4 }}>
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={chipStyle(filter === f.id)}>{f.label}</button>
        ))}
      </div>

      {sortOpen && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, padding: 10, borderRadius: 16, ...glass('soft', { borderRadius: 16 }) }}>
          {SORTS.map((s) => (
            <button key={s.id} onClick={() => setSort(s.id)} style={{ ...chipStyle(sort === s.id), flex: 1, justifyContent: 'center', padding: '9px 8px' }}>{s.label}</button>
          ))}
          <button onClick={() => setMetric(metric === 'roi' ? 'sp' : 'roi')} style={{ ...chipStyle(metric === 'sp'), flex: 'none', padding: '9px 12px' }}>
            {metric === 'sp' ? 'vs S&P' : 'ROI'}
          </button>
        </div>
      )}

      {partyReturn && <PartyReturn dem={partyReturn.dem} rep={partyReturn.rep} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {politicians.length === 0 ? (
          <EmptyRow>No politicians match those filters.</EmptyRow>
        ) : (
          politicians.map((pol) => (
            <PoliticianCard
              key={pol.name}
              pol={pol}
              metric={metric}
              followed={followedNames.includes(pol.name)}
              onToggleFollow={onToggleFollow}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}
