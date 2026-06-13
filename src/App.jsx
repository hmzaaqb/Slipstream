import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getTrades,
  getPriceMap,
  buildPoliticians,
  filterPoliticians,
  sortPoliticians,
  buildPartySentiment,
  buildSectors,
  buildHotItems,
  buildFeed,
  buildProfile,
  timeAgo,
} from './api';
import * as alpaca from './alpaca';
import * as auth from './auth';
import { hasSupabase } from './supabase';
import Auth from './components/Auth';
import { Blooms, StatusBar, Header, Ticker, PartySentiment, BottomNav } from './components/Shell';
import Leaders from './components/Leaders';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Copy from './components/Copy';
import { FONT, COLOR } from './ui/styles';

const FOLLOW_KEY = 'slipstream.followed';
const loadFollowed = () => {
  try {
    return JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]');
  } catch {
    return [];
  }
};

export default function App() {
  // auth gate. getUser() is an optimistic sync snapshot (authoritative in demo
  // mode, null in Supabase mode until the real session resolves below).
  const [user, setUser] = useState(() => auth.getUser());
  // In backend mode, wait for the session to resolve before deciding what to
  // render (avoids a flash of the sign-in screen for already-logged-in users).
  const [authReady, setAuthReady] = useState(!hasSupabase);

  // data
  const [trades, setTrades] = useState([]);
  const [source, setSource] = useState('live');
  const [generatedAt, setGeneratedAt] = useState(() => Date.now());
  const [priceMap, setPriceMap] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // navigation + view state
  const [tab, setTab] = useState('leaders');
  const [metric, setMetric] = useState('roi');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [party, setParty] = useState('all');
  const [chamber, setChamber] = useState('both');
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [ftype, setFtype] = useState('all');
  const [fsize, setFsize] = useState('any');
  const [feedTicker, setFeedTicker] = useState('');
  const [selectedName, setSelectedName] = useState(null);
  const [followedNames, setFollowedNames] = useState(loadFollowed);

  // alpaca
  const [connected, setConnected] = useState(alpaca.isConnected());
  const [account, setAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [orderState, setOrderState] = useState({});

  /* ----- resolve auth session (Supabase) ----- */
  useEffect(() => {
    let alive = true;
    auth.initAuth().then((u) => {
      if (!alive) return;
      setUser(u);
      setAuthReady(true);
    });
    // React to sign-in/out, token refresh, and OAuth redirects.
    const unsubscribe = auth.onAuthChange((u) => {
      if (alive) setUser(u);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  /* ----- load data ----- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { trades, source, generatedAt } = await getTrades();
        if (!alive) return;
        setTrades(trades);
        setSource(source);
        setGeneratedAt(generatedAt);
        setLoading(false);

        const symbols = trades.map((t) => t.symbol);
        const pm = await getPriceMap(symbols);
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
  }, []);

  /* ----- restore alpaca session ----- */
  useEffect(() => {
    if (!alpaca.isConnected()) return;
    alpaca
      .getAccount()
      .then((a) => {
        setAccount(a);
        setConnected(true);
      })
      .catch(() => {
        /* keep creds; account fetch may fail if proxy not running */
      });
  }, []);

  /* ----- derived data ----- */
  const politicians = useMemo(() => buildPoliticians(trades, priceMap), [trades, priceMap]);
  const politicianByName = useMemo(() => new Map(politicians.map((p) => [p.name, p])), [politicians]);

  const visiblePoliticians = useMemo(() => {
    const filtered = filterPoliticians(politicians, { party, chamber, search });
    return sortPoliticians(filtered, sort, metric);
  }, [politicians, party, chamber, search, sort, metric]);

  const partySentiment = useMemo(() => buildPartySentiment(politicians), [politicians]);

  const leader = useMemo(() => {
    const ranked = sortPoliticians(politicians, 'roi', 'roi');
    return ranked.find((p) => p.roi != null) || ranked[0] || null;
  }, [politicians]);

  const sectors = useMemo(() => buildSectors(trades), [trades]);
  const hotItems = useMemo(() => buildHotItems(trades, priceMap), [trades, priceMap]);
  const feedTrades = useMemo(
    () => buildFeed(trades, politicians, priceMap, { ticker: feedTicker, ftype, fsize, period }),
    [trades, politicians, priceMap, feedTicker, ftype, fsize, period],
  );

  const selected = selectedName ? politicianByName.get(selectedName) : null;
  const profile = useMemo(() => buildProfile(selected, priceMap, metric), [selected, priceMap, metric]);
  const followed = useMemo(
    () => followedNames.map((n) => politicianByName.get(n)).filter(Boolean),
    [followedNames, politicianByName],
  );

  /* ----- handlers ----- */
  const onPick = useCallback((group, id) => {
    const setters = { party: setParty, chamber: setChamber, sort: setSort, period: setPeriod, ftype: setFtype, fsize: setFsize };
    setters[group]?.(id);
  }, []);

  const openProfile = useCallback((pol) => {
    if (!pol) return;
    setSelectedName(pol.name);
    setTab('profile');
  }, []);

  const openProfileByName = useCallback(
    (name) => {
      if (politicianByName.has(name)) {
        setSelectedName(name);
        setTab('profile');
      }
    },
    [politicianByName],
  );

  const toggleFollow = useCallback(() => {
    if (!selectedName) return;
    setFollowedNames((prev) => {
      const next = prev.includes(selectedName) ? prev.filter((n) => n !== selectedName) : [...prev, selectedName];
      try {
        localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [selectedName]);

  const onShare = useCallback(() => {
    const text = selected ? `${selected.name} on Slipstream — catch the current.` : 'Slipstream';
    if (navigator.share) navigator.share({ title: 'Slipstream', text }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  }, [selected]);

  const onConnect = useCallback(async (key, secret) => {
    setConnecting(true);
    setConnectError(null);
    try {
      const acct = await alpaca.connect(key, secret);
      setAccount(acct);
      setConnected(true);
    } catch (e) {
      setConnectError(e.message || 'Connection failed. Check your paper API key & secret.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const onDisconnect = useCallback(() => {
    alpaca.clearCreds();
    setConnected(false);
    setAccount(null);
    setConnectError(null);
  }, []);

  const onRefreshAccount = useCallback(() => {
    alpaca.getAccount().then(setAccount).catch(() => {});
  }, []);

  const onMirror = useCallback((pol, trade) => {
    const key = `${pol.name}:${trade.symbol}`;
    setOrderState((s) => ({ ...s, [key]: 'pending' }));
    alpaca
      .placeOrder({ symbol: trade.symbol, side: 'buy', notional: 100 })
      .then(() => {
        setOrderState((s) => ({ ...s, [key]: 'done' }));
        onRefreshAccount();
      })
      .catch(() => setOrderState((s) => ({ ...s, [key]: 'error' })));
  }, [onRefreshAccount]);

  const onSignOut = useCallback(async () => {
    if (!window.confirm('Sign out of Slipstream?')) return;
    await auth.signOut();
    setUser(null);
  }, []);

  /* ----- render ----- */
  const updatedLabel = `updated ${timeAgo(new Date(generatedAt).toISOString()).toLowerCase()}`.replace('updated today', 'updated just now');

  // Still confirming the session (backend mode): hold on the glass shell with a
  // spinner so logged-in users don't flash the sign-in screen.
  if (!authReady) {
    return (
      <div style={{ position: 'relative', width: 430, maxWidth: '100%', minHeight: '100vh', margin: '0 auto', background: COLOR.bg, fontFamily: FONT.archivo, overflow: 'hidden', color: COLOR.text }}>
        <Blooms />
        <StatusBar />
        <LoadingState />
      </div>
    );
  }

  // Not signed in: show the auth gate inside the same glass shell.
  if (!user) {
    return (
      <div style={{ position: 'relative', width: 430, maxWidth: '100%', minHeight: '100vh', margin: '0 auto', background: COLOR.bg, fontFamily: FONT.archivo, overflow: 'hidden', color: COLOR.text }}>
        <Blooms />
        <StatusBar />
        <Auth onAuthed={setUser} polCount={politicians.length} tradeCount={trades.length} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: 430, maxWidth: '100%', minHeight: '100vh', margin: '0 auto', background: COLOR.bg, fontFamily: FONT.archivo, overflow: 'hidden', color: COLOR.text }}>
      <Blooms />
      <StatusBar />

      <div style={{ position: 'relative', zIndex: 4, padding: '8px 18px 140px' }}>
        <Header polCount={politicians.length} tradeCount={trades.length} source={source} updatedLabel={updatedLabel} user={user} onSignOut={onSignOut} />
        <Ticker polCount={politicians.length} leaderName={leader?.name} leaderRoi={leader?.roi} winRate={leader?.winRate} />
        <PartySentiment dem={partySentiment.dem} rep={partySentiment.rep} />

        {loading && <LoadingState />}
        {error && <div style={{ padding: 32, textAlign: 'center', color: COLOR.red, fontFamily: FONT.mono, fontSize: 13 }}>{error}</div>}

        {!loading && !error && (
          <div className="view" key={tab}>
            {tab === 'leaders' && (
          <Leaders
            politicians={visiblePoliticians}
            metric={metric}
            setMetric={setMetric}
            search={search}
            setSearch={setSearch}
            filtersOpen={filtersOpen}
            toggleFilters={() => setFiltersOpen((v) => !v)}
            party={party}
            chamber={chamber}
            sort={sort}
            onPick={onPick}
            onSelect={openProfile}
            pricesLoading={pricesLoading}
          />
        )}

            {tab === 'feed' && (
          <Feed
            sectors={sectors}
            hotItems={hotItems}
            feedTrades={feedTrades}
            ticker={feedTicker}
            setTicker={setFeedTicker}
            period={period}
            ftype={ftype}
            fsize={fsize}
            onPick={onPick}
            onSelectPolitician={openProfileByName}
          />
        )}

            {tab === 'profile' && (
          <Profile
            profile={profile}
            onBack={() => setTab('leaders')}
            onToggleMetric={() => setMetric((m) => (m === 'roi' ? 'sp' : 'roi'))}
            isFollowed={selectedName ? followedNames.includes(selectedName) : false}
            onToggleFollow={toggleFollow}
            onShare={onShare}
          />
        )}

            {tab === 'copy' && (
          <Copy
            connected={connected}
            account={account}
            connecting={connecting}
            connectError={connectError}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            onRefresh={onRefreshAccount}
            followed={followed}
            onMirror={onMirror}
            orderState={orderState}
            onOpenProfile={openProfile}
          />
        )}
          </div>
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.12)', borderTop: `2px solid ${COLOR.pink}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 12, color: 'rgba(243,241,248,0.5)', fontFamily: FONT.mono, letterSpacing: '0.08em' }}>LOADING TRADES…</span>
    </div>
  );
}
