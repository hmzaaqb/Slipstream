// Onboarding flow ported from the "Slipstream Signup" design: Welcome →
// Sign up / Sign in → "You're in." — wired to the local auth layer (auth.js).
import { useState } from 'react';
import { FONT, COLOR, glass } from '../ui/styles';
import { Bolt, BackIcon } from '../ui/icons';
import * as auth from '../auth';
import { LegalModal, LegalLink, LegalFooter } from './Legal';

/* ---------- shared styles (from the design) ---------- */

const inputStyle = (focused) => ({
  width: '100%',
  padding: '16px 18px',
  borderRadius: 18,
  background: 'linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${focused ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.13)'}`,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 2px 6px rgba(0,0,0,0.2)',
  color: '#F7F7F5',
  fontFamily: FONT.archivo,
  fontWeight: 600,
  fontSize: 15,
  transition: 'border-color .25s ease',
});

const pinkCta = {
  width: '100%',
  padding: 18,
  cursor: 'pointer',
  border: 'none',
  borderRadius: 20,
  background: 'linear-gradient(160deg,#F2D675,#D4AF37)',
  color: '#fff',
  fontFamily: FONT.black,
  fontSize: 15,
  letterSpacing: '1.5px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45),inset 0 -2px 4px rgba(0,0,0,0.2),0 14px 34px rgba(212,175,55,0.45)',
};

const glassBtn = {
  width: '100%',
  padding: 16,
  cursor: 'pointer',
  borderRadius: 18,
  background: 'linear-gradient(160deg,rgba(255,255,255,0.11),rgba(255,255,255,0.04))',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.16)',
  color: '#F7F7F5',
  fontFamily: FONT.black,
  fontSize: 14,
  letterSpacing: '0.5px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3),0 10px 26px rgba(0,0,0,0.4)',
};

const whiteBtn = {
  ...glassBtn,
  background: 'linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,255,255,0.78))',
  border: '1px solid rgba(255,255,255,0.6)',
  color: '#0B0B10',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9),0 10px 26px rgba(0,0,0,0.4)',
};

const backBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 42,
  height: 42,
  cursor: 'pointer',
  borderRadius: 15,
  background: 'linear-gradient(160deg,rgba(255,255,255,0.11),rgba(255,255,255,0.04))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
  color: '#F7F7F5',
};

const screenWrap = {
  position: 'relative',
  zIndex: 4,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100vh - 60px)',
  padding: '18px 26px 36px',
};

const AppleLogo = ({ size = 17 }) => (
  <svg width={size} height={size + 3} viewBox="0 0 17 20" fill="none">
    <path d="M14.2 10.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.86-1.6.02-3.1 1-4 2.4-1.7 3-0.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2-.05 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.78 1.3-.02 2.2-1.2 3-2.4.94-1.4 1.3-2.7 1.4-2.8-.03-.01-2.6-1-2.7-3.9zM11.8 3.1c.66-.8 1.1-1.9 1-3.1-.95.04-2.1.64-2.8 1.4-.6.7-1.2 1.85-1 2.94 1.06.08 2.14-.54 2.8-1.3z" fill="currentColor" />
  </svg>
);

const GoogleLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18">
    <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4" />
    <path d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.92-2.26a5.4 5.4 0 0 1-8.04-2.84H1v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H1a9 9 0 0 0 0 8.08l2.96-2.33z" fill="#FBBC05" />
    <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 1 4.96l2.96 2.33A5.36 5.36 0 0 1 9 3.58z" fill="#EA4335" />
  </svg>
);

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
      <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '2px', color: 'rgba(247,247,245,0.35)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
    </div>
  );
}

function Note({ error, info }) {
  if (!error && !info) return null;
  return (
    <div style={{ marginTop: 14, fontFamily: FONT.mono, fontSize: 12, lineHeight: 1.6, letterSpacing: '0.5px', color: error ? COLOR.red : 'rgba(247,247,245,0.6)' }}>
      {error || info}
    </div>
  );
}

/* ---------- screens ---------- */

function Welcome({ go, polCount }) {
  const features = [
    {
      tint: 'rgba(212,175,55,0.14)', border: 'rgba(212,175,55,0.4)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="9" width="3.4" height="6" rx="1" fill="#D4AF37" /><rect x="6.3" y="4" width="3.4" height="11" rx="1" fill="#D4AF37" /><rect x="11.1" y="6.5" width="3.4" height="8.5" rx="1" fill="#D4AF37" />
        </svg>
      ),
      title: `${polCount || 'Every'} politician${polCount === 1 ? '' : 's'} ranked`,
      sub: 'Live leaderboard by ROI, win rate & volume',
    },
    {
      tint: 'rgba(212,175,55,0.16)', border: 'rgba(212,175,55,0.45)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="11" r="2" fill="#F2D675" /><path d="M4 7a5.5 5.5 0 0 1 8 0M2 4.5a9 9 0 0 1 12 0" stroke="#F2D675" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
      // Was "Every disclosure streamed the moment it drops" — there is no
      // streaming and no alerting; trades are fetched once per app launch.
      // Restore that wording only once Phase 2 (push alerts) actually ships.
      title: 'Disclosure feed',
      sub: 'Congressional filings, sorted and searchable',
    },
    {
      tint: 'rgba(66,201,137,0.13)', border: 'rgba(66,201,137,0.4)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="8" height="8" rx="2" stroke="#42C989" strokeWidth="1.4" /><rect x="6" y="6" width="8" height="8" rx="2" fill="#050505" stroke="#42C989" strokeWidth="1.4" />
        </svg>
      ),
      // Was "automatically" — every mirror is a manual tap plus a confirmation.
      // See Phase 4: "automatically" becomes true only when auto-execute ships.
      title: 'Copy their trades',
      sub: 'Mirror a politician’s buys in one tap via Alpaca paper',
    },
  ];

  return (
    <div style={{ ...screenWrap, padding: '24px 26px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 34 }}>
        <div style={{ width: 108, height: 108, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'floaty 5s ease-in-out infinite', ...glass('strong', { borderRadius: 32, border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4),inset 0 -2px 5px rgba(0,0,0,0.3),0 22px 50px rgba(212,175,55,0.35)' }) }}>
          <Bolt width={46} height={58} gradId="wlt" style={{ filter: 'drop-shadow(0 5px 14px rgba(212,175,55,0.6))' }} />
        </div>
      </div>

      <h1 style={{ margin: '30px 0 0', textAlign: 'center', fontFamily: FONT.black, fontWeight: 900, fontSize: 52, lineHeight: 0.88, letterSpacing: '-2.4px', WebkitTextStroke: '0.6px rgba(255,255,255,0.18)', background: 'linear-gradient(100deg,#FFFFFF 28%,#E8CA72 62%,#F2D675 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Slipstream</h1>
      <div style={{ textAlign: 'center', fontFamily: FONT.mono, fontSize: 11, letterSpacing: '5px', color: 'rgba(247,247,245,0.45)', marginTop: 14 }}>CATCH THE CURRENT</div>

      <div style={{ textAlign: 'center', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 16, lineHeight: 1.55, color: 'rgba(247,247,245,0.72)', margin: '26px auto 0', maxWidth: 330 }}>
        Congress discloses every stock trade.<br />We track all of them — so you can ride the same current.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 30 }}>
        {features.map((f) => (
          <div key={f.title} className="lg" style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '15px 17px', borderRadius: 20, ...glass('mid', { borderRadius: 20 }) }}>
            <div style={{ width: 42, height: 42, flex: 'none', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.tint, border: `1px solid ${f.border}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>{f.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT.black, fontSize: 15, letterSpacing: '-0.2px' }}>{f.title}</div>
              <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12.5, color: 'rgba(247,247,245,0.55)', marginTop: 3 }}>{f.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <button onClick={() => go('signup')} style={{ ...pinkCta, marginTop: 28, fontSize: 16, borderRadius: 20 }}>GET STARTED</button>
      <button onClick={() => go('signin')} style={{ ...glassBtn, marginTop: 12, padding: 17, letterSpacing: '1.5px', borderRadius: 20 }}>I ALREADY HAVE AN ACCOUNT</button>
      <div style={{ textAlign: 'center', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px', color: 'rgba(247,247,245,0.35)', marginTop: 18 }}>Free forever · No card required</div>
      <LegalFooter style={{ marginTop: 14 }} />
    </div>
  );
}

function SocialButtons({ row, onSocial }) {
  if (row) {
    return (
      <div style={{ display: 'flex', gap: 11, marginTop: 22 }}>
        <button onClick={() => onSocial('Apple')} style={{ ...whiteBtn, flex: 1, padding: 15, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}><AppleLogo size={15} />Apple</button>
        <button onClick={() => onSocial('Google')} style={{ ...glassBtn, flex: 1, padding: 15, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}><GoogleLogo size={16} />Google</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 26 }}>
      <button onClick={() => onSocial('Apple')} style={{ ...whiteBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11 }}><AppleLogo />Continue with Apple</button>
      <button onClick={() => onSocial('Google')} style={{ ...glassBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11 }}><GoogleLogo />Continue with Google</button>
    </div>
  );
}

function SignUp({ go, onDone, openLegal, polCount, tradeCount }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSocial = async (provider) => {
    setError(null);
    setInfo(null);
    if (!agreed) return setError('Please accept the Terms & Privacy Policy to continue.');
    try {
      await auth.signInWithProvider(provider); // redirects when backend is configured
    } catch (err) {
      setInfo(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (name.trim().length < 2) return setError('Enter your full name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (!agreed) return setError('Please accept the Terms & Privacy Policy to continue.');
    setBusy(true);
    try {
      const { user, needsConfirmation } = await auth.signUp({ name, email, password });
      if (needsConfirmation) {
        setInfo(`Almost there — we sent a confirmation link to ${email.trim()}. Verify it, then sign in.`);
        setBusy(false);
        return;
      }
      onDone(user);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={screenWrap}>
      <button onClick={() => go('welcome')} style={backBtn}><BackIcon /></button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
        <Bolt width={24} height={30} gradId="slt" style={{ filter: 'drop-shadow(0 4px 10px rgba(212,175,55,0.55))' }} />
        <span style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '4px', color: 'rgba(247,247,245,0.45)' }}>CREATE ACCOUNT</span>
      </div>
      <h1 style={{ margin: '14px 0 0', fontFamily: FONT.black, fontSize: 38, lineHeight: 0.95, letterSpacing: '-1.6px' }}>
        Join the<br />
        <span style={{ background: 'linear-gradient(100deg,#E8CA72,#F2D675)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>slipstream</span>
      </h1>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 14, color: 'rgba(247,247,245,0.55)', marginTop: 12 }}>
        Track {polCount || 'all'} politicians and {tradeCount ? tradeCount.toLocaleString('en-US') : 'their'} trades in 30 seconds.
      </div>

      <SocialButtons onSocial={onSocial} />
      <Divider label="OR WITH EMAIL" />

      <form onSubmit={submit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 22 }}>
          <input type="text" placeholder="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} style={inputStyle(focused === 'name')} />
          <input type="email" placeholder="Email address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} style={inputStyle(focused === 'email')} />
          <input type="password" placeholder="Password (8+ characters)" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)} style={inputStyle(focused === 'pw')} />
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 18, cursor: 'pointer', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 12, lineHeight: 1.55, color: 'rgba(247,247,245,0.6)' }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ flex: 'none', width: 18, height: 18, marginTop: 1, accentColor: COLOR.goldSoft, cursor: 'pointer' }}
          />
          <span>
            I agree to the <LegalLink doc="terms" onOpen={openLegal}>Terms of Service</LegalLink> and{' '}
            <LegalLink doc="privacy" onOpen={openLegal}>Privacy Policy</LegalLink>, and I understand
            Slipstream is <LegalLink doc="disclaimer" onOpen={openLegal}>not investment advice</LegalLink>.
          </span>
        </label>

        <Note error={error} info={info} />

        <button type="submit" disabled={busy} style={{ ...pinkCta, marginTop: 16, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'ONE MOMENT…' : 'CREATE ACCOUNT'}
        </button>
      </form>

      <div style={{ flex: 1 }} />
      <div style={{ textAlign: 'center', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 14, color: 'rgba(247,247,245,0.5)', marginTop: 20 }}>
        Already have an account? <span onClick={() => go('signin')} style={{ color: '#E8CA72', fontWeight: 800, cursor: 'pointer' }}>Sign in</span>
      </div>
    </div>
  );
}

function SignIn({ go, onDone, openLegal }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSocial = async (provider) => {
    setError(null);
    setInfo(null);
    try {
      await auth.signInWithProvider(provider); // redirects when backend is configured
    } catch (err) {
      setInfo(err.message);
    }
  };

  const onForgot = async () => {
    setError(null);
    setInfo(null);
    try {
      await auth.resetPassword(email);
      setInfo(`If an account exists for ${email.trim()}, a reset link is on its way.`);
    } catch (err) {
      setInfo(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    try {
      onDone(await auth.signIn({ email, password }));
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={screenWrap}>
      <button onClick={() => go('welcome')} style={backBtn}><BackIcon /></button>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
        <div style={{ width: 84, height: 84, borderRadius: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', ...glass('strong', { borderRadius: 26, border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4),0 18px 40px rgba(212,175,55,0.3)' }) }}>
          <Bolt width={36} height={45} gradId="silt" />
        </div>
      </div>

      <h1 style={{ margin: '26px 0 0', textAlign: 'center', fontFamily: FONT.black, fontSize: 34, lineHeight: 1, letterSpacing: '-1.2px' }}>Welcome back</h1>
      <div style={{ textAlign: 'center', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 14, color: 'rgba(247,247,245,0.55)', marginTop: 10 }}>The current kept moving while you were away.</div>

      <form onSubmit={submit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 30 }}>
          <input type="email" placeholder="Email address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} style={inputStyle(focused === 'email')} />
          <input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)} style={inputStyle(focused === 'pw')} />
        </div>
        <div style={{ textAlign: 'right', fontFamily: FONT.archivo, fontWeight: 700, fontSize: 13, color: '#E8CA72', marginTop: 12, cursor: 'pointer' }} onClick={onForgot}>
          Forgot password?
        </div>

        <Note error={error} info={info} />

        <button type="submit" disabled={busy} style={{ ...pinkCta, marginTop: 20, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'ONE MOMENT…' : 'SIGN IN'}
        </button>
      </form>

      <Divider label="OR" />
      <SocialButtons row onSocial={onSocial} />

      <div style={{ flex: 1 }} />
      <div style={{ textAlign: 'center', fontFamily: FONT.archivo, fontWeight: 600, fontSize: 14, color: 'rgba(247,247,245,0.5)', marginTop: 20 }}>
        New here? <span onClick={() => go('signup')} style={{ color: '#E8CA72', fontWeight: 800, cursor: 'pointer' }}>Create an account</span>
      </div>
      <div style={{ textAlign: 'center', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.5px', color: 'rgba(247,247,245,0.35)', marginTop: 12 }}>
        <LegalLink doc="disclaimer" onOpen={openLegal}>Disclaimer</LegalLink>
        {'  ·  '}
        <LegalLink doc="terms" onOpen={openLegal}>Terms</LegalLink>
        {'  ·  '}
        <LegalLink doc="privacy" onOpen={openLegal}>Privacy</LegalLink>
      </div>
    </div>
  );
}

function YoureIn({ onEnter }) {
  return (
    <div style={{ ...screenWrap, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 26 }}>
      <div style={{ width: 96, height: 96, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'floaty 4s ease-in-out infinite', background: 'linear-gradient(155deg,rgba(66,201,137,0.2),rgba(66,201,137,0.06))', backdropFilter: 'blur(26px)', WebkitBackdropFilter: 'blur(26px)', border: '1px solid rgba(66,201,137,0.45)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35),0 20px 46px rgba(66,201,137,0.3)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M4 12.5 L9.5 18 L20 6.5" stroke="#42C989" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <h1 style={{ margin: '28px 0 0', fontFamily: FONT.black, fontSize: 34, lineHeight: 1, letterSpacing: '-1.2px' }}>You&rsquo;re in.</h1>
      <div style={{ fontFamily: FONT.archivo, fontWeight: 600, fontSize: 15, color: 'rgba(247,247,245,0.6)', marginTop: 12, maxWidth: 280 }}>
        Time to catch the current — the leaderboard is live.
      </div>
      <button onClick={onEnter} style={{ ...pinkCta, maxWidth: 340, marginTop: 32 }}>OPEN SLIPSTREAM</button>
    </div>
  );
}

/* ---------- root ---------- */

export default function Auth({ onAuthed, polCount, tradeCount }) {
  const [screen, setScreen] = useState('welcome');
  const [pendingUser, setPendingUser] = useState(null);
  const [legalDoc, setLegalDoc] = useState(null);

  const done = (user) => {
    setPendingUser(user);
    setScreen('app');
  };

  return (
    <div className="view" key={screen}>
      {screen === 'welcome' && <Welcome go={setScreen} polCount={polCount} tradeCount={tradeCount} />}
      {screen === 'signup' && <SignUp go={setScreen} onDone={done} openLegal={setLegalDoc} polCount={polCount} tradeCount={tradeCount} />}
      {screen === 'signin' && <SignIn go={setScreen} onDone={done} openLegal={setLegalDoc} />}
      {screen === 'app' && <YoureIn onEnter={() => onAuthed(pendingUser)} />}
      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
