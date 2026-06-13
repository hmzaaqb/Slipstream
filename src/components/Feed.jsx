import { FONT, COLOR, glass, chipStyle, sideTag, avatarStyle } from '../ui/styles';
import { SearchIcon, Triangle, ClockIcon, Bolt } from '../ui/icons';

const PERIOD_OPTS = [
  { id: 'all', label: 'All Time' },
  { id: '3mo', label: 'Last 3 Mo' },
  { id: 'month', label: 'Last Month' },
  { id: 'week', label: 'Last Week' },
  { id: 'today', label: 'Today' },
];
const TYPE_OPTS = [
  { id: 'all', label: 'All Types' },
  { id: 'buys', label: 'Buys Only' },
  { id: 'sells', label: 'Sells Only' },
];
const SIZE_OPTS = [
  { id: 'any', label: 'Any Size' },
  { id: '250', label: '$250K+' },
  { id: '1m', label: '$1M+' },
];

function Chips({ opts, current, group, onPick }) {
  return opts.map((o) => (
    <button key={o.id} onClick={() => onPick(group, o.id)} style={chipStyle(current === o.id)}>{o.label}</button>
  ));
}

function SectorCard({ s }) {
  const c = s.up ? COLOR.green : COLOR.red;
  return (
    <div style={{ padding: '13px 13px 11px', borderRadius: 16, ...glass('soft', { borderRadius: 16 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', color: 'rgba(243,241,248,0.6)' }}>{s.name}</span>
        <Triangle size={9} style={{ color: c, transform: `rotate(${s.up ? 0 : 180}deg)` }} />
      </div>
      <div style={{ fontFamily: FONT.black, fontSize: 16, marginTop: 7, color: c }}>{s.up ? '+' : '-'}{s.val}</div>
      <div style={{ height: 3, borderRadius: 2, marginTop: 8, background: s.up ? 'linear-gradient(90deg,#2EE5A6,rgba(46,229,166,0.2))' : 'linear-gradient(90deg,#FF6B5B,rgba(255,107,91,0.2))' }} />
    </div>
  );
}

function HotCard({ h, onClick }) {
  const c = h.up ? COLOR.green : COLOR.red;
  return (
    <div onClick={onClick} style={{ flex: 'none', width: 128, padding: 14, borderRadius: 18, cursor: 'pointer', ...glass('mid', { borderRadius: 18 }) }}>
      <div style={{ fontFamily: FONT.black, fontSize: 19, letterSpacing: '-0.5px' }}>{h.ticker}</div>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 16, marginTop: 6, color: c }}>{h.val}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
        <Triangle size={8} style={{ color: c, transform: `rotate(${h.up ? 0 : 180}deg)` }} />
        <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.5px', color: 'rgba(243,241,248,0.5)' }}>{h.meta}</span>
      </div>
    </div>
  );
}

function TradeCard({ t, onSelectPolitician }) {
  const tag = sideTag(t.isBuy);
  return (
    <div style={{ borderRadius: 24, overflow: 'hidden', ...glass('card', { borderRadius: 24, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.24),0 14px 32px rgba(0,0,0,0.45)' }) }}>
      {t.large && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'linear-gradient(90deg,rgba(120,82,255,0.3),rgba(255,47,160,0.18))', borderBottom: '1px solid rgba(255,255,255,0.1)', fontFamily: FONT.black, fontSize: 11, letterSpacing: '1.5px', color: '#C9B8FF' }}>
          <span style={{ fontSize: 12 }}>◆</span> LARGE TRADE
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <span style={{ fontFamily: FONT.black, fontSize: 26, letterSpacing: '-0.5px' }}>{t.ticker}</span>
            <span style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 13, color: 'rgba(243,241,248,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.company}</span>
          </div>
          <div onClick={() => onSelectPolitician && onSelectPolitician(t.pol)} style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11, cursor: onSelectPolitician ? 'pointer' : 'default' }}>
            <div style={{ ...avatarStyle(t.from, t.to, 26), boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)' }}>
              <span style={{ fontFamily: FONT.black, fontSize: 9, color: '#fff' }}>{t.initials}</span>
            </div>
            <div>
              <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 13 }}>{t.pol}</div>
              <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.5px', color: 'rgba(243,241,248,0.45)' }}>{t.polSub}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.5px', color: 'rgba(243,241,248,0.4)', marginTop: 11 }}>
            <ClockIcon opacity={0.4} />
            {t.disclosed}
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.5px', color: 'rgba(243,241,248,0.35)', marginTop: 5 }}>{t.traded}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flex: 'none' }}>
          <div style={tag.style}><Triangle size={8} style={tag.arrow} />{t.side}</div>
          <div style={{ fontFamily: FONT.black, fontSize: 14, color: COLOR.pink, textAlign: 'right' }}>{t.amt}</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 13, color: t.retPositive === false ? COLOR.red : COLOR.green }}>{t.ret}</div>
        </div>
      </div>
    </div>
  );
}

export default function Feed({ sectors, hotItems, feedTrades, ticker, setTicker, period, ftype, fsize, onPick, onSelectPolitician }) {
  return (
    <div className="fade-in">
      <div style={{ fontFamily: FONT.mono, fontSize: 12, letterSpacing: '2px', color: 'rgba(243,241,248,0.5)', marginTop: 20 }}>SECTOR INTEL · 90D</div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {sectors.map((s) => <SectorCard key={s.name} s={s} />)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.black, fontSize: 14, letterSpacing: '1px', color: COLOR.pink }}>
          <Bolt width={14} height={17} gradId="hotblt" from="#FF6FC4" to="#FF6FC4" />
          HOT THIS MONTH
        </div>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', color: 'rgba(243,241,248,0.4)' }}>tap to filter</span>
      </div>
      <div className="hscroll" style={{ marginTop: 12, display: 'flex', gap: 10, paddingBottom: 4 }}>
        {hotItems.map((h) => <HotCard key={h.ticker} h={h} onClick={() => setTicker(h.ticker)} />)}
      </div>

      {/* ticker filter */}
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18, ...glass('soft', { borderRadius: 18 }) }}>
        <SearchIcon size={16} opacity={0.45} />
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Filter by ticker… (NVDA, TSLA, AAPL)"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 14, color: '#F3F1F8' }}
        />
      </div>

      <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '2px', color: 'rgba(243,241,248,0.5)', marginTop: 18 }}>PERIOD</div>
      <div className="hscroll" style={{ display: 'flex', gap: 8, marginTop: 10, paddingBottom: 4 }}>
        <Chips opts={PERIOD_OPTS} current={period} group="period" onPick={onPick} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', color: 'rgba(243,241,248,0.5)', width: 38, flex: 'none' }}>TYPE</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chips opts={TYPE_OPTS} current={ftype} group="ftype" onPick={onPick} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', color: 'rgba(243,241,248,0.5)', width: 38, flex: 'none' }}>SIZE</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chips opts={SIZE_OPTS} current={fsize} group="fsize" onPick={onPick} />
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 12, letterSpacing: '2px' }}>
        <span style={{ color: 'rgba(243,241,248,0.7)' }}>{feedTrades.length} TRADES · LIVE</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLOR.green }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLOR.green, boxShadow: `0 0 8px ${COLOR.green}` }} />STREAMING
        </span>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {feedTrades.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', fontFamily: FONT.mono, fontSize: 12, color: 'rgba(243,241,248,0.4)' }}>No trades match these filters.</div>
        )}
        {feedTrades.map((t) => <TradeCard key={t.id} t={t} onSelectPolitician={onSelectPolitician} />)}
      </div>
    </div>
  );
}
