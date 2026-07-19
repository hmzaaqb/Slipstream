import { FONT, COLOR, glass, navStyle, navBarStyle } from '../ui/styles';
import { HomeIcon, CapitolIcon, SwapIcon, WalletIcon, UserIcon, BellIcon, RefreshIcon } from '../ui/icons';
import { fmtPct } from '../api';

// Ambient gold corner light from the design comp — two soft radial washes,
// fixed to the frame rather than animated.
export function Blooms() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: -160, right: -140, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.13), transparent 66%)' }} />
      <div style={{ position: 'absolute', bottom: -180, left: -160, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.06), transparent 66%)' }} />
    </div>
  );
}

export function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  return (
    <div style={{ position: 'relative', zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px 6px', fontFamily: FONT.archivo, fontWeight: 700, fontSize: 15, letterSpacing: '0.2px' }}>
      <span>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill={COLOR.text} /><rect x="5" y="4.5" width="3" height="7.5" rx="1" fill={COLOR.text} /><rect x="10" y="2" width="3" height="10" rx="1" fill={COLOR.text} /><rect x="15" y="0" width="3" height="12" rx="1" fill="rgba(247,247,245,0.35)" /></svg>
        <svg width="22" height="12" viewBox="0 0 22 12" fill="none"><rect x="1" y="1" width="18" height="10" rx="3" stroke="rgba(247,247,245,0.45)" strokeWidth="1.2" /><rect x="2.5" y="2.5" width="13" height="7" rx="1.5" fill={COLOR.text} /><rect x="20" y="4" width="1.6" height="4" rx="0.8" fill="rgba(247,247,245,0.5)" /></svg>
      </div>
    </div>
  );
}

// Alpaca is paper-only in this build, so the environment badge is a constant.
// If live trading is ever enabled this becomes a real prop.
export function EnvBadge({ env = 'PAPER' }) {
  const live = env === 'LIVE';
  return (
    <div style={{ padding: '6px 11px', borderRadius: 9, fontFamily: FONT.archivo, fontWeight: 800, fontSize: 10, letterSpacing: '1px', background: live ? 'rgba(240,100,110,0.10)' : 'rgba(212,175,55,0.10)', border: `1px solid ${live ? 'rgba(240,100,110,0.45)' : COLOR.goldEdgeStrong}`, color: live ? COLOR.red : COLOR.goldSoft }}>
      {env}
    </div>
  );
}

// Round icon button used in screen headers.
export function IconButton({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 15, background: COLOR.surfaceAlt, border: `1px solid ${COLOR.hairline}`, color: COLOR.muted }}>
      {children}
    </button>
  );
}

export function GreetingHeader({ name, onBell }) {
  const first = (name || 'there').split(/\s+/)[0];
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: COLOR.muted }}>{part}</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px', marginTop: 2 }}>{first}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <EnvBadge />
        <IconButton onClick={onBell} title="Notifications"><BellIcon /></IconButton>
      </div>
    </div>
  );
}

export function ScreenTitle({ title, sub, right }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}>{title}</div>
        {right}
      </div>
      {sub && <div style={{ fontSize: 13, fontWeight: 500, color: COLOR.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// Shown on every screen whenever the numbers on display are not real filings.
// This is deliberately loud: the app renders dollar-denominated returns next to
// Follow and order buttons, so a small caption is not adequate disclosure.
// Gated on `source`, so it also catches the live-mode fallback to sample data —
// an outage must never look like a working app.
export function DemoBanner({ source }) {
  if (source !== 'sample') return null;
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        margin: '0 0 12px',
        padding: '10px 13px',
        borderRadius: 13,
        background: 'rgba(212,175,55,0.12)',
        border: `1px solid ${COLOR.goldEdgeStrong}`,
      }}
    >
      <span style={{ flex: 'none', fontSize: 13, lineHeight: 1 }}>⚠️</span>
      <span style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 11.5, lineHeight: 1.35, color: COLOR.goldSoft }}>
        Simulated data — these are not real disclosures. Every figure shown,
        including returns, is generated for demonstration. Do not trade on it.
      </span>
    </div>
  );
}

// Data provenance strip — keeps "where did this come from" visible without a
// full header block.
export function SourceLine({ source, updatedLabel, coverage, onRefresh }) {
  return (
    <div
      onClick={onRefresh}
      role={onRefresh ? 'button' : undefined}
      title={onRefresh ? 'Refresh data' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11, color: COLOR.dim, marginTop: 10, cursor: onRefresh ? 'pointer' : 'default' }}
    >
      <RefreshIcon />
      {updatedLabel}
      {onRefresh && <span style={{ color: COLOR.goldSoft }}>· tap to refresh</span>}
      {source === 'sample' && <span style={{ color: COLOR.goldSoft }}>· demo data</span>}
      {source === 'snapshot' && (
        <span style={{ color: COLOR.green }}>· real {coverage || 'House'} filings</span>
      )}
      {source === 'live' && <span style={{ color: COLOR.green }}>· live</span>}
    </div>
  );
}

// Was "PartySentiment" with a full-width gradient bar. Two problems: it is not
// sentiment (it's a volume-weighted mean of estimated return), and the bar was
// decorative — fixed at 100% width with a fixed gradient, so it encoded nothing
// while looking like a proportion. Renamed, bar dropped, basis stated.
export function PartyReturn({ dem, rep }) {
  const side = (tag, val, tint) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 10, letterSpacing: '1px', color: tint }}>{tag}</div>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 17, color: val == null ? COLOR.dim : val >= 0 ? COLOR.green : COLOR.red, lineHeight: 1.1, marginTop: 2 }}>
        {fmtPct(val)}
      </div>
    </div>
  );
  return (
    <div style={{ marginTop: 16, padding: '13px 16px', borderRadius: 18, ...glass('mid', { borderRadius: 18 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {side('DEM', dem, COLOR.dem)}
        <div style={{ width: 1, alignSelf: 'stretch', background: COLOR.hairline }} />
        {side('REP', rep, COLOR.rep)}
      </div>
      <div style={{ marginTop: 9, textAlign: 'center', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 10.5, color: COLOR.dim }}>
        Mean estimated return, weighted by disclosed volume
      </div>
    </div>
  );
}

const TABS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'leaders', label: 'Politicians', Icon: CapitolIcon },
  { id: 'copy', label: 'Copy', Icon: SwapIcon },
  { id: 'portfolio', label: 'Portfolio', Icon: WalletIcon },
  { id: 'account', label: 'Profile', Icon: UserIcon },
];

export function BottomNav({ tab, setTab }) {
  return (
    <>
      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: 430, maxWidth: '100%', zIndex: 20, padding: '10px 6px 24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderTop: `1px solid ${COLOR.hairline}` }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={navStyle(tab === id)}>
            <div style={navBarStyle(tab === id)} />
            <Icon size={21} />
            <span style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 10, letterSpacing: '0.3px' }}>{label}</span>
          </button>
        ))}
      </div>
      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 7, width: 120, height: 5, borderRadius: 3, background: 'rgba(247,247,245,0.25)', zIndex: 21, pointerEvents: 'none' }} />
    </>
  );
}
