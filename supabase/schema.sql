-- Slipstream database schema.
-- Run once in the Supabase SQL Editor (or via `supabase db push`).
--
-- Tables:
--   profiles  — one row per auth user (display name, created timestamp).
--   follows   — which politicians a user follows (server-side, cross-device).
-- Both are protected by Row Level Security so users only touch their own rows.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are self-readable" on public.profiles;
create policy "profiles are self-readable"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles are self-writable" on public.profiles;
create policy "profiles are self-writable"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  user_id uuid not null references auth.users (id) on delete cascade,
  politician_name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, politician_name)
);

alter table public.follows enable row level security;

drop policy if exists "follows are self-managed" on public.follows;
create policy "follows are self-managed"
  on public.follows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- filings — one row per disclosure document the ingester has seen.
-- This is the diff ledger: the runner compares the Clerk's index against this
-- table and only fetches DocIDs it hasn't processed. `parse_status` records
-- what happened, so scanned/no-text filings are visible rather than silently
-- absent. Written only by the ingest job (service role); readable by anyone.
-- ---------------------------------------------------------------------------
create table if not exists public.filings (
  doc_id text primary key,
  chamber text not null check (chamber in ('house', 'senate')),
  filer_first text not null default '',
  filer_last text not null default '',
  district text not null default '',
  state text not null default '',
  filing_date date,
  year int not null,
  source_url text not null,
  parse_status text not null check (parse_status in ('parsed', 'no_text_layer', 'fetch_failed', 'empty')),
  tx_count int not null default 0,
  ingested_at timestamptz not null default now()
);

alter table public.filings enable row level security;

drop policy if exists "filings are public" on public.filings;
create policy "filings are public"
  on public.filings for select
  using (true);

-- ---------------------------------------------------------------------------
-- trades — one row per transaction extracted from a filing.
-- symbol is null for ticker-less assets (treasury bills, structured notes,
-- annuities). Those are real disclosed transactions — often the largest — so
-- they are kept for volume math; ROI callers filter on symbol themselves.
-- Amounts are disclosure BRACKETS: low/high bound the range, mid is an
-- estimate. Every row keeps source_url so any figure can be checked against
-- the actual filing.
-- ---------------------------------------------------------------------------
create table if not exists public.trades (
  id text primary key,               -- doc_id:index within filing
  doc_id text not null references public.filings (doc_id) on delete cascade,
  chamber text not null check (chamber in ('house', 'senate')),
  politician text not null,          -- "First Last" as filed
  state text not null default '',
  district text not null default '',
  symbol text,                       -- null = no ticker
  asset text not null default '',
  asset_code text,
  owner text not null default 'self',-- self | SP (spouse) | DC | JT
  type text not null check (type in ('buy', 'sell')),
  partial boolean not null default false,
  transaction_date date,
  disclosure_date date,
  amount_low bigint not null default 0,
  amount_high bigint not null default 0,
  amount_mid bigint not null default 0,
  source_url text not null,
  ingested_at timestamptz not null default now()
);

create index if not exists trades_disclosure_date_idx on public.trades (disclosure_date desc);
create index if not exists trades_politician_idx on public.trades (politician);
create index if not exists trades_symbol_idx on public.trades (symbol);

alter table public.trades enable row level security;

drop policy if exists "trades are public" on public.trades;
create policy "trades are public"
  on public.trades for select
  using (true);

-- ---------------------------------------------------------------------------
-- device_tokens — push notification targets.
--
-- One row per installed app instance (keyed by FCM token, not by user — the
-- app doesn't require login to follow politicians, so a device can subscribe
-- anonymously). `followed` is a denormalized snapshot written by the client
-- every time its follow list changes; the ingest job's fan-out query reads it
-- directly rather than joining through auth. Written by the client with the
-- anon key, so RLS only allows a row to touch itself — no read/enumerate.
-- Only the service role (the ingest job) can read across all rows to fan out.
-- ---------------------------------------------------------------------------
create table if not exists public.device_tokens (
  token text primary key,
  platform text not null default 'android',
  followed text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.device_tokens enable row level security;

drop policy if exists "device can upsert its own token" on public.device_tokens;
create policy "device can upsert its own token"
  on public.device_tokens for insert
  with check (true);

drop policy if exists "device can update its own token" on public.device_tokens;
create policy "device can update its own token"
  on public.device_tokens for update
  using (true)
  with check (true);
-- Deliberately no select policy for anon/authenticated: a device can write its
-- own row but never read the table (would otherwise leak other users' follows
-- and enumerate tokens). The ingest job reads via the service_role key, which
-- bypasses RLS entirely.
