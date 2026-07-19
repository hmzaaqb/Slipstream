import { useState } from 'react';
import { FONT, COLOR, glass, goldButton, avatarStyle, label, sideTag, GOLD_GRADIENT } from '../ui/styles';
import { StatTile, EmptyRow, SectionHeading, Note } from '../ui/bits';
import { fmtUSD } from '../ui/format';
import { ScreenTitle, EnvBadge } from './Shell';
import { fmtPct, fmtMoneyShort, timeAgo, fmtDateLong } from '../api';
import { DISCLAIMER_SHORT, LegalFooter } from './Legal';

// Preset chips for the per-mirror order size. Custom values are typed in.
const AMOUNT_PRESETS = [50, 100, 250, 500];

// Per-trade order size picker. The chosen amount is persisted (App owns it)
// and applies to every mirror order until changed.
function AmountPicker({ amount, setAmount }) {
  const [draft, setDraft] = useState(null); // null = not editing custom
  const commit = () => {
    if (draft != null && draft !== '') setAmount(draft);
    setDraft(null);
  };
  return (
    <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 18, ...glass('mid', { borderRadius: 18 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={label()}>PER-TRADE AMOUNT</span>
        <span style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 14, color: COLOR.goldSoft }}>${amount}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
        {AMOUNT_PRESETS.map((v) => (
          <button
            key={v}
            onClick={() => { setDraft(null); setAmount(v); }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 11,
              cursor: 'pointer',
              fontFamily: FONT.archivo,
              fontWeight: 800,
              fontSize: 12.5,
              border: `1px solid ${amount === v && draft == null ? COLOR.goldEdgeStrong : COLOR.hairlineStrong}`,
              background: amount === v && draft == null ? 'rgba(212,175,55,0.12)' : COLOR.elevated,
              color: amount === v && draft == null ? COLOR.goldSoft : COLOR.text,
            }}
          >
            ${v}
          </button>
        ))}
        <input
          type="number"
          min="1"
          max="10000"
          placeholder="Custom"
          value={draft ?? ''}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          style={{
            flex: 1.2,
            minWidth: 0,
            padding: '9px 10px',
            borderRadius: 11,
            border: `1px solid ${draft != null ? COLOR.goldEdgeStrong : COLOR.hairlineStrong}`,
            background: '#0A0A0A',
            color: COLOR.text,
            fontFamily: FONT.archivo,
            fontWeight: 700,
            fontSize: 12.5,
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

function ConnectCard({ onConnect, connecting, connectError }) {
  const [key, setKey] = useState('');
  const [secret, setSecret] = useState('');
  const inputStyle = {
    width: '100%',
    marginTop: 10,
    padding: '13px 15px',
    borderRadius: 13,
    background: '#0A0A0A',
    border: `1px solid ${COLOR.hairlineStrong}`,
    color: COLOR.text,
    fontFamily: FONT.mono,
    fontSize: 13,
    outline: 'none',
  };
  const disabled = connecting || !key.trim() || !secret.trim();
  return (
    <div style={{ marginTop: 18, padding: '28px 22px', borderRadius: 24, ...glass('card', { borderRadius: 24 }) }}>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>Connect Alpaca</div>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 13.5, lineHeight: 1.6, color: COLOR.muted, marginTop: 10 }}>
        Link your Alpaca <strong style={{ color: COLOR.goldSoft }}>paper</strong> account to mirror trades from politicians you follow. Your keys stay on this device.
      </div>

      <input style={inputStyle} placeholder="API Key ID" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" spellCheck={false} />
      <input style={inputStyle} placeholder="API Secret Key" value={secret} onChange={(e) => setSecret(e.target.value)} type="password" autoComplete="off" spellCheck={false} />

      {connectError && (
        <div style={{ marginTop: 12, fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.red, lineHeight: 1.5 }}>{connectError}</div>
      )}

      <button
        disabled={disabled}
        onClick={() => onConnect(key, secret)}
        style={goldButton({ width: '100%', height: 52, marginTop: 16, cursor: connecting ? 'wait' : 'pointer', opacity: disabled ? 0.55 : 1 })}
      >
        {connecting ? 'Connecting…' : 'Connect Account'}
      </button>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12, color: COLOR.dim, marginTop: 14, lineHeight: 1.5 }}>
        Get paper keys at app.alpaca.markets → Paper Trading → API Keys.{' '}
        <a href="https://alpaca.markets/" target="_blank" rel="noreferrer" style={{ color: COLOR.goldSoft, textDecoration: 'none' }}>Sign up free →</a>
      </div>
    </div>
  );
}

function MasterToggle({ on, onToggle, connected, amount }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, padding: '17px 18px', borderRadius: 20, ...glass('mid', { borderRadius: 20 }) }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15 }}>Mirroring enabled</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12, color: COLOR.dim, marginTop: 3 }}>
          {!connected
            ? 'Connect Alpaca to place mirror orders'
            : on
              ? `Each mirror places a $${amount} market order after you confirm`
              : 'Paused — mirror buttons are disabled'}
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={!connected}
        style={{
          flex: 'none',
          width: 56,
          height: 32,
          borderRadius: 17,
          border: `1px solid ${on ? 'rgba(212,175,55,0.5)' : COLOR.hairlineStrong}`,
          cursor: connected ? 'pointer' : 'not-allowed',
          padding: 3,
          display: 'flex',
          justifyContent: on ? 'flex-end' : 'flex-start',
          transition: 'all .25s',
          background: on ? GOLD_GRADIENT : COLOR.elevated,
          opacity: connected ? 1 : 0.5,
        }}
      >
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: on ? '#090909' : '#4B4B4B', transition: 'all .25s' }} />
      </button>
    </div>
  );
}

function AccountStrip({ account, positions, onRefresh, onDisconnect }) {
  const deployed = (positions || []).reduce((s, p) => s + Number(p.market_value || 0), 0);
  const pl = (positions || []).reduce((s, p) => s + Number(p.unrealized_pl || 0), 0);
  const basis = (positions || []).reduce((s, p) => s + Number(p.cost_basis || 0), 0);
  const ret = basis ? pl / basis : null;

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <StatTile title="BUYING POWER" value={fmtUSD(account.buying_power, { decimals: 0 })} />
        <StatTile title="DEPLOYED" value={fmtUSD(deployed, { decimals: 0 })} />
        <StatTile title="RETURN" value={fmtPct(ret)} color={(ret ?? 0) >= 0 ? COLOR.green : COLOR.red} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button onClick={onRefresh} style={{ flex: 1, padding: 11, borderRadius: 12, cursor: 'pointer', background: 'none', border: `1px solid ${COLOR.hairline}`, color: COLOR.muted, fontFamily: FONT.archivo, fontWeight: 700, fontSize: 12 }}>Refresh account</button>
        <button onClick={onDisconnect} style={{ flex: 1, padding: 11, borderRadius: 12, cursor: 'pointer', background: 'none', border: '1px solid rgba(240,100,110,0.3)', color: COLOR.red, fontFamily: FONT.archivo, fontWeight: 700, fontSize: 12 }}>Disconnect</button>
      </div>
    </>
  );
}

// The design's "awaiting confirmation" card: the most recent buy disclosed by
// a followed politician that hasn't been mirrored yet.
function NextCandidate({ candidate, canMirror, onRequestMirror, amount }) {
  if (!candidate) return null;
  const { pol, trade } = candidate;
  const tag = sideTag(true);
  return (
    <div style={{ marginTop: 12, padding: 18, borderRadius: 20, ...glass('strong', { borderRadius: 20 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={avatarStyle(pol.from, pol.to, 44, true)}>{pol.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 17 }}>{trade.symbol}</span>
            <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12, color: COLOR.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trade.company}</span>
          </div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim, marginTop: 3 }}>
            {pol.name} · disclosed {timeAgo(trade.disclosureDate).toLowerCase()}
          </div>
        </div>
        <span style={tag.style}>BUY</span>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 13, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <div style={label()}>REPORTED RANGE</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 14, marginTop: 3 }}>
            {fmtMoneyShort(trade.amountLow)}–{fmtMoneyShort(trade.amountHigh).replace('$', '')}
          </div>
        </div>
        <div>
          <div style={label()}>TRADED</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 14, marginTop: 3 }}>{fmtDateLong(trade.transactionDate)}</div>
        </div>
        <div>
          <div style={label()}>YOUR ORDER</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 700, fontSize: 14, marginTop: 3 }}>${amount}.00</div>
        </div>
      </div>

      <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 11, lineHeight: 1.5, color: COLOR.dim, marginTop: 12 }}>
        Disclosures are delayed. Your execution price will differ from the politician's original trade.
      </div>

      <button
        disabled={!canMirror}
        onClick={() => onRequestMirror(pol, trade)}
        style={goldButton({ width: '100%', height: 52, marginTop: 14, opacity: canMirror ? 1 : 0.5, cursor: canMirror ? 'pointer' : 'not-allowed' })}
      >
        Confirm Copy Trade
      </button>
    </div>
  );
}

function StrategyCard({ pol, orderState, canMirror, onRequestMirror, onOpenProfile, amount }) {
  const recentBuys = pol.trades.filter((t) => t.type === 'buy' && t.symbol).slice(0, 4);
  const mirrored = Object.keys(orderState).filter((k) => k.startsWith(`${pol.name}:`) && orderState[k] === 'done').length;

  return (
    <div style={{ padding: 16, borderRadius: 18, ...glass('mid', { borderRadius: 18 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={() => onOpenProfile(pol)} role="button" style={{ ...avatarStyle(pol.from, pol.to, 42, true), cursor: 'pointer' }}>{pol.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15 }}>{pol.name}</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim, marginTop: 2 }}>
            {pol.tradeCount} disclosures · {mirrored} mirrored · max ${amount}/trade
          </div>
        </div>
        <div style={{ flex: 'none', padding: '5px 10px', borderRadius: 8, fontFamily: FONT.archivo, fontWeight: 800, fontSize: 10, letterSpacing: '0.5px', background: canMirror ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.05)', border: `1px solid ${canMirror ? COLOR.goldEdgeStrong : COLOR.hairlineStrong}`, color: canMirror ? COLOR.goldSoft : COLOR.dim }}>
          {canMirror ? 'ACTIVE' : 'PAUSED'}
        </div>
      </div>

      <div style={{ marginTop: 13, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {recentBuys.length === 0 ? (
          <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim }}>No recent buys to mirror.</span>
        ) : (
          recentBuys.map((t) => {
            const st = orderState[`${pol.name}:${t.symbol}`];
            const done = st === 'done';
            return (
              <button
                key={t.id}
                disabled={!canMirror || st === 'pending' || done}
                onClick={() => onRequestMirror(pol, t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 12px',
                  borderRadius: 12,
                  cursor: !canMirror || st ? 'default' : 'pointer',
                  border: `1px solid ${done ? 'rgba(66,201,137,0.45)' : COLOR.hairlineStrong}`,
                  background: done ? 'rgba(66,201,137,0.12)' : COLOR.elevated,
                  color: done ? COLOR.green : COLOR.text,
                  fontFamily: FONT.archivo,
                  fontWeight: 800,
                  fontSize: 11.5,
                  opacity: canMirror ? 1 : 0.5,
                }}
              >
                {t.symbol}
                <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 10, color: done ? COLOR.green : COLOR.dim }}>
                  {st === 'pending' ? '…' : done ? '✓ filled' : st === 'error' ? '✕ error' : `$${amount}`}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Confirmation gate shown before any order is placed. Even though this is paper
// trading today, the same flow protects users if live trading is ever enabled —
// no order goes out without an explicit, informed confirmation.
function MirrorConfirm({ pending, onCancel, onConfirm, amount, buyingPower }) {
  const [ack, setAck] = useState(false);
  if (!pending) return null;
  const { pol, trade } = pending;
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 430, maxWidth: '100%', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '22px 24px 30px', background: '#0C0C0C', border: `1px solid ${COLOR.hairlineStrong}` }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 42, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        <div style={label({ letterSpacing: '2px', fontSize: 10 })}>CONFIRM MIRROR ORDER</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', marginTop: 8 }}>
          Buy ${amount} of {trade.symbol}
        </div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 13.5, lineHeight: 1.6, color: COLOR.muted, marginTop: 8 }}>
          Mirroring {pol.name}'s {trade.symbol} buy. This places a <strong>${amount} market order</strong> in your connected Alpaca <strong style={{ color: COLOR.green }}>paper</strong> account.
        </div>

        <div style={{ marginTop: 16, padding: '13px 15px', borderRadius: 14, background: 'rgba(240,100,110,0.06)', border: '1px solid rgba(240,100,110,0.28)' }}>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 12, color: COLOR.red, letterSpacing: '0.3px' }}>⚠ Risk warning</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 12, lineHeight: 1.55, color: COLOR.muted, marginTop: 6 }}>
            This is not investment advice. Copying trades can lose money. Disclosures may be delayed, so prices will differ from when the politician traded. You are solely responsible for every order.
          </div>
        </div>

        {/* Insufficient buying power is caught here, before the order is sent,
            instead of surfacing later as an opaque ✕ error chip. */}
        {buyingPower != null && amount > buyingPower && (
          <div style={{ marginTop: 12, fontFamily: FONT.archivo, fontWeight: 700, fontSize: 12, color: COLOR.red }}>
            ${amount} exceeds your buying power ({fmtUSD(buyingPower, { decimals: 0 })}). Lower the per-trade amount.
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, cursor: 'pointer', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12.5, color: COLOR.muted }}>
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ flex: 'none', width: 18, height: 18, marginTop: 1, accentColor: COLOR.gold, cursor: 'pointer' }} />
          <span>I understand the risks and want to place this order.</span>
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 15, borderRadius: 16, cursor: 'pointer', border: `1px solid ${COLOR.hairlineStrong}`, background: COLOR.elevated, color: COLOR.text, fontFamily: FONT.archivo, fontWeight: 800, fontSize: 13 }}>Cancel</button>
          <button
            disabled={!ack || (buyingPower != null && amount > buyingPower)}
            onClick={() => onConfirm(pol, trade)}
            style={goldButton({ flex: 1, padding: 15, cursor: ack ? 'pointer' : 'not-allowed', opacity: ack && !(buyingPower != null && amount > buyingPower) ? 1 : 0.5, fontSize: 13 })}
          >
            Place order
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Copy({
  connected,
  account,
  positions,
  connecting,
  connectError,
  onConnect,
  onDisconnect,
  onRefresh,
  followed,
  onMirror,
  orderState,
  onOpenProfile,
  mirroringOn,
  setMirroringOn,
  mirrorAmount,
  setMirrorAmount,
  onGoPoliticians,
}) {
  const [pending, setPending] = useState(null);

  const canMirror = connected && mirroringOn;
  const requestMirror = (pol, trade) => {
    if (!canMirror) return;
    setPending({ pol, trade });
  };
  const confirmMirror = (pol, trade) => {
    setPending(null);
    onMirror(pol, trade);
  };

  // Most recent un-mirrored buy across everyone the user follows.
  const candidate = (() => {
    let best = null;
    for (const pol of followed) {
      for (const t of pol.trades) {
        if (t.type !== 'buy') continue;
        // Ticker-less assets (treasury bills, notes, annuities) are real
        // disclosures but can't be mirrored — there's nothing to order.
        if (!t.symbol) continue;
        if (orderState[`${pol.name}:${t.symbol}`]) continue;
        if (!best || new Date(t.disclosureDate) > new Date(best.trade.disclosureDate)) best = { pol, trade: t };
      }
    }
    return best;
  })();

  return (
    <div className="fade-in">
      <ScreenTitle title="Copy Trading" right={<EnvBadge />} />

      {!connected ? (
        <ConnectCard onConnect={onConnect} connecting={connecting} connectError={connectError} />
      ) : (
        <>
          <MasterToggle on={mirroringOn} onToggle={() => setMirroringOn((v) => !v)} connected={connected} amount={mirrorAmount} />
          <AmountPicker amount={mirrorAmount} setAmount={setMirrorAmount} />
          {account && <AccountStrip account={account} positions={positions} onRefresh={onRefresh} onDisconnect={onDisconnect} />}
        </>
      )}

      {followed.length > 0 && (
        <>
          <SectionHeading>Awaiting confirmation</SectionHeading>
          {candidate ? (
            <NextCandidate candidate={candidate} canMirror={canMirror} onRequestMirror={requestMirror} amount={mirrorAmount} />
          ) : (
            <Note>Every recent buy from the politicians you follow has already been mirrored.</Note>
          )}
        </>
      )}

      <SectionHeading right={<span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 11.5, color: COLOR.dim }}>{followed.length} following</span>}>
        Your strategies
      </SectionHeading>

      {followed.length === 0 ? (
        <EmptyRow>
          You aren't following anyone yet.{' '}
          <span onClick={onGoPoliticians} role="button" style={{ color: COLOR.goldSoft, fontWeight: 800, cursor: 'pointer' }}>Browse politicians →</span>
        </EmptyRow>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {followed.map((pol) => (
            <StrategyCard
              key={pol.name}
              pol={pol}
              orderState={orderState}
              canMirror={canMirror}
              onRequestMirror={requestMirror}
              onOpenProfile={onOpenProfile}
              amount={mirrorAmount}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, padding: '14px 16px', borderRadius: 16, background: '#0A0A0A', border: `1px solid ${COLOR.hairline}` }}>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 9.5, letterSpacing: '1.5px', color: COLOR.dim }}>DISCLAIMER</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 11, lineHeight: 1.55, color: COLOR.muted, marginTop: 6 }}>{DISCLAIMER_SHORT}</div>
        <LegalFooter align="left" style={{ marginTop: 10 }} />
      </div>

      <MirrorConfirm pending={pending} onCancel={() => setPending(null)} onConfirm={confirmMirror} amount={mirrorAmount} buyingPower={account ? Number(account.buying_power) : null} />
    </div>
  );
}
