// Small presentational primitives shared across the redesigned screens.

import { FONT, COLOR, glass, label } from './styles';

// Filled area + line chart over an arbitrary series. Renders nothing when the
// series is too short to draw (e.g. a brand-new Alpaca account).
export function AreaChart({ values, height = 96, gradId = 'gfill', color = COLOR.gold }) {
  const pts = (values || []).filter((v) => typeof v === 'number' && !isNaN(v));
  if (pts.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11, color: COLOR.dim }}>
        Not enough history to chart yet
      </div>
    );
  }
  const W = 360;
  const H = height;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const x = (i) => 2 + (i / (pts.length - 1)) * (W - 4);
  const y = (v) => H - 14 - ((v - min) / span) * (H - 28);
  const line = pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' L');
  const area = `M${x(0).toFixed(1)},${H} L${line} L${x(pts.length - 1).toFixed(1)},${H} Z`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', marginTop: 14 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={`M${line}`} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1])} r="4" fill={COLOR.goldLight} />
    </svg>
  );
}

export function StatTile({ title, value, color = COLOR.text }) {
  return (
    <div style={{ flex: 1, padding: 14, borderRadius: 16, ...glass('mid', { borderRadius: 16 }) }}>
      <div style={label()}>{title}</div>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 17, marginTop: 4, color }}>{value}</div>
    </div>
  );
}

export function Note({ children, dashed = false }) {
  return (
    <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 16, background: '#0A0A0A', border: dashed ? '1px dashed rgba(255,255,255,0.14)' : `1px solid ${COLOR.hairline}`, fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12, color: COLOR.dim, lineHeight: 1.55 }}>
      {children}
    </div>
  );
}

export function SectionHeading({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
      <span style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 16, letterSpacing: '-0.2px' }}>{children}</span>
      {right}
    </div>
  );
}

export function EmptyRow({ children }) {
  return (
    <div style={{ marginTop: 12, padding: 22, borderRadius: 18, border: '1.5px dashed rgba(255,255,255,0.14)', fontFamily: FONT.archivo, fontWeight: 500, fontSize: 13.5, lineHeight: 1.6, color: COLOR.dim }}>
      {children}
    </div>
  );
}
