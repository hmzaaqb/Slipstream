import { FONT, COLOR, glass, sideTag, avatarStyle } from '../ui/styles';
import { BackIcon, StarIcon, ShareIcon, Triangle } from '../ui/icons';
import { fmtMoneyShort } from '../api';

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

// Catmull-Rom → cubic bezier, for a smooth curve through real data points.
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// Estimated-profit-over-time curve. Every point is real: weekly mark-to-market
// of the politician's disclosed buys, computed from actual daily closes at
// snapshot build time. Y axis = dollars made; no X labels by design.
function PnlChart({ series }) {
  if (!series || series.length < 2) return null;
  const W = 330;
  const H = 150;
  const L = 46; // left gutter for $ labels
  const PAD = 8;

  const lo = Math.min(0, ...series);
  const hi = Math.max(0, ...series);
  const span = hi - lo || 1;
  const x = (i) => L + (i / (series.length - 1)) * (W - L - PAD);
  const y = (v) => PAD + (1 - (v - lo) / span) * (H - PAD * 2);
  const pts = series.map((v, i) => [+x(i).toFixed(1), +y(v).toFixed(1)]);
  const line = smoothPath(pts);
  const area = `${line} L${pts.at(-1)[0]},${H - PAD} L${pts[0][0]},${H - PAD} Z`;

  // 4 evenly spaced ticks across the real dollar range
  const ticks = [0, 1, 2, 3].map((i) => lo + (span * i) / 3);
  const last = series.at(-1);
  const up = last >= 0;

  return (
    <div style={{ marginTop: 14, padding: 18, borderRadius: 24, ...glass('soft', { borderRadius: 24 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '1.5px', color: 'rgba(247,247,245,0.55)' }}>
          EST. PROFIT OVER TIME
        </span>
        <span style={{ fontFamily: FONT.black, fontSize: 13, color: up ? COLOR.green : COLOR.red }}>
          {(up ? '+' : '−') + fmtMoneyShort(Math.abs(last))}
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 12, display: 'block' }}>
        <defs>
          <linearGradient id="pnlStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#35C99B" />
            <stop offset="1" stopColor="#3EE6C6" />
          </linearGradient>
          <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2BB98D" stopOpacity="0.4" />
            <stop offset="1" stopColor="#123B2E" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} y1={y(t)} x2={W - PAD} y2={y(t)} stroke="rgba(247,247,245,0.07)" strokeWidth="1" />
            <text x={L - 7} y={y(t) + 3} textAnchor="end" fontSize="9" fontWeight="700" fill="rgba(247,247,245,0.45)" fontFamily="Archivo, sans-serif">
              {fmtMoneyShort(t)}
            </text>
          </g>
        ))}
        {lo < 0 && <line x1={L} y1={y(0)} x2={W - PAD} y2={y(0)} stroke="rgba(247,247,245,0.28)" strokeWidth="1" strokeDasharray="4 4" />}
        <path d={area} fill="url(#pnlFill)" />
        <path d={line} fill="none" stroke="url(#pnlStroke)" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="4.5" fill="#3EE6C6" />
        <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="9" fill="#3EE6C6" opacity="0.2" />
      </svg>
      <div style={{ marginTop: 8, fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.5px', color: 'rgba(247,247,245,0.35)' }}>
        Weekly mark-to-market of disclosed trades (bracket midpoints) · sells lock in gains/losses at the sale date
      </div>
    </div>
  );
}

// Per-position mark-to-market return bars. Every bar is real math: first
// disclosed buy's entry close vs the latest close. Replaces the old hardcoded
// (fake) portfolio curve.
function RoiBars({ bars }) {
  if (!bars || !bars.length) return null;
  const W = 320;
  const H = 120;
  const PAD = 6;
  const maxAbs = Math.max(0.02, ...bars.map((b) => Math.abs(b.ret)));
  const bw = (W - PAD * 2) / bars.length;
  const zero = H / 2;
  const scale = (H / 2 - 16) / maxAbs;

  return (
    <div style={{ marginTop: 14, padding: 18, borderRadius: 24, ...glass('soft', { borderRadius: 24 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '1.5px', color: 'rgba(247,247,245,0.55)' }}>
          RETURN BY POSITION
        </span>
        <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.5px', color: 'rgba(247,247,245,0.35)' }}>
          SINCE FIRST DISCLOSED BUY
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 26}`} style={{ marginTop: 12, display: 'block' }}>
        <line x1={PAD} y1={zero} x2={W - PAD} y2={zero} stroke="rgba(247,247,245,0.25)" strokeWidth="1" strokeDasharray="4 4" />
        {bars.map((b, i) => {
          const up = b.ret >= 0;
          const h = Math.max(2, Math.abs(b.ret) * scale);
          const x = PAD + i * bw + bw * 0.18;
          const y = up ? zero - h : zero;
          const c = up ? COLOR.green : COLOR.red;
          const pct = `${b.ret >= 0 ? '+' : ''}${(b.ret * 100).toFixed(0)}%`;
          return (
            <g key={b.ticker}>
              <rect x={x} y={y} width={bw * 0.64} height={h} rx={3} fill={c} opacity="0.85" />
              <text x={x + bw * 0.32} y={up ? y - 5 : y + h + 11} textAnchor="middle" fontSize="9" fontWeight="700" fill={c} fontFamily="Archivo, sans-serif">
                {pct}
              </text>
              <text x={x + bw * 0.32} y={H + 18} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="rgba(247,247,245,0.45)" fontFamily="Archivo, sans-serif">
                {b.ticker}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ marginTop: 8, fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.5px', color: 'rgba(247,247,245,0.35)' }}>
        Entry = close on first disclosed buy date · marked to latest close
      </div>
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

      {profile.pnlSeries ? <PnlChart series={profile.pnlSeries} /> : <RoiBars bars={profile.roiBars} />}

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

