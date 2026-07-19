// Shared style primitives ported from the Slipstream design comp
// (see design/README.md). React inline styles (objects), so values the comp
// wrote as CSS strings are expressed here as camelCase props.
//
// The comp's language is matte black with a single gold accent: flat surfaces,
// hairline borders, no blur. Cards that matter (portfolio, active strategies,
// pending orders) get a gold-tinted edge instead of a brighter fill.

export const FONT = {
  archivo: "'Archivo', sans-serif",
  black: "'Archivo Black', sans-serif",
  mono: "'Space Mono', monospace",
};

export const COLOR = {
  bg: '#050505',
  surface: '#101010',
  surfaceAlt: '#111111',
  elevated: '#171717',

  text: '#F7F7F5',
  muted: '#B5B5B1',
  dim: '#747474',

  gold: '#D4AF37',
  goldLight: '#F2D675',
  goldSoft: '#E8CA72',

  green: '#42C989',
  red: '#F0646E',
  blue: '#6FA8FF',

  // Party tints, kept in the comp's restrained register.
  dem: '#7FA6E8',
  rep: '#E0968C',

  hairline: 'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.14)',
  goldEdge: 'rgba(212,175,55,0.28)',
  goldEdgeStrong: 'rgba(212,175,55,0.45)',
};

export const GOLD_GRADIENT = 'linear-gradient(135deg,#F2D675,#D4AF37)';

// Flat card surface. `tone` picks the emphasis:
//   soft   – recessed / dashed-note surfaces
//   mid    – default row + card
//   card   – hero card with the gradient wash
//   strong – gold-edged card (active strategy, pending order)
export function glass(tone = 'mid', extra = {}) {
  const tones = {
    soft: { background: '#0A0A0A', border: `1px solid ${COLOR.hairline}` },
    mid: { background: COLOR.surface, border: `1px solid ${COLOR.hairline}` },
    card: {
      background: 'linear-gradient(150deg,#171717,#0A0A0A 65%)',
      border: `1px solid ${COLOR.goldEdge}`,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    },
    strong: {
      background: 'linear-gradient(150deg,#171717,#0A0A0A)',
      border: `1px solid ${COLOR.goldEdgeStrong}`,
    },
  };
  return { ...(tones[tone] || tones.mid), ...extra };
}

export function tabStyle(active) {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    padding: '11px 4px',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 14,
    fontFamily: FONT.archivo,
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: '0.4px',
    transition: 'all .2s',
    ...(active
      ? { background: 'rgba(212,175,55,0.12)', color: COLOR.goldSoft }
      : { background: 'transparent', color: COLOR.dim }),
  };
}

export function navStyle(active) {
  return {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '8px 2px 4px',
    minHeight: 48,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'color .2s',
    color: active ? COLOR.gold : COLOR.dim,
  };
}

export function navBarStyle(active) {
  return {
    position: 'absolute',
    top: -11,
    width: 22,
    height: 3,
    borderRadius: 2,
    background: GOLD_GRADIENT,
    transition: 'opacity .2s',
    opacity: active ? 1 : 0,
  };
}

// Segmented control inside the portfolio hero (1D / 1W / 1M / …).
export function metricStyle(active) {
  return {
    flex: 1,
    cursor: 'pointer',
    padding: '8px 0',
    borderRadius: 9,
    fontFamily: FONT.archivo,
    fontWeight: 700,
    fontSize: 11,
    transition: 'all .2s',
    background: active ? 'rgba(212,175,55,0.14)' : 'transparent',
    color: active ? COLOR.goldSoft : COLOR.dim,
    border: `1px solid ${active ? 'rgba(212,175,55,0.4)' : 'transparent'}`,
  };
}

export function chipStyle(active) {
  return {
    flex: 'none',
    cursor: 'pointer',
    padding: '10px 15px',
    borderRadius: 12,
    fontFamily: FONT.archivo,
    fontWeight: 700,
    fontSize: 12,
    whiteSpace: 'nowrap',
    transition: 'all .2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    ...(active
      ? {
          background: 'rgba(212,175,55,0.10)',
          border: `1px solid ${COLOR.goldEdgeStrong}`,
          color: COLOR.goldSoft,
        }
      : {
          background: COLOR.surface,
          border: '1px solid rgba(255,255,255,0.10)',
          color: COLOR.muted,
        }),
  };
}

// Primary gold action button.
export function goldButton(extra = {}) {
  return {
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 16,
    background: GOLD_GRADIENT,
    color: '#090909',
    fontFamily: FONT.archivo,
    fontWeight: 800,
    fontSize: 15,
    ...extra,
  };
}

// Uppercase micro-label above a value.
export function label(extra = {}) {
  return {
    fontFamily: FONT.archivo,
    fontWeight: 600,
    fontSize: 10.5,
    letterSpacing: '0.8px',
    color: COLOR.dim,
    ...extra,
  };
}

export function sideTag(isBuy) {
  return {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 9px',
      borderRadius: 8,
      fontFamily: FONT.archivo,
      fontWeight: 800,
      fontSize: 10,
      letterSpacing: '0.5px',
      ...(isBuy
        ? { background: 'rgba(66,201,137,0.10)', border: '1px solid rgba(66,201,137,0.4)', color: COLOR.green }
        : { background: 'rgba(240,100,110,0.10)', border: '1px solid rgba(240,100,110,0.4)', color: COLOR.red }),
    },
    arrow: { color: isBuy ? COLOR.green : COLOR.red, transform: `rotate(${isBuy ? 0 : 180}deg)` },
  };
}

// Avatar disc. The comp uses one flat dark disc with gold initials rather than
// per-person gradients, so `from`/`to` are accepted (callers still pass the
// palette from members.js) but only used to tint the ring subtly.
export function avatarStyle(from, to, size = 52, accent = false) {
  return {
    position: 'relative',
    width: size,
    height: size,
    flex: 'none',
    borderRadius: '50%',
    background: COLOR.elevated,
    border: `1px solid ${accent ? COLOR.goldEdgeStrong : COLOR.hairlineStrong}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLOR.goldSoft,
    fontFamily: FONT.archivo,
    fontWeight: 800,
    fontSize: Math.round(size * 0.3),
  };
}
