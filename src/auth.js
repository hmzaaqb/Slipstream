// Authentication layer.
//
// Two backends behind one stable surface:
//   • Supabase (when VITE_SUPABASE_URL/ANON_KEY are set) — real accounts,
//     email verification, password reset, and Google/Apple OAuth.
//   • Local fallback (demo build) — accounts live only in this device's
//     localStorage, passwords stored as SHA-256 hashes, never plaintext.
//
// The exported surface (getUser / initAuth / onAuthChange / signUp / signIn /
// signOut / signInWithProvider / resetPassword) is identical in both modes, so
// the UI never branches on which backend is active. Flip the env vars and the
// app upgrades from demo to production auth with no component changes.

import { supabase, hasSupabase } from './supabase';

const SESSION_KEY = 'slipstream.user';
const ACCOUNTS_KEY = 'slipstream.accounts';

/* ------------------------------------------------------------------ */
/* shared helpers                                                      */
/* ------------------------------------------------------------------ */

// Map a Supabase user object to the app's compact { name, email } shape.
function toUser(supaUser) {
  if (!supaUser) return null;
  const meta = supaUser.user_metadata || {};
  const email = supaUser.email || '';
  return {
    name: meta.full_name || meta.name || email.split('@')[0] || 'Member',
    email: email.toLowerCase(),
  };
}

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

async function sha256(text) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // crypto.subtle needs a secure context; fall back to FNV-1a so the demo
  // still works from file:// or odd webview schemes.
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'fnv' + (h >>> 0).toString(16);
}

/* ------------------------------------------------------------------ */
/* synchronous snapshot (optimistic first paint)                       */
/* ------------------------------------------------------------------ */

// Synchronous best-effort current user. In local mode this is authoritative.
// In Supabase mode it returns null on first load (the real session resolves
// asynchronously via initAuth/onAuthChange) so the UI shows the auth gate
// until the session is confirmed.
export function getUser() {
  if (hasSupabase) return null;
  return readJson(SESSION_KEY, null);
}

// Resolve the authoritative current user. Call once on app start.
export async function initAuth() {
  if (hasSupabase) {
    const { data } = await supabase.auth.getSession();
    return toUser(data?.session?.user);
  }
  return readJson(SESSION_KEY, null);
}

// Subscribe to auth changes (sign in / out / token refresh / OAuth return).
// Returns an unsubscribe function. No-op in local mode.
export function onAuthChange(cb) {
  if (!hasSupabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(toUser(session?.user));
  });
  return () => data?.subscription?.unsubscribe();
}

export function hasAccounts() {
  if (hasSupabase) return true;
  return Object.keys(readJson(ACCOUNTS_KEY, {})).length > 0;
}

/* ------------------------------------------------------------------ */
/* sign up / in / out                                                  */
/* ------------------------------------------------------------------ */

// Returns { user, needsConfirmation }. When email confirmation is on, `user`
// may be null and the caller should prompt the user to check their inbox.
export async function signUp({ name, email, password }) {
  const id = email.trim().toLowerCase();

  if (hasSupabase) {
    const { data, error } = await supabase.auth.signUp({
      email: id,
      password,
      options: { data: { full_name: name.trim() } },
    });
    if (error) throw new Error(error.message);
    const confirmed = Boolean(data.session); // session present => no email gate
    return { user: confirmed ? toUser(data.user) : null, needsConfirmation: !confirmed };
  }

  const accounts = readJson(ACCOUNTS_KEY, {});
  if (accounts[id]) throw new Error('An account with this email already exists — sign in instead.');
  accounts[id] = { name: name.trim(), hash: await sha256(password), createdAt: Date.now() };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  const user = { name: name.trim(), email: id };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { user, needsConfirmation: false };
}

export async function signIn({ email, password }) {
  const id = email.trim().toLowerCase();

  if (hasSupabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: id, password });
    if (error) throw new Error(error.message);
    return toUser(data.user);
  }

  const accounts = readJson(ACCOUNTS_KEY, {});
  const acct = accounts[id];
  if (!acct) throw new Error('No account found for this email — create one first.');
  if (acct.hash !== (await sha256(password))) throw new Error('Incorrect password.');
  const user = { name: acct.name, email: id };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

// OAuth sign-in. Redirects the browser to the provider, then back to the app,
// where onAuthChange fires with the resolved session. Only valid with Supabase.
export async function signInWithProvider(provider) {
  if (!hasSupabase) {
    throw new Error('Social sign-in needs the backend configured. Use email & password for now.');
  }
  const id = provider.toLowerCase(); // 'google' | 'apple'
  const { error } = await supabase.auth.signInWithOAuth({
    provider: id,
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
}

// Send a password-reset email. Requires the backend in local mode it explains
// that reset activates with real accounts.
export async function resetPassword(email) {
  const id = (email || '').trim().toLowerCase();
  if (!id) throw new Error('Enter your email address first.');
  if (!hasSupabase) {
    throw new Error('Password reset needs the backend configured. It activates with real accounts.');
  }
  const { error } = await supabase.auth.resetPasswordForEmail(id, {
    redirectTo: `${window.location.origin}/#reset`,
  });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  if (hasSupabase) {
    await supabase.auth.signOut();
    return;
  }
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
