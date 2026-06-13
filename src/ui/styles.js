// Shared style primitives ported from the Slipstream design. React inline
// styles (objects), so values that the design wrote as CSS strings are
// expressed here as camelCase props. Keeping these centralized keeps the
// glassmorphism consistent across every surface.

export const FONT = {
  archivo: "'Archivo', sans-serif",
  black: "'Archivo Black', sans-serif",
  mono: "'Space Mono', monospace",
};

export const COLOR = {
  bg: '#06060b',
  text: '#F3F1F8',
  pink: '#FF6FC4',
  pinkHot: '#FF1E8E',
  green: '#2EE5A6',
  red: '#FF6B5B',
  blue: '#6FA8FF',
  purple: '#7852FF',
  dem: '#5B9CFF',
  rep: '#FF8C7E',
  muted: 'rgba(243,241,248,0.5)',
  dim: 'rgba(243,241,248,0.4)',
};

// Glass panel — tuned for the iOS "liquid glass" look: deep background blur with
// a saturation/brightness lift, a faint frosted gradient fill, a hairline edge,
// and layered shadows (a crisp top specular highlight + a soft bottom inner
// shade + an outer drop) that together read as a real pane of lit glass.
// `tone` picks the fill strength. Pair with the `.lg` class (index.css) on the
// element to add the bright rim-light along the top edge.
export function glass(tone = 'mid', extra = {}) {
  const grads = {
    soft: 'linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))',
    mid: 'linear-gradient(160deg,rgba(255,255,255,0.11),rgba(255,255,255,0.035))',
    card: 'linear-gradient(155deg,rgba(255,255,255,0.13),rgba(255,255,255,0.04))',
    strong: 'linear-gradient(160deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))',
  };
  return {
    background: grads[tone] || grads.mid,
    backdropFilter: 'blur(30px) saturate(185%) brightness(1.08)',
    WebkitBackdropFilter: 'blur(30px) saturate(185%) brightness(1.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 1px rgba(0,0,0,0.22),0 12px 30px rgba(0,0,0,0.42)',
    ...extra,
  };
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
    borderRadius: 16,
    fontFamily: FONT.black,
    fontSize: 11,
    letterSpacing: '0.5px',
    transition: 'all .25s',
    ...(active
      ? {
          background: 'linear-gradient(160deg,rgba(255,47,160,0.9),rgba(255,30,142,0.75))',
          color: '#fff',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45),0 6px 16px rgba(255,47,160,0.4)',
        }
      : { background: 'transparent', color: 'rgba(243,241,248,0.55)' }),
  };
}

export function navStyle(active) {
  return {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '4px 2px 2px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'color .25s',
    color: active ? '#FF4FB0' : 'rgba(243,241,248,0.5)',
  };
}

export function navBarStyle(active) {
  return {
    position: 'absolute',
    top: -9,
    width: 26,
    height: 4,
    borderRadius: 3,
    background: 'linear-gradient(90deg,#FF6FC4,#FF1E8E)',
    boxShadow: '0 0 12px rgba(255,47,160,0.8)',
    transition: 'opacity .25s',
    opacity: active ? 1 : 0,
  };
}

export function metricStyle(active) {
  return {
    border: 'none',
    cursor: 'pointer',
    padding: '9px 16px',
    borderRadius: 12,
    fontFamily: FONT.black,
    fontSize: 12,
    letterSpacing: '0.5px',
    transition: 'all .25s',
    ...(active
      ? {
          background: 'linear-gradient(160deg,#FF4FB0,#FF1E8E)',
          color: '#fff',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4),0 4px 12px rgba(255,47,160,0.4)',
        }
      : { background: 'transparent', color: 'rgba(243,241,248,0.5)' }),
  };
}

export function chipStyle(active) {
  return {
    border: 'none',
    cursor: 'pointer',
    padding: '11px 16px',
    borderRadius: 14,
    fontFamily: FONT.black,
    fontSize: 12,
    letterSpacing: '0.3px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all .2s',
    whiteSpace: 'nowrap',
    ...(active
      ? {
          background: 'rgba(255,47,160,0.12)',
          border: '1px solid rgba(255,47,160,0.6)',
          color: '#FF6FC4',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
        }
      : {
          background: 'linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(243,241,248,0.7)',
        }),
  };
}

export function sideTag(isBuy) {
  return {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '5px 10px',
      borderRadius: 9,
      fontFamily: FONT.black,
      fontSize: 10,
      letterSpacing: '1px',
      ...(isBuy
        ? { background: 'rgba(46,229,166,0.14)', border: '1px solid rgba(46,229,166,0.5)', color: '#2EE5A6' }
        : { background: 'rgba(255,47,160,0.12)', border: '1px solid rgba(255,47,160,0.5)', color: '#FF6FC4' }),
    },
    arrow: { color: isBuy ? '#2EE5A6' : '#FF6FC4', transform: `rotate(${isBuy ? 0 : 180}deg)` },
  };
}

// avatar circle with the design's inner-glow highlight
export function avatarStyle(from, to, size = 62) {
  return {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: '50%',
    background: `linear-gradient(145deg,${from},${to})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    boxShadow:
      'inset 0 2px 4px rgba(255,255,255,0.45),inset 0 -3px 6px rgba(0,0,0,0.35),0 6px 16px rgba(0,0,0,0.4)',
  };
}
