-- Daily PnL — admin posts a per-day performance figure for a user's managed
-- account; the user sees only their own entries. Not an automated payout:
-- purely a record the admin sets by hand, same as the balance ledger.

create table daily_pnl (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  entry_date date not null,
  amount numeric(18,2) not null,
  note text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index daily_pnl_user_date_idx on daily_pnl (user_id, entry_date desc);

alter table daily_pnl enable row level security;

-- Owner reads their own entries; admins read everyone's. Written only via the
-- service-role admin action (requireAdmin() gate) — no direct client writes.
create policy "daily_pnl_select_own_or_admin" on daily_pnl
  for select using (user_id = auth.uid() or is_admin());

revoke insert, update, delete on daily_pnl from authenticated, anon;
