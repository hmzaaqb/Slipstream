import { FONT, COLOR, glass, metricStyle, goldButton, label } from '../ui/styles';
import { AreaChart, EmptyRow, SectionHeading } from '../ui/bits';
import { fmtUSD, fmtSignedUSD } from '../ui/format';
import { ScreenTitle, EnvBadge } from './Shell';
import { fmtPct } from '../api';

const PERIODS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

function HoldingRow({ pos, sourceLabel }) {
  const ret = Number(pos.unrealized_plpc);
  const up = ret >= 0;
  const qty = Number(pos.qty);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', borderRadius: 18, ...glass('mid', { borderRadius: 18 }) }}>
      <div style={{ width: 42, height: 42, flex: 'none', borderRadius: 13, background: COLOR.elevated, border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.archivo, fontWeight: 800, fontSize: 12 }}>
        {pos.symbol.slice(0, 2)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15 }}>{pos.symbol}</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim, marginTop: 2 }}>
          {qty.toLocaleString('en-US', { maximumFractionDigits: 4 })} share{qty === 1 ? '' : 's'} · {sourceLabel}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15 }}>{fmtUSD(pos.market_value)}</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 12, marginTop: 2, color: up ? COLOR.green : COLOR.red }}>
          {fmtPct(ret)} · {fmtSignedUSD(pos.unrealized_pl)}
        </div>
      </div>
    </div>
  );
}

export default function Portfolio({
  connected,
  account,
  positions,
  positionsLoading,
  history,
  historyLoading,
  period,
  setPeriod,
  followed,
  onRefresh,
  onGoCopy,
}) {
  if (!connected || !account) {
    return (
      <div className="fade-in">
        <ScreenTitle title="My Portfolio" right={<EnvBadge />} />
        <EmptyRow>
          No brokerage account linked yet. Connect Alpaca paper trading to see your balance and holdings here.
        </EmptyRow>
        <button onClick={onGoCopy} style={goldButton({ width: '100%', height: 52, marginTop: 14 })}>Connect Alpaca</button>
      </div>
    );
  }

  const value = Number(account.portfolio_value ?? account.equity);
  const lastEquity = Number(account.last_equity);
  const dayChange = isNaN(value) || isNaN(lastEquity) ? null : value - lastEquity;
  const invested = (positions || []).reduce((s, p) => s + Number(p.cost_basis || 0), 0);
  const series = history?.equity?.filter((v) => v != null) ?? [];

  // Symbols traded by politicians the user follows — used to label a position
  // as copied rather than manual.
  const copiedBy = new Map();
  for (const pol of followed || []) {
    for (const t of pol.trades) {
      if (!copiedBy.has(t.symbol)) copiedBy.set(t.symbol, pol.name);
    }
  }

  return (
    <div className="fade-in">
      <ScreenTitle title="My Portfolio" right={<EnvBadge />} />

      <div style={{ marginTop: 16, padding: 20, borderRadius: 22, ...glass('card', { borderRadius: 22 }) }}>
        <div style={label({ fontSize: 11, letterSpacing: '1.2px' })}>TOTAL VALUE</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 36, letterSpacing: '-1.2px', marginTop: 8 }}>{fmtUSD(value)}</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
          <span style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 13, color: (dayChange ?? 0) >= 0 ? COLOR.green : COLOR.red }}>
            {dayChange == null ? '—' : `${fmtSignedUSD(dayChange)} today`}
          </span>
          <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 13, color: COLOR.muted }}>{fmtUSD(invested)} invested</span>
        </div>
        {historyLoading ? (
          <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11, color: COLOR.dim }}>Loading chart…</div>
        ) : (
          <AreaChart values={series} height={70} gradId="pfill" />
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={metricStyle(period === p)}>{p}</button>
          ))}
        </div>
      </div>

      <SectionHeading
        right={
          <span onClick={onRefresh} role="button" style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.goldSoft, cursor: 'pointer' }}>
            {positionsLoading ? 'Refreshing…' : `${positions?.length ?? 0} positions · refresh`}
          </span>
        }
      >
        Holdings
      </SectionHeading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {positionsLoading && (positions || []).length === 0 ? (
          <EmptyRow>Loading positions…</EmptyRow>
        ) : (positions || []).length === 0 ? (
          <EmptyRow>
            No open positions. Mirror a followed politician's buy from the Copy tab to open your first one.
          </EmptyRow>
        ) : (
          positions.map((pos) => (
            <HoldingRow key={pos.symbol} pos={pos} sourceLabel={copiedBy.has(pos.symbol) ? `Copied · ${copiedBy.get(pos.symbol)}` : 'Manual'} />
          ))
        )}
      </div>
    </div>
  );
}
