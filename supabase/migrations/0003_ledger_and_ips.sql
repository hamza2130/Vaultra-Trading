-- Phase 4: manual balance edits and IP tracking for restrictions.

-- Every IP a user has been seen from, so that restricting them can block the
-- addresses they actually use. Written only by the server.
create table user_ips (
  user_id uuid not null references profiles(id) on delete cascade,
  ip text not null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (user_id, ip)
);
create index user_ips_ip_idx on user_ips (ip);

alter table user_ips enable row level security;
create policy "user_ips_admin_select" on user_ips for select using (is_admin());
revoke insert, update, delete on user_ips from authenticated, anon;

-- Admin types a new balance; the change is applied and logged in one transaction.
-- (Deposit/withdrawal approvals write to the same ledger from their own functions.)
create or replace function set_balance(p_user uuid, p_new numeric, p_note text, p_admin uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_bal numeric;
  note text := coalesce(nullif(trim(p_note), ''), 'Manual edit');
begin
  if p_new is null or p_new < 0 then
    raise exception 'Balance must be zero or more';
  end if;
  if p_new > 100000000 then
    raise exception 'Balance is unreasonably large';
  end if;

  select balance into old_bal from profiles where id = p_user for update;
  if not found then raise exception 'User not found'; end if;
  if old_bal = p_new then
    raise exception 'Balance is already %', old_bal;
  end if;

  update profiles set balance = p_new where id = p_user;

  insert into balance_ledger (user_id, old_balance, new_balance, changed_by, note)
    values (p_user, old_bal, p_new, p_admin, note);
  insert into activity_log (user_id, type, detail, status)
    values (p_user, 'Balance edit', old_bal::numeric(18,2) || ' → ' || p_new::numeric(18,2) || ' — ' || note, 'Logged');
end;
$$;

revoke all on function set_balance(uuid, numeric, text, uuid) from public, anon, authenticated;
grant execute on function set_balance(uuid, numeric, text, uuid) to service_role;
