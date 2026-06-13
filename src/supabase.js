// Supabase client.
//
// The app is backend-optional: if VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// are not set, `supabase` is null and the app keeps running in local/demo mode
// (auth falls back to device-local accounts, data falls back to FMP-direct or
// the bundled sample set). Set both env vars (see .env.example) to switch the
// whole app onto the real backend with zero code changes.

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True once a real Supabase project is wired up. Everything else keys off this.
export const hasSupabase = Boolean(url && anonKey);

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Base URL for invoking Edge Functions over HTTP (used by the FMP/Alpaca
// proxies). Derived from the project URL: https://<ref>.functions.supabase.co
export const functionsBase = hasSupabase
  ? url.replace('.supabase.co', '.functions.supabase.co')
  : null;
