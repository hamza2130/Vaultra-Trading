-- Vaultra Portal — initial schema
-- Extends Supabase auth.users with app-specific tables, RLS policies, and helper triggers.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('user', 'admin');
create type kyc_status as enum ('pending', 'approved', 'rejected', 'restricted');
create type doc_type as enum ('national_id', 'passport', 'student_card');
create type deposit_status as enum ('pending', 'approved', 'rejected');
create type withdrawal_status as enum ('pending', 'fulfilled', 'rejected');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users, holds app-specific state
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text not null unique,
  full_name text not null,
  role user_role not null default 'user',
  kyc_status kyc_status not null default 'pending',
  balance numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

create table kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  doc_type doc_type not null,
  storage_path text not null,
  submitted_at timestamptz not null default now()
);

create table email_blacklist (
  email text primary key,
  reason text,
  blacklisted_at timestamptz not null default now()
);

create table blocked_ips (
  ip text primary key,
  user_id uuid references profiles(id) on delete set null,
  reason text,
  blocked_at timestamptz not null default now()
);

create table platform_wallets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  address text not null,
  network text not null default 'TRC20',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table saved_withdrawal_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  currency text not null,
  amount numeric(18,2) not null,
  proof_storage_path text not null,
  deposit_address text not null,
  status deposit_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  currency text not null,
  amount numeric(18,2) not null,
  address_id uuid not null references saved_withdrawal_addresses(id),
  status withdrawal_status not null default 'pending',
  admin_proof_storage_path text,
  reject_reason text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table balance_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  old_balance numeric(18,2) not null,
  new_balance numeric(18,2) not null,
  changed_by uuid not null references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  type text not null,
  detail text not null,
  status text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper: is the current auth user an admin?
-- ---------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table kyc_documents enable row level security;
alter table email_blacklist enable row level security;
alter table blocked_ips enable row level security;
alter table platform_wallets enable row level security;
alter table saved_withdrawal_addresses enable row level security;
alter table deposit_requests enable row level security;
alter table withdrawal_requests enable row level security;
alter table balance_ledger enable row level security;
alter table activity_log enable row level security;

-- profiles: owner reads/updates own row; admins read/update all
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own_or_admin" on profiles
  for update using (id = auth.uid() or is_admin());
create policy "profiles_insert_self" on profiles
  for insert with check (id = auth.uid());

-- kyc_documents: owner inserts own; only admin (or owner) can select
create policy "kyc_documents_insert_own" on kyc_documents
  for insert with check (user_id = auth.uid());
create policy "kyc_documents_select_own_or_admin" on kyc_documents
  for select using (user_id = auth.uid() or is_admin());

-- email_blacklist / blocked_ips: admin-only, but registration flow checks via service role
create policy "email_blacklist_admin_all" on email_blacklist
  for all using (is_admin());
create policy "blocked_ips_admin_all" on blocked_ips
  for all using (is_admin());

-- platform_wallets: any authenticated user can read active wallets, admin manages all
create policy "platform_wallets_select_active_or_admin" on platform_wallets
  for select using (active = true or is_admin());
create policy "platform_wallets_admin_write" on platform_wallets
  for insert with check (is_admin());
create policy "platform_wallets_admin_update" on platform_wallets
  for update using (is_admin());

-- saved_withdrawal_addresses: owner manages own
create policy "saved_addresses_owner_all" on saved_withdrawal_addresses
  for all using (user_id = auth.uid());

-- deposit_requests: owner inserts/selects own; admin selects/updates all
create policy "deposit_requests_insert_own" on deposit_requests
  for insert with check (user_id = auth.uid());
create policy "deposit_requests_select_own_or_admin" on deposit_requests
  for select using (user_id = auth.uid() or is_admin());
create policy "deposit_requests_update_admin" on deposit_requests
  for update using (is_admin());

-- withdrawal_requests: owner inserts/selects own; admin selects/updates all
create policy "withdrawal_requests_insert_own" on withdrawal_requests
  for insert with check (user_id = auth.uid());
create policy "withdrawal_requests_select_own_or_admin" on withdrawal_requests
  for select using (user_id = auth.uid() or is_admin());
create policy "withdrawal_requests_update_admin" on withdrawal_requests
  for update using (is_admin());

-- balance_ledger / activity_log: admin-only read; written server-side via service role
create policy "balance_ledger_admin_select" on balance_ledger
  for select using (is_admin());
create policy "activity_log_admin_select" on activity_log
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets (private) — created here so they exist on `supabase db reset`
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "kyc_documents_storage_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "kyc_documents_storage_select_own_or_admin"
  on storage.objects for select
  using (bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

create policy "payment_proofs_storage_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "payment_proofs_storage_select_own_or_admin"
  on storage.objects for select
  using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- admins also need to be able to upload payout-proof screenshots into a user's folder
create policy "payment_proofs_storage_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and is_admin());
