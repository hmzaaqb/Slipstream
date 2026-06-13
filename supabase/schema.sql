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
