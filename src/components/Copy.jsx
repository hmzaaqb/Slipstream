import { useState } from 'react';
import { FONT, COLOR, glass, avatarStyle } from '../ui/styles';
import { Bolt } from '../ui/icons';
import { DISCLAIMER_SHORT, LegalFooter } from './Legal';

// Dollar amount each "mirror" order places. Keep in sync with App.onMirror.
const MIRROR_AMOUNT = 100;

function ConnectCard({ onConnect, connecting, connectError }) {
  const [key, setKey] = useState('');
  const [secret, setSecret] = useState('');
  const inputStyle = {
    width: '100%',
    marginTop: 10,
    padding: '13px 15px',
    borderRadius: 13,
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: '#F3F1F8',
    fontFamily: FONT.mono,
    fontSize: 13,
    outline: 'none',
  };
  return (
    <div style={{ marginTop: 22, padding: '34px 26px', textAlign: 'center', borderRadius: 28, ...glass('mid', { borderRadius: 28, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28),0 18px 42px rgba(0,0,0,0.5)' }) }}>
      <div style={{ width: 74, height: 74, margin: '0 auto', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(150deg,rgba(255,47,160,0.22),rgba(120,82,255,0.14))', border: '1px solid rgba(255,255,255,0.16)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3),0 8px 22px rgba(255,47,160,0.3)' }}>
        <Bolt width={32} height={40} gradId="blt2" from="#FFB36F" to="#FF7A2E" />
      </div>
      <div style={{ fontFamily: FONT.black, fontSize: 24, marginTop: 20, letterSpacing: '-0.5px' }}>Connect Alpaca</div>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 14, lineHeight: 1.6, color: 'rgba(243,241,248,0.6)', marginTop: 12, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
        Link your Alpaca <strong style={{ color: '#FF8FCE' }}>paper</strong> account to mirror trades from politicians you follow. Paste your paper API key &amp; secret — they stay on this device.
      </div>

      <input style={inputStyle} placeholder="API Key ID" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" spellCheck={false} />
      <input style={inputStyle} placeholder="API Secret Key" value={secret} onChange={(e) => setSecret(e.target.value)} type="password" autoComplete="off" spellCheck={false} />

      {connectError && (
        <div style={{ marginTop: 12, fontFamily: FONT.mono, fontSize: 11, color: COLOR.red, lineHeight: 1.5 }}>{connectError}</div>
      )}

      <button
        disabled={connecting || !key.trim() || !secret.trim()}
        onClick={() => onConnect(key, secret)}
        style={{ width: '100%', marginTop: 18, padding: 17, cursor: connecting ? 'wait' : 'pointer', border: 'none', borderRadius: 18, background: 'linear-gradient(160deg,#FF4FB0,#FF1E8E)', color: '#fff', fontFamily: FONT.black, fontSize: 15, letterSpacing: '1px', opacity: connecting || !key.trim() || !secret.trim() ? 0.6 : 1, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45),0 10px 28px rgba(255,47,160,0.45)' }}
      >
        {connecting ? 'CONNECTING…' : 'CONNECT ACCOUNT'}
      </button>
      <div style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(243,241,248,0.45)', marginTop: 18 }}>
        Don't have an account? <a href="https://alpaca.markets/" target="_blank" rel="noreferrer" style={{ color: '#FF8FCE', textDecoration: 'none' }}>Sign up free →</a>
      </div>
      <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.5px', color: 'rgba(243,241,248,0.3)', marginTop: 12, lineHeight: 1.5 }}>
        Get paper keys at app.alpaca.markets → Paper Trading → API Keys. Mirroring runs through the local dev proxy.
      </div>
    </div>
  );
}

function fmtUSD(n) {
  const v = Number(n);
  if (isNaN(v)) return '—';
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function AccountPanel({ account, onDisconnect, onRefresh }) {
  return (
    <div style={{ marginTop: 18, padding: 20, borderRadius: 24, ...glass('mid', { borderRadius: 24 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLOR.green, boxShadow: `0 0 10px ${COLOR.green}`, animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontFamily: FONT.black, fontSize: 14, letterSpacing: '0.5px' }}>ALPACA · PAPER</span>
        </div>
        <button onClick={onDisconnect} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'rgba(243,241,248,0.55)', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', padding: '6px 10px', cursor: 'pointer' }}>DISCONNECT</button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {[
          { label: 'PORTFOLIO', value: fmtUSD(account.portfolio_value), color: '#F3F1F8' },
          { label: 'BUYING POWER', value: fmtUSD(account.buying_power), color: COLOR.green },
          { label: 'CASH', value: fmtUSD(account.cash), color: COLOR.pink },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '12px 4px', borderRadius: 14, ...glass('soft', { borderRadius: 14 }) }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: '1px', color: 'rgba(243,241,248,0.45)' }}>{s.label}</div>
            <div style={{ fontFamily: FONT.black, fontSize: 16, marginTop: 6, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <button onClick={onRefresh} style={{ width: '100%', marginTop: 12, padding: 10, background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: 'rgba(243,241,248,0.5)', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', cursor: 'pointer' }}>REFRESH ACCOUNT</button>
    </div>
  );
}

function FollowedRow({ pol, onRequestMirror, orderState, onOpenProfile }) {
  const recentBuys = pol.trades.filter((t) => t.type === 'buy').slice(0, 4);
  return (
    <div style={{ marginTop: 12, padding: 16, borderRadius: 20, ...glass('soft', { borderRadius: 20 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ ...avatarStyle(pol.from, pol.to, 40) }} onClick={() => onOpenProfile(pol)} role="button">
          <span style={{ fontFamily: FONT.black, fontSize: 13, color: '#fff' }}>{pol.initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT.black, fontSize: 16 }}>{pol.name}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.5px', color: 'rgba(243,241,248,0.45)' }}>{pol.chamber === 'senate' ? 'SENATE' : 'HOUSE'}{pol.state ? ' · ' + pol.state : ''}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {recentBuys.length === 0 && <span style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(243,241,248,0.4)' }}>No recent buys to mirror.</span>}
        {recentBuys.map((t) => {
          const key = `${pol.name}:${t.symbol}`;
          const st = orderState[key];
          return (
            <button key={t.id} disabled={st === 'pending' || st === 'done'} onClick={() => onRequestMirror(pol, t)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 12, cursor: st ? 'default' : 'pointer', border: '1px solid rgba(46,229,166,0.4)', background: st === 'done' ? 'rgba(46,229,166,0.22)' : 'rgba(46,229,166,0.1)', color: COLOR.green, fontFamily: FONT.black, fontSize: 11, letterSpacing: '0.5px' }}>
              {t.symbol}
              <span style={{ fontFamily: FONT.mono, fontSize: 9, color: 'rgba(243,241,248,0.6)' }}>
                {st === 'pending' ? '…' : st === 'done' ? '✓ FILLED' : st === 'error' ? '✕ ERR' : `MIRROR $${MIRROR_AMOUNT}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Confirmation gate shown before any order is placed. Even though this is paper
// trading today, the same flow protects users if live trading is ever enabled —
// no order goes out without an explicit, informed confirmation.
function MirrorConfirm({ pending, onCancel, onConfirm }) {
  const [ack, setAck] = useState(false);
  if (!pending) return null;
  const { pol, trade } = pending;
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(4,4,9,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 430, maxWidth: '100%', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '22px 24px 30px', ...glass('strong', { borderTopLeftRadius: 28, borderTopRightRadius: 28, border: '1px solid rgba(255,255,255,0.16)' }) }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 42, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '2px', color: 'rgba(243,241,248,0.45)' }}>CONFIRM MIRROR ORDER</div>
        <div style={{ fontFamily: FONT.black, fontSize: 22, letterSpacing: '-0.5px', marginTop: 8 }}>
          Buy ${MIRROR_AMOUNT} of {trade.symbol}
        </div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 13.5, lineHeight: 1.6, color: 'rgba(243,241,248,0.65)', marginTop: 8 }}>
          Mirroring {pol.name}'s {trade.symbol} buy. This places a <strong>${MIRROR_AMOUNT} market order</strong> in your connected Alpaca <strong style={{ color: COLOR.green }}>paper</strong> account.
        </div>

        <div style={{ marginTop: 16, padding: '13px 15px', borderRadius: 14, background: 'rgba(255,47,160,0.08)', border: '1px solid rgba(255,47,160,0.3)' }}>
          <div style={{ fontFamily: FONT.black, fontSize: 12, color: COLOR.pink, letterSpacing: '0.3px' }}>⚠ Risk warning</div>
          <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 12, lineHeight: 1.55, color: 'rgba(243,241,248,0.7)', marginTop: 6 }}>
            This is not investment advice. Copying trades can lose money. Disclosures may be delayed, so prices will differ from when the politician traded. You are solely responsible for every order.
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, cursor: 'pointer', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12.5, color: 'rgba(243,241,248,0.7)' }}>
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ flex: 'none', width: 18, height: 18, marginTop: 1, accentColor: COLOR.pink, cursor: 'pointer' }} />
          <span>I understand the risks and want to place this order.</span>
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 15, borderRadius: 16, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#F3F1F8', fontFamily: FONT.black, fontSize: 13, letterSpacing: '0.5px' }}>CANCEL</button>
          <button
            disabled={!ack}
            onClick={() => onConfirm(pol, trade)}
            style={{ flex: 1, padding: 15, borderRadius: 16, cursor: ack ? 'pointer' : 'not-allowed', border: 'none', background: 'linear-gradient(160deg,#2EE5A6,#16B98A)', color: '#04130D', fontFamily: FONT.black, fontSize: 13, letterSpacing: '0.5px', opacity: ack ? 1 : 0.5 }}
          >
            PLACE ORDER
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Copy({ connected, account, connecting, connectError, onConnect, onDisconnect, onRefresh, followed, onMirror, orderState, onOpenProfile }) {
  const [pending, setPending] = useState(null);

  const requestMirror = (pol, trade) => {
    if (!connected) return; // mirroring disabled until Alpaca is linked
    setPending({ pol, trade });
  };
  const confirmMirror = (pol, trade) => {
    setPending(null);
    onMirror(pol, trade);
  };

  return (
    <div className="fade-in">
      <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '3px', color: 'rgba(243,241,248,0.45)', marginTop: 22 }}>COPY TRADE</div>
      <div style={{ fontFamily: FONT.black, fontSize: 26, lineHeight: 1.05, letterSpacing: '-0.8px', marginTop: 10 }}>Mirror congressional<br />trades via Alpaca</div>

      {!connected && <ConnectCard onConnect={onConnect} connecting={connecting} connectError={connectError} />}
      {connected && account && <AccountPanel account={account} onDisconnect={onDisconnect} onRefresh={onRefresh} />}

      <div style={{ marginTop: 26, fontFamily: FONT.mono, fontSize: 12, letterSpacing: '2px', color: 'rgba(243,241,248,0.55)' }}>
        {followed.length > 0 ? `FOLLOWED POLITICIANS · ${followed.length}` : 'NO FOLLOWED POLITICIANS'}
      </div>

      {followed.length === 0 ? (
        <div style={{ marginTop: 12, padding: 22, borderRadius: 20, border: '1.5px dashed rgba(255,255,255,0.14)', fontFamily: FONT.archivo, fontWeight: 500, fontSize: 14, lineHeight: 1.6, color: 'rgba(243,241,248,0.5)' }}>
          Go to a politician's profile and tap <span style={{ color: '#FF8FCE', fontWeight: 800 }}>★ FOLLOW</span> to add them here.
        </div>
      ) : (
        followed.map((pol) => (
          <FollowedRow key={pol.name} pol={pol} onRequestMirror={requestMirror} orderState={orderState} onOpenProfile={onOpenProfile} />
        ))
      )}

      {followed.length > 0 && !connected && (
        <div style={{ marginTop: 14, fontFamily: FONT.mono, fontSize: 11, color: COLOR.pink, letterSpacing: '0.5px' }}>
          Connect Alpaca above to enable mirroring.
        </div>
      )}

      {/* Always-visible financial disclaimer on the trading surface. */}
      <div style={{ marginTop: 24, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '1.5px', color: 'rgba(243,241,248,0.4)' }}>DISCLAIMER</div>
        <div style={{ fontFamily: FONT.archivo, fontWeight: 500, fontSize: 11, lineHeight: 1.55, color: 'rgba(243,241,248,0.5)', marginTop: 6 }}>{DISCLAIMER_SHORT}</div>
        <LegalFooter align="left" style={{ marginTop: 10 }} />
      </div>

      <MirrorConfirm pending={pending} onCancel={() => setPending(null)} onConfirm={confirmMirror} />
    </div>
  );
}
