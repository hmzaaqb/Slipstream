// Local-first auth for the demo build. Accounts live only in this device's
// localStorage and passwords are stored as SHA-256 hashes, never plaintext.
// The exported surface (getUser / signUp / signIn / signOut) is the seam where
// a real auth provider (Firebase, Supabase, etc.) plugs in at launch — swap
// the implementations, keep the signatures, and the UI never changes.

const SESSION_KEY = 'slipstream.user';
const ACCOUNTS_KEY = 'slipstream.accounts';

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

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

export function getUser() {
  return readJson(SESSION_KEY, null);
}

export function hasAccounts() {
  return Object.keys(readJson(ACCOUNTS_KEY, {})).length > 0;
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export async function signUp({ name, email, password }) {
  const accounts = readJson(ACCOUNTS_KEY, {});
  const id = email.trim().toLowerCase();
  if (accounts[id]) throw new Error('An account with this email already exists — sign in instead.');
  accounts[id] = { name: name.trim(), hash: await sha256(password), createdAt: Date.now() };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  const user = { name: name.trim(), email: id };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function signIn({ email, password }) {
  const accounts = readJson(ACCOUNTS_KEY, {});
  const id = email.trim().toLowerCase();
  const acct = accounts[id];
  if (!acct) throw new Error('No account found for this email — create one first.');
  if (acct.hash !== (await sha256(password))) throw new Error('Incorrect password.');
  const user = { name: acct.name, email: id };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}
