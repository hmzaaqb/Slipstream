# Slipstream — Catch the Current

Track congressional stock trades, rank politicians by **real ROI**, browse a live
trade feed, drill into any politician's profile, and **mirror their trades** with
a connected Alpaca paper-trading account.

Built with React 19 + Vite. The UI is a faithful port of the Slipstream design.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. The app loads on the **Home** tab with real scraped data.

> **Going to production?** See [`SETUP.md`](SETUP.md) for the full launch guide:
> Supabase auth (email + Google/Apple), server-side FMP/Alpaca key proxying via
> Edge Functions, the database schema, and the pre-launch checklist. The app is
> backend-optional — it runs in demo mode with no config and upgrades to the
> real backend once the Supabase env vars are set.

> **Why `npm run dev` (not just opening a file):** Alpaca's brokerage API blocks
> direct browser calls (CORS). The Vite dev server proxies `/alpaca/*` to
> `paper-api.alpaca.markets`, so connecting / mirroring only works under
> `npm run dev` or `npm run preview` (`npm run build` then `npm run preview`).

## How it works

- **Data pipeline** (`scripts/ingest/`): Slipstream scrapes REAL congressional
  filings from primary sources — the House Clerk's PTR PDFs and the Senate eFD
  system — and bundles them (with real entry/latest prices) into
  `public/data/snapshot.json`. Every trade links to its source filing.
  - `npm run snapshot` — rebuild the snapshot (only fetches unseen filings)
  - `npm run validate-house` — parser accuracy report against live filings
  - `.github/workflows/ingest.yml` — refreshes the data twice daily in CI
- **Data priority** (`src/api.js`): Supabase (live DB, when configured) →
  bundled snapshot (real, as-of build time) → sample data (clearly labelled demo).
- **Members**: party/state resolved from the public-domain
  unitedstates/congress-legislators dataset at snapshot build time.
- **Alpaca** (`src/alpaca.js`): paper-trading client. Credentials live only in
  `localStorage`. Connect with your **paper** API key + secret.

### Configuration

- **FMP key:** defaults to the bundled key in `src/config.js`. Override at
  runtime without rebuilding: `localStorage.setItem('slipstream.fmpKey', 'YOUR_KEY')`.
- **Alpaca paper keys:** get them at `app.alpaca.markets → Paper Trading → API Keys`,
  then paste into the **Copy** tab → *Connect Alpaca*.

## Tabs

- **Leaders** — searchable, filterable (party / chamber / sort), ROI vs S&P toggle.
- **Feed** — sector intel, hot tickers, ticker/period/type/size filters, live trades.
- **Profile** — stats, total volume, portfolio chart, top holdings, recent trades. Follow ↔ Copy.
- **Copy** — connect Alpaca (paper), see followed politicians, mirror their buys.
