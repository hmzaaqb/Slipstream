import { FONT, COLOR, glass, sideTag, avatarStyle } from '../ui/styles';
import { BackIcon, StarIcon, ShareIcon, Triangle } from '../ui/icons';

const PARTY_GRAD = {
  D: 'linear-gradient(145deg,#5B9CFF,#2C5FE0)',
  R: 'linear-gradient(145deg,#FF7A59,#E5432C)',
  I: 'linear-gradient(145deg,#7B6BE8,#4F3BCB)',
  '?': 'linear-gradient(145deg,#9aa0ad,#5b606b)',
};

function StatTile({ s, onClick }) {
  return (
    <div onClick={onClick} style={{ flex: 1, textAlign: 'center', padding: '13px 4px', borderRadius: 16, cursor: onClick ? 'pointer' : 'default', ...glass('soft', { borderRadius: 16 }) }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '1px', color: 'rgba(247,247,245,0.45)' }}>{s.label}</div>
      <div style={{ fontFamily: FONT.black, fontSize: 17, marginTop: 6, color: s.valColor }}>{s.value}</div>
      <div style={{ fontFamily: FONT.mono, fontSize: 7, letterSpacing: '0.5px', color: 'rgba(247,247,245,0.35)', marginTop: 4, height: 9 }}>{s.sub}</div>
    </div>
  );
}

function Holding({ h }) {
  const col = h.up === null || h.up === undefined ? 'rgba(247,247,245,0.35)' : h.up ? COLOR.green : COLOR.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(247,247,245,0.35)', width: 18, flex: 'none' }}>{h.rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT.black, fontSize: 15 }}>{h.ticker}</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11, color: 'rgba(247,247,245,0.45)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company}</div>
      </div>
      <span style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 13, color: COLOR.goldSoft }}>{h.val}</span>
      <span style={{ fontFamily: FONT.black, fontSize: 13, width: 54, textAlign: 'right', flex: 'none', color: col }}>{h.ret}</span>
    </div>
  );
}

function RecentRow({ t }) {
  const tag = sideTag(t.isBuy);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={tag.style}><Triangle size={8} style={tag.arrow} />{t.side}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT.black, fontSize: 14 }}>{t.ticker}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(247,247,245,0.4)', marginTop: 2 }}>
          {t.date}
          {t.link && (
            <a href={t.link} target="_blank" rel="noreferrer" style={{ marginLeft: 7, color: COLOR.goldSoft, textDecoration: 'none' }}>
              filing ↗
            </a>
          )}
        </div>
      </div>
      <span style={{ fontFamily: FONT.black, fontSize: 14, color: COLOR.goldSoft }}>{t.amt}</span>
    </div>
  );
}

export default function Profile({ profile, onBack, onToggleMetric, isFollowed, onToggleFollow, onShare }) {
  if (!profile) {
    return (
      <div className="fade-in" style={{ marginTop: 40, textAlign: 'center', fontFamily: FONT.mono, fontSize: 13, letterSpacing: '1px', color: 'rgba(247,247,245,0.5)' }}>
        Pick a politician from the Politicians tab to view their profile.
      </div>
    );
  }
  const partyLetter = profile.party === '?' ? '·' : profile.party;
  const grad = PARTY_GRAD[profile.party] || PARTY_GRAD['?'];
  const subtitle = `${profile.chamber === 'senate' ? 'Senate' : 'House'}${profile.state ? ' · ' + profile.state : ''}`;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 18 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(247,247,245,0.55)', fontFamily: FONT.mono, fontSize: 11, letterSpacing: '2px', padding: 0 }}>
          <BackIcon />
          BACK TO POLITICIANS
        </button>
        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={onToggleFollow} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', cursor: 'pointer', borderRadius: 13, background: 'linear-gradient(160deg,rgba(212,175,55,0.14),rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.5)', color: '#E8CA72', fontFamily: FONT.black, fontSize: 11, letterSpacing: '1px' }}>
            <StarIcon filled={isFollowed} />
            {isFollowed ? 'FOLLOWING' : 'FOLLOW'}
          </button>
          <button onClick={onShare} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', cursor: 'pointer', borderRadius: 13, background: 'linear-gradient(160deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.15)', color: '#F7F7F5', fontFamily: FONT.black, fontSize: 11, letterSpacing: '1px' }}>
            <ShareIcon />
            SHARE
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
        <div style={avatarStyle(profile.from, profile.to, 64)}>
          <span style={{ fontFamily: FONT.black, fontSize: 20, color: '#fff' }}>{profile.initials}</span>
          <div style={{ position: 'absolute', top: 8, left: 12, width: 18, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', filter: 'blur(2px)' }} />
        </div>
        <div>
          <div style={{ fontFamily: FONT.black, fontSize: 30, lineHeight: 1, letterSpacing: '-1px' }}>{profile.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
            <span style={{ width: 20, height: 20, borderRadius: 7, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.black, fontSize: 11, color: '#fff' }}>{partyLetter}</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 12, letterSpacing: '1px', color: 'rgba(247,247,245,0.6)' }}>{subtitle}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
        {profile.stats.map((s) => (
          <StatTile key={s.label} s={s} onClick={s.label === 'ROI' || s.label === 'VS S&P' ? onToggleMetric : undefined} />
        ))}
      </div>

      <div style={{ marginTop: 14, padding: '20px 22px', borderRadius: 24, background: 'linear-gradient(150deg,rgba(212,175,55,0.16),rgba(212,175,55,0.1) 60%,rgba(255,255,255,0.03))', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)', border: '1px solid rgba(212,175,55,0.3)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28),0 14px 34px rgba(0,0,0,0.45)' }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '2px', color: 'rgba(247,247,245,0.6)' }}>EST. DISCLOSED VOLUME</div>
        <div style={{ fontFamily: FONT.black, fontSize: 46, lineHeight: 1, letterSpacing: '-2px', marginTop: 10, background: 'linear-gradient(100deg,#FFFFFF,#E8CA72)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{profile.volume}</div>
        {/* Filings report amounts as ranges (e.g. $1,001–$15,000). This figure
            sums bracket midpoints, so it is an estimate — say so. */}
        <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.5px', color: 'rgba(247,247,245,0.45)', marginTop: 8 }}>
          Filings disclose ranges, not exact amounts — this sums bracket midpoints
        </div>
      </div>

      {/* A "PORTFOLIO ACTIVITY · ALL TIME" chart used to render here. Its path
          was a hardcoded SVG string — byte-identical for every politician, with
          a fake S&P dashed line — so it was removed. A real equity curve needs
          a per-trade price series; see Phase 1 of the plan. */}

      <div style={{ marginTop: 14, padding: '6px 0', borderRadius: 24, ...glass('soft', { borderRadius: 24 }) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px' }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '2px', color: 'rgba(247,247,245,0.55)' }}>TOP HOLDINGS</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '2px', color: 'rgba(247,247,245,0.4)' }}>RETURN</span>
        </div>
        {profile.holdings.map((h) => <Holding key={h.ticker} h={h} />)}
      </div>

      <div style={{ marginTop: 14, padding: '6px 0', borderRadius: 24, ...glass('soft', { borderRadius: 24 }) }}>
        <div style={{ padding: '14px 20px 12px', fontFamily: FONT.mono, fontSize: 11, letterSpacing: '2px', color: 'rgba(247,247,245,0.55)' }}>RECENT TRADES</div>
        {profile.recent.map((t, i) => <RecentRow key={i} t={t} />)}
      </div>
    </div>
  );
}

