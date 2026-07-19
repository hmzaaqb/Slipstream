import { useState } from 'react';
import { FONT, COLOR, glass, metricStyle, goldButton, label, avatarStyle, sideTag, GOLD_GRADIENT } from '../ui/styles';
import { AreaChart, StatTile, SectionHeading, EmptyRow } from '../ui/bits';
import { fmtUSD, fmtSignedUSD } from '../ui/format';
import { GreetingHeader, SourceLine } from './Shell';
import { CapitolIcon, SwapIcon, WalletIcon } from '../ui/icons';
import { fmtPct, fmtMoneyShort } from '../api';

const PERIODS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

function ConnectPrompt({ onGoCopy }) {
  return (
    <div style={{ marginTop: 18, padding: 22, borderRadius: 24, ...glass('card', { borderRadius: 24 }) }}>
      <div style={label({ letterSpacing: '1.5px', fontSize: 12 })}>PORTFOLIO VALUE</div>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 34, letterSpacing: '-1px', marginTop: 12, color: COLOR.dim }}>—</div>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 13, lineHeight: 1.6, color: COLOR.muted, marginTop: 10 }}>
        Connect your Alpaca paper account to see your balance, holdings and copy-trade activity here.
      </div>
      <button onClick={onGoCopy} style={goldButton({ width: '100%', height: 50, marginTop: 16 })}>Connect Alpaca</button>
    </div>
  );
}

function PortfolioHero({ account, history, period, setPeriod, historyLoading, onGoPortfolio }) {
  const value = Number(account.portfolio_value ?? account.equity);
  const lastEquity = Number(account.last_equity);
  const dayChange = isNaN(value) || isNaN(lastEquity) ? null : value - lastEquity;
  const dayPct = dayChange == null || !lastEquity ? null : dayChange / lastEquity;

  const series = history?.equity?.filter((v) => v != null) ?? [];
  const first = series[0];
  const periodPct = first ? value / first - 1 : null;

  return (
    <div style={{ position: 'relative', marginTop: 18, padding: 22, borderRadius: 24, overflow: 'hidden', ...glass('card', { borderRadius: 24 }) }}>
      <div style={{ position: 'absolute', top: -70, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.16), transparent 68%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={label({ letterSpacing: '1.5px', fontSize: 12 })}>PORTFOLIO VALUE</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11, color: COLOR.green }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR.green }} />
          Alpaca connected
        </span>
      </div>

      <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 42, letterSpacing: '-1.5px', lineHeight: 1, marginTop: 12 }}>{fmtUSD(value)}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
        <span style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 14, color: (dayChange ?? 0) >= 0 ? COLOR.green : COLOR.red }}>
          {dayChange == null ? '—' : `${fmtSignedUSD(dayChange)} today`}
          {dayPct != null && ` (${fmtPct(dayPct)})`}
        </span>
        {periodPct != null && (
          <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 14, color: COLOR.muted }}>{fmtPct(periodPct)} {period}</span>
        )}
      </div>

      {historyLoading ? (
        <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11, color: COLOR.dim }}>Loading chart…</div>
      ) : (
        <AreaChart values={series} />
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        {PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)} style={metricStyle(period === p)}>{p}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COLOR.hairline}` }}>
        <div>
          <div style={label({ fontSize: 11, letterSpacing: '1px' })}>BUYING POWER</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 16, marginTop: 3 }}>{fmtUSD(account.buying_power)}</div>
        </div>
        <div>
          <div style={label({ fontSize: 11, letterSpacing: '1px' })}>CASH</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 16, marginTop: 3 }}>{fmtUSD(account.cash)}</div>
        </div>
        <button onClick={onGoPortfolio} style={{ padding: '12px 18px', cursor: 'pointer', border: 'none', borderRadius: 14, background: GOLD_GRADIENT, color: '#090909', fontFamily: FONT.archivo, fontWeight: 800, fontSize: 13 }}>
          View Portfolio
        </button>
      </div>
    </div>
  );
}

function QuickAction({ Icon, children, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 9, padding: '13px 16px', cursor: 'pointer', borderRadius: 16, background: COLOR.surfaceAlt, border: `1px solid ${COLOR.hairline}`, color: COLOR.text, fontFamily: FONT.archivo, fontWeight: 700, fontSize: 13 }}>
      <span style={{ display: 'flex', color: COLOR.gold }}><Icon size={15} /></span>
      {children}
    </button>
  );
}

function StrategyRow({ pol, orderCount, onOpen }) {
  return (
    <div onClick={() => onOpen(pol)} role="button" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', borderRadius: 18, cursor: 'pointer', ...glass('mid', { borderRadius: 18, border: `1px solid ${COLOR.goldEdge}` }) }}>
      <div style={avatarStyle(pol.from, pol.to, 44, true)}>{pol.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15 }}>{pol.name}</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim, marginTop: 2 }}>
          {fmtMoneyShort(pol.volume)} disclosed · {orderCount} mirrored
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15, color: (pol.roi ?? 0) >= 0 ? COLOR.green : COLOR.red }}>{fmtPct(pol.roi)}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FONT.archivo, fontWeight: 700, fontSize: 10, letterSpacing: '0.5px', color: COLOR.gold, marginTop: 3 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: COLOR.gold }} />
          FOLLOWING
        </div>
      </div>
    </div>
  );
}

function DisclosureRow({ row, onOpenPolitician }) {
  const tag = sideTag(row.isBuy);
  return (
    <div onClick={() => onOpenPolitician(row.pol)} role="button" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', borderRadius: 18, cursor: 'pointer', ...glass('mid', { borderRadius: 18 }) }}>
      <div style={{ ...tag.style, width: 44, height: 44, flex: 'none', borderRadius: 14, justifyContent: 'center' }}>{row.side}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          {/* Ticker-less assets (treasury bills, notes) are real disclosures —
              lead with the asset name instead of an empty ticker. */}
          <span style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15, letterSpacing: '0.3px' }}>{row.ticker || row.company}</span>
          {row.ticker && (
            <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12, color: COLOR.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.company}</span>
          )}
        </div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim, marginTop: 3 }}>
          {row.pol} · {row.disclosed.toLowerCase()}
          {row.link && (
            <a
              href={row.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ marginLeft: 7, color: COLOR.goldSoft, textDecoration: 'none', fontWeight: 700 }}
            >
              filing ↗
            </a>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none' }}>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 13 }}>{row.amt}</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 10.5, marginTop: 3, color: row.retPositive == null ? COLOR.dim : row.retPositive ? COLOR.green : COLOR.red }}>
          {row.ret === '—' ? 'no price' : `${row.ret} since`}
        </div>
      </div>
    </div>
  );
}

export default function Home({
  user,
  connected,
  account,
  history,
  historyLoading,
  period,
  setPeriod,
  followed,
  orderState,
  disclosures,
  source,
  coverage,
  updatedLabel,
  polCount,
  tradeCount,
  onGoPoliticians,
  onGoCopy,
  onGoPortfolio,
  onOpenProfile,
  onOpenProfileByName,
  onRefresh,
}) {
  // How many disclosure rows are visible; "Show more" grows it.
  const [feedCount, setFeedCount] = useState(8);
  const mirroredFor = (name) =>
    Object.keys(orderState).filter((k) => k.startsWith(`${name}:`) && orderState[k] === 'done').length;

  return (
    <div className="fade-in">
      <GreetingHeader name={user?.name} />

      {connected && account ? (
        <PortfolioHero
          account={account}
          history={history}
          historyLoading={historyLoading}
          period={period}
          setPeriod={setPeriod}
          onGoPortfolio={onGoPortfolio}
        />
      ) : (
        <ConnectPrompt onGoCopy={onGoCopy} />
      )}

      <div className="hscroll" style={{ display: 'flex', gap: 10, marginTop: 16, paddingBottom: 4 }}>
        <QuickAction Icon={CapitolIcon} onClick={onGoPoliticians}>Discover Politicians</QuickAction>
        <QuickAction Icon={SwapIcon} onClick={onGoCopy}>Manage Copy Trading</QuickAction>
        <QuickAction Icon={WalletIcon} onClick={onGoPortfolio}>View Holdings</QuickAction>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <StatTile title="POLITICIANS" value={String(polCount)} />
        <StatTile title="DISCLOSURES" value={String(tradeCount)} />
        <StatTile title="FOLLOWING" value={String(followed.length)} color={COLOR.goldSoft} />
      </div>

      <SectionHeading right={<span onClick={onGoCopy} style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 12, color: COLOR.goldSoft, cursor: 'pointer' }}>See all</span>}>
        Active copy strategies
      </SectionHeading>
      {followed.length === 0 ? (
        <EmptyRow>
          Follow a politician to start a copy strategy. Tap{' '}
          <span style={{ color: COLOR.goldSoft, fontWeight: 800 }}>Follow</span> on the Politicians tab.
        </EmptyRow>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {followed.map((pol) => (
            <StrategyRow key={pol.name} pol={pol} orderCount={mirroredFor(pol.name)} onOpen={onOpenProfile} />
          ))}
        </div>
      )}

      <SectionHeading right={<span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11, color: COLOR.dim }}>Filings may be delayed</span>}>
        Latest disclosures
      </SectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {disclosures.slice(0, feedCount).map((row) => (
          <DisclosureRow key={row.id} row={row} onOpenPolitician={onOpenProfileByName} />
        ))}
      </div>
      {disclosures.length > feedCount && (
        <button
          onClick={() => setFeedCount((n) => n + 12)}
          style={{ width: '100%', marginTop: 12, padding: '13px 0', borderRadius: 16, border: `1px solid ${COLOR.hairline}`, background: COLOR.surface, color: COLOR.goldSoft, fontFamily: FONT.archivo, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
        >
          Show more disclosures
        </button>
      )}

      <SourceLine source={source} coverage={coverage} updatedLabel={updatedLabel} onRefresh={onRefresh} />
    </div>
  );
}
