import { FONT, COLOR, glass, tabStyle, navStyle, navBarStyle } from '../ui/styles';
import { BarsIcon, FeedIcon, ProfileIcon, CopyIcon, Bolt, RefreshIcon } from '../ui/icons';
import { fmtPct } from '../api';

export function Blooms() {
  // Glow blooms span the full scrollable height so the liquid-glass feel
  // persists as the user scrolls — purple-weighted, with a glow anchored near
  // the bottom so the floating nav reads as backlit glass.
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* upper region */}
      <div style={{ position: 'absolute', top: -120, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,47,160,0.42), transparent 68%)', filter: 'blur(20px)', animation: 'bloom 14s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: 300, right: -120, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,82,255,0.34), transparent 68%)', filter: 'blur(20px)', animation: 'bloom 18s ease-in-out infinite reverse' }} />
      {/* mid region */}
      <div style={{ position: 'absolute', top: 720, left: -110, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,82,255,0.30), transparent 68%)', filter: 'blur(22px)', animation: 'bloom 20s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: 1120, right: -130, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,47,160,0.26), transparent 68%)', filter: 'blur(22px)', animation: 'bloom 24s ease-in-out infinite reverse' }} />
      {/* lower region (kept near bottom regardless of page length) */}
      <div style={{ position: 'absolute', bottom: 360, left: -90, width: 330, height: 330, borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,229,166,0.16), transparent 70%)', filter: 'blur(24px)', animation: 'bloom 22s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: 30, right: -100, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,82,255,0.36), transparent 66%)', filter: 'blur(22px)', animation: 'bloom 16s ease-in-out infinite reverse' }} />
      <div style={{ position: 'absolute', bottom: -80, left: '20%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,140,255,0.30), transparent 70%)', filter: 'blur(26px)', animation: 'bloom 19s ease-in-out infinite' }} />
    </div>
  );
}

export function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  return (
    <div style={{ position: 'relative', zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px 6px', fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15, letterSpacing: '0.2px' }}>
      <span>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#F3F1F8" /><rect x="5" y="4.5" width="3" height="7.5" rx="1" fill="#F3F1F8" /><rect x="10" y="2" width="3" height="10" rx="1" fill="#F3F1F8" /><rect x="15" y="0" width="3" height="12" rx="1" fill="rgba(243,241,248,0.4)" /></svg>
        <svg width="22" height="12" viewBox="0 0 22 12" fill="none"><rect x="1" y="1" width="18" height="10" rx="3" stroke="rgba(243,241,248,0.5)" strokeWidth="1.2" /><rect x="2.5" y="2.5" width="13" height="7" rx="1.5" fill="#F3F1F8" /><rect x="20" y="4" width="1.6" height="4" rx="0.8" fill="rgba(243,241,248,0.6)" /></svg>
      </div>
    </div>
  );
}

export function Header({ polCount, tradeCount, source, updatedLabel, user, onSignOut }) {
  const userInitials = (user?.name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bolt width={32} height={40} style={{ flex: 'none', filter: 'drop-shadow(0 4px 12px rgba(255,47,160,0.55))' }} />
        <h1 style={{ margin: 0, fontFamily: FONT.black, fontWeight: 900, fontSize: 52, lineHeight: 0.84, letterSpacing: '-3px', textTransform: 'none', whiteSpace: 'nowrap', WebkitTextStroke: '0.6px rgba(255,255,255,0.18)', background: 'linear-gradient(100deg,#FFFFFF 26%,#FF8FCE 60%,#B98CFF 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 3px 14px rgba(255,47,160,0.4))' }}>Slipstream</h1>
        {user && (
          <button onClick={onSignOut} title={`Signed in as ${user.name} — tap to sign out`} style={{ marginLeft: 'auto', width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', flex: 'none', background: 'linear-gradient(145deg,#FF6FC4,#7852FF)', color: '#fff', fontFamily: FONT.black, fontSize: 13, letterSpacing: '-0.5px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.45),inset 0 -3px 6px rgba(0,0,0,0.35),0 6px 16px rgba(0,0,0,0.4)' }}>
            {userInitials || '·'}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 14 }}>
        <div>
          <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '5px', color: 'rgba(243,241,248,0.42)', paddingLeft: 2 }}>CATCH THE CURRENT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT.mono, fontSize: 11, color: 'rgba(243,241,248,0.42)', marginTop: 10, paddingLeft: 2 }}>
            <RefreshIcon />
            {updatedLabel}
            {source === 'sample' && <span style={{ color: COLOR.pink }}>· demo data</span>}
          </div>
        </div>
        <div className="lg" style={{ display: 'flex', alignItems: 'stretch', flex: 'none', ...glass('strong', { borderRadius: 18, overflow: 'hidden' }) }}>
          <div style={{ textAlign: 'center', padding: '9px 15px' }}>
            <div style={{ fontFamily: FONT.black, fontSize: 21, lineHeight: 1 }}>{polCount}</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '2px', color: 'rgba(243,241,248,0.5)', marginTop: 3 }}>POL</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ textAlign: 'center', padding: '9px 15px' }}>
            <div style={{ fontFamily: FONT.black, fontSize: 21, lineHeight: 1, color: COLOR.pink }}>{tradeCount}</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '2px', color: 'rgba(243,241,248,0.5)', marginTop: 3 }}>TRADES</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Ticker({ polCount, leaderName, leaderRoi, winRate }) {
  const roiStr = fmtPct(leaderRoi);
  const winStr = winRate == null ? '—' : `${Math.round(winRate * 100)}% WIN RATE`;
  const content = (
    <span style={{ padding: '0 14px' }}>
      {polCount} POLITICIANS TRACKED&nbsp;&nbsp;◆&nbsp;&nbsp;LEADER: {(leaderName || '').toUpperCase()}{' '}
      <span style={{ color: COLOR.green }}>{roiStr} ROI</span>&nbsp;&nbsp;◆&nbsp;&nbsp;
      <span style={{ color: COLOR.pink }}>{winStr}</span>&nbsp;&nbsp;◆&nbsp;&nbsp;
    </span>
  );
  return (
    <div style={{ marginTop: 18, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(160deg,rgba(255,47,160,0.16),rgba(255,47,160,0.05))', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(255,47,160,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}>
      <div style={{ display: 'flex', whiteSpace: 'nowrap', padding: '11px 0', fontFamily: FONT.mono, fontSize: 12, letterSpacing: '2px', color: 'rgba(243,241,248,0.66)', animation: 'ticker 26s linear infinite', willChange: 'transform' }}>
        {content}
        {content}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'leaders', label: 'Leaders', Icon: BarsIcon },
  { id: 'feed', label: 'Feed', Icon: FeedIcon },
  { id: 'profile', label: 'Profile', Icon: ProfileIcon },
  { id: 'copy', label: 'Copy', Icon: CopyIcon },
];

export function TabNav({ tab, setTab }) {
  return (
    <div style={{ marginTop: 18, display: 'flex', gap: 6, padding: 6, borderRadius: 22, ...glass('mid', { borderRadius: 22 }) }}>
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => setTab(id)} style={tabStyle(tab === id)}>
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export function PartySentiment({ dem, rep }) {
  return (
    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 20, ...glass('soft', { borderRadius: 20 }) }}>
      <div style={{ textAlign: 'center', flex: 'none' }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', color: COLOR.dem }}>DEM</div>
        <div style={{ fontFamily: FONT.black, fontSize: 17, color: (dem ?? 0) >= 0 ? COLOR.green : COLOR.red, lineHeight: 1.1 }}>{fmtPct(dem)}</div>
      </div>
      <div style={{ flex: 1, height: 8, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }}>
        <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,#4F8DF5 0%,#7B6BE8 50%,#FF6B5B 100%)' }} />
      </div>
      <div style={{ textAlign: 'center', flex: 'none' }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', color: COLOR.rep }}>REP</div>
        <div style={{ fontFamily: FONT.black, fontSize: 17, color: (rep ?? 0) >= 0 ? COLOR.green : COLOR.red, lineHeight: 1.1 }}>{fmtPct(rep)}</div>
      </div>
    </div>
  );
}

export function BottomNav({ tab, setTab }) {
  return (
    <div className="lg" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 18, width: 394, maxWidth: 'calc(100% - 36px)', zIndex: 20, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '12px 8px', borderRadius: 30, background: 'linear-gradient(160deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))', backdropFilter: 'blur(40px) saturate(190%) brightness(1.1)', WebkitBackdropFilter: 'blur(40px) saturate(190%) brightness(1.1)', border: '1px solid rgba(255,255,255,0.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45),inset 0 -2px 4px rgba(0,0,0,0.25),0 18px 44px rgba(0,0,0,0.55)' }}>
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => setTab(id)} style={navStyle(tab === id)}>
          <div style={navBarStyle(tab === id)} />
          <Icon size={22} />
          <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '1.5px' }}>{label.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
