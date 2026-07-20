# Slipstream — Setup & Launch Guide

The app is **backend-optional**. With no configuration it runs in demo mode
(local accounts + bundled sample data) exactly as before. Add the Supabase env
vars below and it upgrades to **real auth + server-side key proxying** with no
code changes.

---

## 0. Local development (demo mode)

```bash
npm install
npm run dev
```

No `.env` needed. Auth uses device-local accounts; data uses the sample set.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com> → **New project**. Note the project URL and the
   **anon / publishable key** (Project Settings → API).
2. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...        # anon key — safe in the browser
   ```
3. Restart `npm run dev`. The app now uses Supabase for auth.

> The anon key is meant to be public. **Never** put the `service_role` key in
> `.env` or any client code.

---

## 2. Auth configuration (in the Supabase dashboard)

**Authentication → URL Configuration**
- **Site URL:** your production URL (e.g. `https://slipstream.app`).
- **Redirect URLs:** add your production URL and `http://localhost:5173` for dev.

**Authentication → Providers**
- **Email:** enable. Keep "Confirm email" **on** for real launch — the sign-up
  flow already handles the "check your inbox" state.
- **Google:** enable, paste your Google OAuth client ID/secret
  (<https://console.cloud.google.com> → Credentials → OAuth client). Add the
  Supabase callback URL it shows you to Google's authorized redirect URIs.
- **Apple:** enable and complete Apple's Service ID + key setup if you want it;
  otherwise hide the Apple button.

The Google/Apple buttons and "Forgot password?" are already wired — they start
working the moment the providers are enabled.

---

## 3. Database schema

Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
It creates the `profiles` and `follows` tables with row-level security and a
trigger that auto-creates a profile on sign-up.

---

## 4. Edge Functions (keep keys server-side)

Install the CLI and link the project:
```bash
npm i -g supabase
supabase login
supabase link --project-ref YOUR-REF
```

### FMP proxy (hides the paid FMP key)
```bash
supabase secrets set FMP_KEY=your_PAID_fmp_key
supabase functions deploy fmp           # verify_jwt ON (default)
```

### Alpaca proxy (CORS in production)
```bash
supabase functions deploy alpaca --no-verify-jwt
```
`--no-verify-jwt` is intentional: the request carries the user's Alpaca keys in
its own headers, and the function only relays to Alpaca — it grants no access to
your Supabase project.

Then enable the proxy in `.env`:
```
VITE_USE_BACKEND_PROXY=true
```
Now the browser never sees the FMP key, and Alpaca works on any static host.

---

## 5. Go live with real data

**You already are.** The app ships with `public/data/snapshot.json` — real House
and Senate filings scraped from official sources by `npm run snapshot`, with
real entry/latest prices. The data priority in `src/api.js` is:

1. **Supabase `trades` table** (live DB) — populated by `npm run ingest` once
   your Supabase project is connected (see the schema in `supabase/schema.sql`)
2. **Bundled snapshot** — real filings as of the last `npm run snapshot` run;
   `.github/workflows/ingest.yml` refreshes it twice daily in CI
3. **Sample data** — synthetic, clearly labelled with a demo banner; only shown
   if both of the above are unavailable

No FMP subscription is required. (The legacy FMP path still exists behind
`DEMO_MODE = false` + a runtime key, but the scraper has replaced it.)

---

## 5b. Push notifications (Android)

Notifies a device when a politician it follows files a new disclosure. Fully
wired end to end, but needs two things this repo can't include for you:

1. **`android/app/google-services.json`** — from your Firebase project
   (Project settings → Your apps → Add app → Android, package name
   `com.slipstream.app`). Already present if you're reading this after that
   step; if missing, push silently does nothing and the rest of the app is
   unaffected.
2. **Three GitHub repo secrets** (Settings → Secrets and variables → Actions):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — same values as step 1/3 above
   - `FIREBASE_SERVICE_ACCOUNT_KEY` — Firebase console → Project settings →
     Service accounts → **Generate new private key**. That downloads a JSON
     file; base64-encode the whole file and paste the result as the secret
     value (`base64 -w0 service-account.json`, or on Windows:
     `[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))`
     in PowerShell).

Also run the `device_tokens` table addition in `supabase/schema.sql` (already
included if you're applying the whole file fresh; re-run it if your project
predates this feature — `create table if not exists` makes it safe to re-apply).

Once all three secrets are set, the next scheduled ingest run
(`.github/workflows/ingest.yml`) will fan out pushes automatically — no
redeploy needed, it's read straight from the secrets at run time. Until then,
`send-push.mjs` logs which politicians *would* have triggered a notification,
so you can confirm the pipeline is finding the right filings before wiring
Firebase.

---

## 6. Deploy the frontend

Any static host works (Vercel, Netlify, Cloudflare Pages):
```bash
npm run build      # outputs dist/
```
Set the same env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_USE_BACKEND_PROXY`) in the host's dashboard. Because Alpaca now routes
through the Edge Function, you no longer depend on the Vite dev proxy.

---

## 7. Pre-launch checklist

- [ ] `.env` filled; `npm run dev` shows the real sign-in (email confirmation works)
- [ ] Google (and/or Apple) sign-in completes end-to-end
- [ ] Password reset email arrives and works
- [ ] `supabase/schema.sql` run; a new sign-up creates a `profiles` row
- [ ] `fmp` + `alpaca` functions deployed; `VITE_USE_BACKEND_PROXY=true`
- [ ] FMP key is **only** in `supabase secrets`, not in `src/config.js`
- [ ] `DEMO_MODE = false`; leaderboard shows live trades
- [ ] Alpaca paper connect + mirror works in the deployed build
- [ ] **Legal reviewed by a lawyer** — the text in `src/components/Legal.jsx` is
      a starting template, not legal advice. Fill in company/contact details.
- [ ] CORS `Access-Control-Allow-Origin` in `supabase/functions/_shared/cors.ts`
      tightened from `*` to your domain
- [ ] Old demo FMP key in git history rotated/removed (see note below)

---

## Security notes

- The previously-committed FMP key in `src/config.js` should be considered
  compromised. Rotate it and move the new key into `supabase secrets` only.
- Brokerage (Alpaca) keys stay in the browser's `localStorage` and are sent to
  Alpaca via the proxy per-request; they are never stored server-side.
- This is **paper** trading. If you ever enable live trading, the confirmation
  modal in `src/components/Copy.jsx` is your safety gate — keep it.
