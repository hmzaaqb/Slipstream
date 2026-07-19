import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getTrades,
  getPriceMap,
  buildPoliticians,
  filterPoliticians,
  sortPoliticians,
  buildPartyReturn,
  buildFeed,
  buildProfile,
  timeAgo,
} from './api';
import * as alpaca from './alpaca';
import * as auth from './auth';
import { hasSupabase } from './supabase';
import Auth from './components/Auth';
import { Blooms, StatusBar, BottomNav, DemoBanner } from './components/Shell';
import Home from './components/Home';
import Politicians from './components/Politicians';
import PortfolioView from './components/Portfolio';
import Account from './components/Account';
import Profile from './components/Profile';
import Copy from './components/Copy';
import { FONT, COLOR } from './ui/styles';

const FOLLOW_KEY = 'slipstream.followed';
const MIRROR_KEY = 'slipstream.mirroring';
const AMOUNT_KEY = 'slipstream.mirrorAmount';

// Mirror order sizing: user-configurable, clamped to sane paper-trading bounds.
const AMOUNT_MIN = 1;
const AMOUNT_MAX = 10000;
const clampAmount = (n) => Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, Math.round(Number(n) || 0)));
const loadMirrorAmount = () => {
  try {
    const v = Number(localStorage.getItem(AMOUNT_KEY));
    return v >= AMOUNT_MIN && v <= AMOUNT_MAX ? Math.round(v) : 100;
  } catch {
    return 100;
  }
};

const loadFollowed = () => {
  try {
    return JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]');
  } catch {
    return [];
  }
};
const loadMirroring = () => {
  try {
    return localStorage.getItem(MIRROR_KEY) !== 'off';
  } catch {
    return true;
  }
};

// The Politicians screen exposes one chip row; each chip maps onto the
// party/chamber/followed axes that filterPoliticians understands.
const FILTER_MAP = {
  all: {},
  senate: { chamber: 'senate' },
  house: { chamber: 'house' },
  dem: { party: 'dem' },
  rep: { party: 'rep' },
  followed: { followedOnly: true },
};

const frameStyle = {
  position: 'relative',
  width: 430,
  maxWidth: '100%',
  minHeight: '100vh',
  margin: '0 auto',
  background: COLOR.bg,
  fontFamily: FONT.archivo,
  color: COLOR.text,
  overflow: 'hidden',
  fontVariantNumeric: 'tabular-nums',
};

export default function App() {
  // auth gate. getUser() is an optimistic sync snapshot (authoritative in demo
  // mode, null in Supabase mode until the real session resolves below).
  const [user, setUser] = useState(() => auth.getUser());
  const [authReady, setAuthReady] = useState(!hasSupabase);

  // data
  const [trades, setTrades] = useState([]);
  const [source, setSource] = useState('live');
  const [generatedAt, setGeneratedAt] = useState(() => Date.now());
  const [coverage, setCoverage] = useState('');
  const [priceMap, setPriceMap] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // navigation + view state
  const [tab, setTab] = useState('home');
  const [metric, setMetric] = useState('roi');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedName, setSelectedName] = useState(null);
  const [followedNames, setFollowedNames] = useState(loadFollowed);

  // alpaca
  const [connected, setConnected] = useState(alpaca.isConnected());
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  // `history` carries the range it was fetched for, so "loading" is derived
  // rather than tracked separately.
  const [history, setHistory] = useState(null);
  const [period, setPeriod] = useState('1M');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [orderState, setOrderState] = useState({});
  const [mirroringOn, setMirroringOnRaw] = useState(loadMirroring);
  const [mirrorAmount, setMirrorAmountRaw] = useState(loadMirrorAmount);

  const setMirrorAmount = useCallback((next) => {
    const value = clampAmount(next);
    setMirrorAmountRaw(value);
    try {
      localStorage.setItem(AMOUNT_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  const setMirroringOn = useCallback((next) => {
    setMirroringOnRaw((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem(MIRROR_KEY, value ? 'on' : 'off');
      } catch {
        /* ignore */
      }
      return value;
    });
  }, []);

  /* ----- resolve auth session (Supabase) ----- */
  useEffect(() => {
    let alive = true;
    auth.initAuth().then((u) => {
      if (!alive) return;
      setUser(u);
      setAuthReady(true);
    });
    const unsubscribe = auth.onAuthChange((u) => {
      if (alive) setUser(u);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  /* ----- load congressional trades + prices ----- */
  // `reloadTick` lets the error state offer a real retry instead of forcing an
  // app restart.
  const [reloadTick, setReloadTick] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { trades, source, generatedAt, coverage } = await getTrades({ force: reloadTick > 0 });
        if (!alive) return;
        setTrades(trades);
        setSource(source);
        setGeneratedAt(generatedAt);
        setCoverage(coverage || '');
        setLoading(false);

        const symbols = trades.map((t) => t.symbol);
        const pm = await getPriceMap(symbols, { force: reloadTick > 0 });
        if (!alive) return;
        setPriceMap(pm);
        setPricesLoading(false);
      } catch {
        if (!alive) return;
        setError('Failed to load congressional trades.');
        setLoading(false);
        setPricesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadTick]);

  /* ----- alpaca: account + positions ----- */
  const refreshPositions = useCallback(() => {
    if (!alpaca.isConnected()) return;
    setPositionsLoading(true);
    alpaca
      .getPositions()
      .then((p) => setPositions(Array.isArray(p) ? p : []))
      .catch(() => {
        /* proxy may be unavailable; keep the last known list */
      })
      .finally(() => setPositionsLoading(false));
  }, []);

  useEffect(() => {
    if (!alpaca.isConnected()) return;
    alpaca
      .getAccount()
      .then((a) => {
        setAccount(a);
        setConnected(true);
      })
      .catch(() => {
        /* keep creds; account fetch may fail if the proxy isn't running */
      })
      .finally(refreshPositions);
  }, [refreshPositions]);

  /* ----- alpaca: equity curve for the selected period ----- */
  useEffect(() => {
    // History is cleared on disconnect, so there's nothing to do here when the
    // account isn't linked.
    if (!connected) return;
    let alive = true;
    alpaca
      .getPortfolioHistory(period)
      .then((h) => {
        if (alive) setHistory({ range: period, equity: h?.equity ?? [] });
      })
      .catch(() => {
        if (alive) setHistory({ range: period, equity: [] });
      });
    return () => {
      alive = false;
    };
  }, [connected, period]);

  // Derived: the chart is stale whenever the fetched range trails the selection.
  const historyLoading = connected && history?.range !== period;

  // Manual data refresh (SourceLine tap): re-runs the load effect with force,
  // so caches and the module-cached snapshot are bypassed.
  const refreshData = useCallback(() => {
    setLoading(true);
    setError(null);
    setPricesLoading(true);
    setReloadTick((t) => t + 1);
  }, []);

  /* ----- derived data ----- */
  const politicians = useMemo(() => buildPoliticians(trades, priceMap), [trades, priceMap]);
  const politicianByName = useMemo(() => new Map(politicians.map((p) => [p.name, p])), [politicians]);

  const visiblePoliticians = useMemo(() => {
    const { party = 'all', chamber = 'both', followedOnly } = FILTER_MAP[filter] || {};
    let list = filterPoliticians(politicians, { party, chamber, search });
    if (followedOnly) list = list.filter((p) => followedNames.includes(p.name));
    return sortPoliticians(list, sort, metric);
  }, [politicians, filter, search, sort, metric, followedNames]);

  const partyReturn = useMemo(() => buildPartyReturn(politicians), [politicians]);
  const disclosures = useMemo(
    () => buildFeed(trades, politicians, priceMap, { ticker: '', ftype: 'all', fsize: 'any', period: 'all' }),
    [trades, politicians, priceMap],
  );

  const selected = selectedName ? politicianByName.get(selectedName) : null;
  const profile = useMemo(() => buildProfile(selected, priceMap, metric), [selected, priceMap, metric]);
  const followed = useMemo(
    () => followedNames.map((n) => politicianByName.get(n)).filter(Boolean),
    [followedNames, politicianByName],
  );

  /* ----- navigation, backed by browser history ----- */
  // Every in-app navigation pushes a history entry, so the browser/Android
  // back button walks back through screens instead of exiting the app.
  // popstate-driven changes must NOT push again — hence the split between
  // navigate() (user taps) and the listener (back/forward).
  const navigate = useCallback((nextTab, name = null) => {
    setTab(nextTab);
    setSelectedName(name);
    try {
      window.history.pushState({ tab: nextTab, name }, '');
    } catch {
      /* history may be unavailable in odd embeds; nav still works */
    }
  }, []);

  useEffect(() => {
    try {
      window.history.replaceState({ tab: 'home', name: null }, '');
    } catch {
      /* ignore */
    }
    const onPop = (e) => {
      const s = e.state || { tab: 'home', name: null };
      setTab(s.tab || 'home');
      setSelectedName(s.name || null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* ----- handlers ----- */
  const openProfile = useCallback(
    (pol) => {
      if (!pol) return;
      navigate('profile', pol.name);
    },
    [navigate],
  );

  const openProfileByName = useCallback(
    (name) => {
      if (politicianByName.has(name)) navigate('profile', name);
    },
    [politicianByName, navigate],
  );

  const toggleFollowName = useCallback((name) => {
    if (!name) return;
    setFollowedNames((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      try {
        localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleFollow = useCallback(() => toggleFollowName(selectedName), [toggleFollowName, selectedName]);

  const onShare = useCallback(() => {
    const text = selected ? `${selected.name} on Slipstream — catch the current.` : 'Slipstream';
    if (navigator.share) navigator.share({ title: 'Slipstream', text }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  }, [selected]);

  const onConnect = useCallback(
    async (key, secret) => {
      setConnecting(true);
      setConnectError(null);
      try {
        const acct = await alpaca.connect(key, secret);
        setAccount(acct);
        setConnected(true);
        refreshPositions();
      } catch (e) {
        setConnectError(e.message || 'Connection failed. Check your paper API key & secret.');
      } finally {
        setConnecting(false);
      }
    },
    [refreshPositions],
  );

  const onDisconnect = useCallback(() => {
    alpaca.clearCreds();
    setConnected(false);
    setAccount(null);
    setPositions([]);
    setHistory(null);
    setConnectError(null);
  }, []);

  const onRefreshAccount = useCallback(() => {
    alpaca.getAccount().then(setAccount).catch(() => {});
    refreshPositions();
  }, [refreshPositions]);

  const onMirror = useCallback(
    (pol, trade) => {
      const key = `${pol.name}:${trade.symbol}`;
      setOrderState((s) => ({ ...s, [key]: 'pending' }));
      alpaca
        .placeOrder({ symbol: trade.symbol, side: 'buy', notional: mirrorAmount })
        .then(() => {
          setOrderState((s) => ({ ...s, [key]: 'done' }));
          onRefreshAccount();
        })
        .catch(() => setOrderState((s) => ({ ...s, [key]: 'error' })));
    },
    [onRefreshAccount, mirrorAmount],
  );

  const onSignOut = useCallback(async () => {
    if (!window.confirm('Sign out of Slipstream?')) return;
    await auth.signOut();
    setUser(null);
  }, []);

  /* ----- render ----- */
  const updatedLabel = `updated ${timeAgo(new Date(generatedAt).toISOString()).toLowerCase()}`.replace(
    'updated today',
    'updated just now',
  );

  if (!authReady) {
    return (
      <div style={frameStyle}>
        <Blooms />
        <StatusBar />
        <LoadingState />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={frameStyle}>
        <Blooms />
        <StatusBar />
        {/* The welcome screen quotes politician/trade counts, so it needs the
            same disclosure as the rest of the app. */}
        <div style={{ position: 'relative', zIndex: 5, padding: '6px 18px 0' }}>
          <DemoBanner source={source} />
        </div>
        <Auth onAuthed={setUser} polCount={politicians.length} tradeCount={trades.length} />
      </div>
    );
  }

  return (
    <div style={frameStyle}>
      <Blooms />
      <StatusBar />

      <div style={{ position: 'relative', zIndex: 4, padding: '6px 18px 120px' }}>
        <DemoBanner source={source} />
        {loading && <LoadingState />}
        {error && (
          <div style={{ padding: 32, textAlign: 'center', fontFamily: FONT.archivo }}>
            <div style={{ color: COLOR.red, fontWeight: 600, fontSize: 13 }}>{error}</div>
            <button
              onClick={() => {
                // Reset to the loading state here (not inside the effect) so
                // the effect body stays free of synchronous setState calls.
                setLoading(true);
                setError(null);
                setReloadTick((t) => t + 1);
              }}
              style={{ marginTop: 14, padding: '11px 24px', borderRadius: 13, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, background: 'linear-gradient(135deg,#F2D675,#D4AF37)', color: '#090909' }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="view" key={tab}>
            {tab === 'home' && (
              <Home
                user={user}
                connected={connected}
                account={account}
                history={history}
                historyLoading={historyLoading}
                period={period}
                setPeriod={setPeriod}
                followed={followed}
                orderState={orderState}
                disclosures={disclosures}
                source={source}
                coverage={coverage}
                updatedLabel={updatedLabel}
                polCount={politicians.length}
                tradeCount={trades.length}
                onGoPoliticians={() => navigate('leaders')}
                onGoCopy={() => navigate('copy')}
                onGoPortfolio={() => navigate('portfolio')}
                onOpenProfile={openProfile}
                onOpenProfileByName={openProfileByName}
                onRefresh={refreshData}
              />
            )}

            {tab === 'leaders' && (
              <Politicians
                politicians={visiblePoliticians}
                totalCount={politicians.length}
                search={search}
                setSearch={setSearch}
                filter={filter}
                setFilter={setFilter}
                sort={sort}
                setSort={setSort}
                sortOpen={sortOpen}
                toggleSortOpen={() => setSortOpen((v) => !v)}
                metric={metric}
                setMetric={setMetric}
                partyReturn={partyReturn}
                followedNames={followedNames}
                onToggleFollow={toggleFollowName}
                onOpen={openProfile}
                pricesLoading={pricesLoading}
              />
            )}

            {tab === 'copy' && (
              <Copy
                connected={connected}
                account={account}
                positions={positions}
                connecting={connecting}
                connectError={connectError}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                onRefresh={onRefreshAccount}
                followed={followed}
                onMirror={onMirror}
                orderState={orderState}
                onOpenProfile={openProfile}
                mirroringOn={mirroringOn}
                setMirroringOn={setMirroringOn}
                mirrorAmount={mirrorAmount}
                setMirrorAmount={setMirrorAmount}
                onGoPoliticians={() => navigate('leaders')}
              />
            )}

            {tab === 'portfolio' && (
              <PortfolioView
                connected={connected}
                account={account}
                positions={positions}
                positionsLoading={positionsLoading}
                history={history}
                historyLoading={historyLoading}
                period={period}
                setPeriod={setPeriod}
                followed={followed}
                onRefresh={onRefreshAccount}
                onGoCopy={() => navigate('copy')}
              />
            )}

            {tab === 'account' && (
              <Account
                user={user}
                connected={connected}
                account={account}
                followedCount={followedNames.length}
                tradeCount={trades.length}
                polCount={politicians.length}
                source={source}
                onDisconnect={onDisconnect}
                onGoCopy={() => navigate('copy')}
                onSignOut={onSignOut}
              />
            )}

            {tab === 'profile' && (
              <Profile
                profile={profile}
                onBack={() => navigate('leaders')}
                onToggleMetric={() => setMetric((m) => (m === 'roi' ? 'sp' : 'roi'))}
                isFollowed={selectedName ? followedNames.includes(selectedName) : false}
                onToggleFollow={toggleFollow}
                onShare={onShare}
              />
            )}
          </div>
        )}
      </div>

      <BottomNav tab={tab === 'profile' ? 'leaders' : tab} setTab={navigate} />
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.10)', borderTop: `2px solid ${COLOR.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12, color: COLOR.dim, letterSpacing: '0.08em' }}>LOADING TRADES…</span>
    </div>
  );
}
