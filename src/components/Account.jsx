import { FONT, COLOR, glass, avatarStyle } from '../ui/styles';
import { ScreenTitle, EnvBadge } from './Shell';
import { CheckIcon, ChevronRight } from '../ui/icons';
import { DISCLAIMER_SHORT, LegalFooter } from './Legal';
import { getCoverageGap } from '../api';

function Row({ children, hint, onClick, last }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)', cursor: onClick ? 'pointer' : 'default' }}
    >
      <span style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 14, flex: 1 }}>{children}</span>
      <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12, color: COLOR.dim }}>{hint}</span>
      <ChevronRight />
    </div>
  );
}

export default function Account({
  user,
  connected,
  account,
  followedCount,
  tradeCount,
  polCount,
  source,
  onDisconnect,
  onGoCopy,
  onSignOut,
}) {
  const initials = (user?.name || user?.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const accountNumber = account?.account_number ? `•••• ${String(account.account_number).slice(-4)}` : '—';

  return (
    <div className="fade-in">
      <ScreenTitle title="Profile" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 16, padding: 18, borderRadius: 20, ...glass('mid', { borderRadius: 20 }) }}>
        <div style={avatarStyle(null, null, 56, true)}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Signed in'}</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12, color: COLOR.dim, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
        </div>
        <EnvBadge />
      </div>

      {/* Alpaca connection */}
      <div style={{ marginTop: 12, padding: '17px 18px', borderRadius: 20, ...glass('mid', { borderRadius: 20 }) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {connected ? <CheckIcon /> : <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLOR.dim }} />}
            <span style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 14 }}>
              {connected ? 'Alpaca connected' : 'Alpaca not connected'}
            </span>
          </div>
          <span style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 12, color: COLOR.muted }}>{accountNumber}</span>
        </div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim, marginTop: 8 }}>
          {connected
            ? 'Paper environment · keys stored on this device only'
            : 'Link a paper account from the Copy tab to enable mirroring'}
        </div>
        <button
          onClick={connected ? onDisconnect : onGoCopy}
          style={{ width: '100%', marginTop: 12, padding: 11, borderRadius: 12, cursor: 'pointer', background: 'none', border: `1px solid ${connected ? 'rgba(240,100,110,0.35)' : COLOR.hairlineStrong}`, color: connected ? COLOR.red : COLOR.muted, fontFamily: FONT.archivo, fontWeight: 700, fontSize: 12 }}
        >
          {connected ? 'Disconnect Alpaca' : 'Connect Alpaca'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12, borderRadius: 20, overflow: 'hidden', ...glass('mid', { borderRadius: 20 }) }}>
        <Row hint={String(followedCount)}>Following</Row>
        <Row hint={`${polCount} politicians`}>Tracked coverage</Row>
        <Row hint={`${tradeCount} disclosures`}>Data source</Row>
        <Row hint={source === 'sample' ? 'demo dataset' : source === 'snapshot' ? 'scraped filings' : 'live filings'} last>Feed mode</Row>
      </div>

      {/* Honest coverage note: paper filings we can't parse yet. Better to say
          so than to let missing filers look like non-traders. */}
      {(() => {
        const gap = getCoverageGap();
        if (!gap?.filings) return null;
        return (
          <div style={{ marginTop: 12, padding: '13px 16px', borderRadius: 16, background: 'rgba(212,175,55,0.06)', border: `1px solid ${COLOR.goldEdge}` }}>
            <div style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 11.5, color: COLOR.goldSoft }}>
              Known coverage gap
            </div>
            <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 11, lineHeight: 1.55, color: COLOR.muted, marginTop: 5 }}>
              {gap.filings} paper filings (scanned images) aren't parsed yet, so{' '}
              {gap.filers.slice(0, 3).join(', ')}{gap.filers.length > 3 ? ` and ${gap.filers.length - 3} others` : ''} are
              missing or under-counted in the feed.
            </div>
          </div>
        );
      })()}

      <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 16, background: '#0A0A0A', border: `1px solid ${COLOR.hairline}` }}>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 9.5, letterSpacing: '1.5px', color: COLOR.dim }}>DISCLAIMER</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 11, lineHeight: 1.55, color: COLOR.muted, marginTop: 6 }}>{DISCLAIMER_SHORT}</div>
        <LegalFooter align="left" style={{ marginTop: 10 }} />
      </div>

      <button
        onClick={onSignOut}
        style={{ width: '100%', marginTop: 14, padding: 15, borderRadius: 16, cursor: 'pointer', background: '#0A0A0A', border: '1px solid rgba(240,100,110,0.35)', color: COLOR.red, fontFamily: FONT.archivo, fontWeight: 800, fontSize: 13.5 }}
      >
        Sign out
      </button>
    </div>
  );
}
