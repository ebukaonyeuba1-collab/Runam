-- RunAm Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push` if you use the CLI).
-- If you already have tables from earlier work, review column names below and
-- reconcile with `alter table` statements instead of re-running this file blind.

create extension if not exists "uuid-ossp";

-- ============ ENUMS ============
create type user_role as enum ('customer', 'runner', 'admin');
create type errand_status as enum ('open', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed');
create type errand_urgency as enum ('low', 'normal', 'urgent');

-- ============ PROFILES ============
-- Extends Supabase auth.users with app-specific fields.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  city text,
  avatar_url text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ RUNNER PROFILES ============
create table if not exists runner_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  bio text,
  is_available boolean not null default false,
  verification_status text not null default 'pending', -- pending | in_review | verified | rejected
  id_document_url text,
  selfie_url text,
  bank_name text,
  bank_account_number text,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  total_earnings numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ CATEGORIES ============
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

insert into categories (name, icon) values
  ('Grocery Run', 'shopping-cart'),
  ('Delivery', 'package'),
  ('Bill Payment', 'receipt'),
  ('Document Pickup', 'file-text'),
  ('Queueing', 'users'),
  ('Home Services', 'home'),
  ('Other', 'more-horizontal')
on conflict (name) do nothing;

-- ============ ERRANDS ============
create table if not exists errands (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references profiles(id) on delete cascade,
  runner_id uuid references profiles(id) on delete set null,
  category_id uuid references categories(id),
  title text not null,
  description text not null,
  pickup_location text not null,
  destination text not null,
  budget numeric(10,2) not null,
  urgency errand_urgency not null default 'normal',
  preferred_date date,
  photo_url text,
  status errand_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============ MESSAGES ============
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  errand_id uuid not null references errands(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  attachment_url text,
  created_at timestamptz not null default now(),
  seen_at timestamptz
);

-- ============ REVIEWS ============
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  errand_id uuid not null references errands(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ============ TRANSACTIONS ============
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  errand_id uuid references errands(id) on delete set null,
  type text not null, -- fund | withdraw | payment | payout | refund
  amount numeric(10,2) not null,
  status text not null default 'pending', -- pending | success | failed
  reference text unique,
  created_at timestamptz not null default now()
);

-- ============ NOTIFICATIONS ============
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY ============
alter table profiles enable row level security;
alter table runner_profiles enable row level security;
alter table errands enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table transactions enable row level security;
alter table notifications enable row level security;

-- Profiles: users can read any profile (needed to show runner/customer names),
-- but only edit their own.
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Runner profiles viewable by everyone" on runner_profiles for select using (true);
create policy "Runners manage own runner profile" on runner_profiles for all using (auth.uid() = id);

-- Errands: customers see their own; runners see open errands + ones assigned to them.
create policy "Customers view own errands" on errands for select
  using (auth.uid() = customer_id or auth.uid() = runner_id or status = 'open');
create policy "Customers create errands" on errands for insert
  with check (auth.uid() = customer_id);
create policy "Customers update own errands" on errands for update
  using (auth.uid() = customer_id or auth.uid() = runner_id);

-- Messages: only participants of the errand can read/write.
create policy "Participants view messages" on messages for select
  using (
    exists (
      select 1 from errands e
      where e.id = errand_id and (e.customer_id = auth.uid() or e.runner_id = auth.uid())
    )
  );
create policy "Participants send messages" on messages for insert
  with check (auth.uid() = sender_id);

create policy "Reviews viewable by everyone" on reviews for select using (true);
create policy "Users create reviews for their errands" on reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "Users view own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on notifications for update using (auth.uid() = user_id);

-- ============ RPC: increment runner earnings ============
create or replace function public.increment_runner_earnings(runner_id_input uuid, amount_input numeric)
returns void as $$
begin
  update runner_profiles
  set total_earnings = total_earnings + amount_input,
      updated_at = now()
  where id = runner_id_input;
end;
$$ language plpgsql security definer;

-- ============ TRIGGER: auto-create profile on signup ============
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );

  if coalesce(new.raw_user_meta_data->>'role', 'customer') = 'runner' then
    insert into public.runner_profiles (id) values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
