// SVG icons ported verbatim from the Slipstream design.

export const BarsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="9" width="3.4" height="6" rx="1" fill="currentColor" />
    <rect x="6.3" y="4" width="3.4" height="11" rx="1" fill="currentColor" />
    <rect x="11.1" y="6.5" width="3.4" height="8.5" rx="1" fill="currentColor" />
  </svg>
);

export const FeedIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="11" r="2" fill="currentColor" />
    <path d="M4 7a5.5 5.5 0 0 1 8 0M2 4.5a9 9 0 0 1 12 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const ProfileIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2.8 14a5.2 5.2 0 0 1 10.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const CopyIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <rect x="6" y="6" width="8" height="8" rx="2" fill="#06060b" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

export const Bolt = ({ width = 32, height = 40, gradId = 'blt', from = '#FF6FC4', to = '#FF1E8E', style }) => (
  <svg width={width} height={height} viewBox="0 0 30 38" fill="none" style={style}>
    <path d="M18 2 L4 21 L13 21 L11 36 L26 16 L17 16 Z" fill={`url(#${gradId})`} />
    <defs>
      <linearGradient id={gradId} x1="0" y1="0" x2="30" y2="38">
        <stop offset="0" stopColor={from} />
        <stop offset="1" stopColor={to} />
      </linearGradient>
    </defs>
  </svg>
);

export const SearchIcon = ({ size = 18, opacity = 0.5 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <circle cx="7.5" cy="7.5" r="5.5" stroke={`rgba(243,241,248,${opacity})`} strokeWidth="1.6" />
    <path d="M11.6 11.6 L16 16" stroke={`rgba(243,241,248,${opacity})`} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const FilterIcon = () => (
  <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
    <path d="M1 2h14M3 7h10M6 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const Chevron = ({ style }) => (
  <svg width="11" height="8" viewBox="0 0 11 8" fill="none" style={style}>
    <path d="M1 1.5 L5.5 6 L10 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Triangle = ({ size = 9, style }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" style={style}>
    <path d="M5 1 L9 8 L1 8 Z" fill="currentColor" />
  </svg>
);

export const ClockIcon = ({ opacity = 0.45 }) => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <path d="M1 4.5 L4 4.5 L7.5 1.5 L7.5 10.5 L4 7.5 L1 7.5 Z" fill={`rgba(243,241,248,${opacity})`} />
    <path d="M9 4a2.4 2.4 0 0 1 0 4" stroke={`rgba(243,241,248,${opacity})`} strokeWidth="1" strokeLinecap="round" />
  </svg>
);

export const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M10.5 6a4.5 4.5 0 1 1-1.3-3.2" stroke="rgba(243,241,248,0.55)" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M9.4 0.5 L9.4 3 L6.9 3" stroke="rgba(243,241,248,0.55)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M8 2 L3.5 6.5 L8 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StarIcon = ({ color = '#FF8FCE', filled = false }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M6 1 L7.4 4.3 L11 4.6 L8.2 6.9 L9.1 10.4 L6 8.5 L2.9 10.4 L3.8 6.9 L1 4.6 L4.6 4.3 Z"
      stroke={color}
      strokeWidth="1"
      fill={filled ? color : 'none'}
      strokeLinejoin="round"
    />
  </svg>
);

export const ShareIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 8 L6 1.5 M3.5 4 L6 1.5 L8.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 7 L2 10.5 L10 10.5 L10 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
