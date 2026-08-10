-- RunAm schema. Run this in Supabase > SQL Editor.
-- Safe to re-run: drops and recreates.

drop table if exists disputes cascade;
drop table if exists escrow_ledger cascade;
drop table if exists errands cascade;
drop table if exists runner_routes cascade;
drop table if exists places cascade;
drop table if exists profiles cascade;

-- ---------------------------------------------------------------- profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  nin_last4 text,
  nin_verified boolean not null default false,
  completed_errands integer not null default 0,
  runner_mode boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tier is derived, never stored, so it can never drift from the completion count.
create or replace function runner_tier(p profiles) returns integer
language sql immutable as $$
  select case
    when p.completed_errands >= 40 and p.nin_verified then 3
    when p.completed_errands >= 10 and p.nin_verified then 2
    else 1
  end;
$$;

-- ------------------------------------------------------------------ places
-- Curated pickup/dropoff points. Keeps v1 free of a maps bill and keeps
-- addresses unambiguous, which matters more than free-text in Warri.
create table places (
  id text primary key,
  name text not null,
  area text not null,
  lat double precision not null,
  lng double precision not null
);

-- ----------------------------------------------------------- runner routes
-- The switch mechanic: a runner declares the trip they were already making.
create table runner_routes (
  id uuid primary key default gen_random_uuid(),
  runner_id uuid not null references profiles(id) on delete cascade,
  origin_id text not null references places(id),
  destination_id text not null references places(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on runner_routes (runner_id, active);

-- ----------------------------------------------------------------- errands
create type errand_status as enum (
  'awaiting_payment','funded','accepted','picked_up',
  'proof_submitted','completed','disputed','cancelled','refunded'
);
create type errand_category as enum ('simple','purchase','queue','multi_stop');
create type counter_reason as enum ('breaks_my_route','long_queue_expected','multiple_stops','item_cost_higher');

create table errands (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  runner_id uuid references profiles(id) on delete set null,

  title text not null,
  instructions text not null default '',
  category errand_category not null default 'simple',

  pickup_id text not null references places(id),
  dropoff_id text not null references places(id),
  distance_km numeric(6,2) not null,

  -- Every figure the requester was shown, frozen at quote time.
  base_fee integer not null,
  distance_fee integer not null,
  complexity_fee integer not null,
  service_fee integer not null,
  transport_fee integer not null,
  total_amount integer not null,
  runam_fee integer not null,
  runner_payout integer not null,

  status errand_status not null default 'awaiting_payment',

  counter_amount integer,
  counter_reason counter_reason,
  counter_status text check (counter_status in ('pending','accepted','declined')),

  paystack_reference text unique,
  proof_url text,
  proof_note text,

  created_at timestamptz not null default now(),
  funded_at timestamptz,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  completed_at timestamptz
);
create index on errands (status, created_at desc);
create index on errands (requester_id, created_at desc);
create index on errands (runner_id, created_at desc);

-- ----------------------------------------------------------- escrow ledger
-- Append only. Every naira that moves has a row. This is the audit trail
-- you hand a payment partner when they ask how funds are handled.
create table escrow_ledger (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references errands(id) on delete cascade,
  entry_type text not null check (entry_type in
    ('fund','transport_advance','release_runner','release_platform','refund')),
  amount integer not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index on escrow_ledger (errand_id, created_at);

-- --------------------------------------------------------------- disputes
create table disputes (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references errands(id) on delete cascade,
  raised_by uuid not null references profiles(id) on delete cascade,
  reason text not null,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------- RLS
alter table profiles enable row level security;
alter table places enable row level security;
alter table runner_routes enable row level security;
alter table errands enable row level security;
alter table escrow_ledger enable row level security;
alter table disputes enable row level security;

create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "places are public" on places for select using (true);

create policy "own routes" on runner_routes for all
  using (auth.uid() = runner_id) with check (auth.uid() = runner_id);

-- A runner must be able to see funded errands that nobody has taken yet.
create policy "read own or open errands" on errands for select using (
  auth.uid() = requester_id
  or auth.uid() = runner_id
  or (status = 'funded' and runner_id is null)
);
create policy "create own errands" on errands for insert with check (auth.uid() = requester_id);

create policy "read own errand ledger" on escrow_ledger for select using (
  exists (select 1 from errands e where e.id = errand_id
          and (e.requester_id = auth.uid() or e.runner_id = auth.uid()))
);

create policy "read own disputes" on disputes for select using (
  exists (select 1 from errands e where e.id = errand_id
          and (e.requester_id = auth.uid() or e.runner_id = auth.uid()))
);
create policy "raise dispute" on disputes for insert with check (auth.uid() = raised_by);

-- All state transitions run server side through the service role, so there is
-- deliberately no client update policy on errands or escrow_ledger.

-- ------------------------------------------------ profile on signup trigger
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          coalesce(new.raw_user_meta_data->>'phone', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
