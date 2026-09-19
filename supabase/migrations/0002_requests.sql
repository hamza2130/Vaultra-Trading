-- Phase 3: deposit / withdrawal request handling.

-- A withdrawal must keep the destination it was requested with, even if the user
-- later deletes or edits that saved address.
alter table withdrawal_requests add column address text;
update withdrawal_requests w
  set address = (select s.address from saved_withdrawal_addresses s where s.id = w.address_id)
  where address is null;
alter table withdrawal_requests alter column address set not null;

alter table withdrawal_requests alter column address_id drop not null;
alter table withdrawal_requests drop constraint withdrawal_requests_address_id_fkey;
alter table withdrawal_requests
  add constraint withdrawal_requests_address_id_fkey
  foreign key (address_id) references saved_withdrawal_addresses(id) on delete set null;

alter table deposit_requests add constraint deposit_amount_positive check (amount > 0);
alter table withdrawal_requests add constraint withdrawal_amount_positive check (amount > 0);

-- ---------------------------------------------------------------------------
-- Money-moving operations. Each runs in one transaction with row locks, so two
-- admins acting on the same request can never double-credit or double-debit,
-- and the balance, ledger and activity log always change together.
-- ---------------------------------------------------------------------------

create or replace function approve_deposit(p_request uuid, p_admin uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r deposit_requests;
  old_bal numeric;
  new_bal numeric;
begin
  select * into r from deposit_requests where id = p_request for update;
  if not found then raise exception 'Request not found'; end if;
  if r.status <> 'pending' then raise exception 'Request is already %', r.status; end if;

  select balance into old_bal from profiles where id = r.user_id for update;
  new_bal := old_bal + r.amount;

  update profiles set balance = new_bal where id = r.user_id;
  update deposit_requests
    set status = 'approved', reviewed_by = p_admin, reviewed_at = now()
    where id = p_request;

  insert into balance_ledger (user_id, old_balance, new_balance, changed_by, note)
    values (r.user_id, old_bal, new_bal, p_admin, 'Deposit approved: ' || r.amount || ' ' || r.currency);
  insert into activity_log (user_id, type, detail, status)
    values (r.user_id, 'Deposit', r.amount || ' ' || r.currency || ' approved — balance updated', 'Approved');
end;
$$;

create or replace function reject_deposit(p_request uuid, p_admin uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r deposit_requests;
begin
  select * into r from deposit_requests where id = p_request for update;
  if not found then raise exception 'Request not found'; end if;
  if r.status <> 'pending' then raise exception 'Request is already %', r.status; end if;

  update deposit_requests
    set status = 'rejected', reviewed_by = p_admin, reviewed_at = now()
    where id = p_request;
  insert into activity_log (user_id, type, detail, status)
    values (r.user_id, 'Deposit', r.amount || ' ' || r.currency || ' rejected', 'Rejected');
end;
$$;

create or replace function fulfill_withdrawal(p_request uuid, p_admin uuid, p_proof_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r withdrawal_requests;
  old_bal numeric;
  new_bal numeric;
begin
  if p_proof_path is null or length(trim(p_proof_path)) = 0 then
    raise exception 'A payout proof is required';
  end if;

  select * into r from withdrawal_requests where id = p_request for update;
  if not found then raise exception 'Request not found'; end if;
  if r.status <> 'pending' then raise exception 'Request is already %', r.status; end if;

  select balance into old_bal from profiles where id = r.user_id for update;
  if old_bal < r.amount then
    raise exception 'User balance (%) is lower than the withdrawal amount (%)', old_bal, r.amount;
  end if;
  new_bal := old_bal - r.amount;

  update profiles set balance = new_bal where id = r.user_id;
  update withdrawal_requests
    set status = 'fulfilled', admin_proof_storage_path = p_proof_path,
        reviewed_by = p_admin, reviewed_at = now()
    where id = p_request;

  insert into balance_ledger (user_id, old_balance, new_balance, changed_by, note)
    values (r.user_id, old_bal, new_bal, p_admin, 'Withdrawal fulfilled: ' || r.amount || ' ' || r.currency);
  insert into activity_log (user_id, type, detail, status)
    values (r.user_id, 'Withdrawal', r.amount || ' ' || r.currency || ' — proof sent to user', 'Fulfilled');
end;
$$;

create or replace function reject_withdrawal(p_request uuid, p_admin uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r withdrawal_requests;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required';
  end if;

  select * into r from withdrawal_requests where id = p_request for update;
  if not found then raise exception 'Request not found'; end if;
  if r.status <> 'pending' then raise exception 'Request is already %', r.status; end if;

  update withdrawal_requests
    set status = 'rejected', reject_reason = trim(p_reason),
        reviewed_by = p_admin, reviewed_at = now()
    where id = p_request;
  insert into activity_log (user_id, type, detail, status)
    values (r.user_id, 'Withdrawal', r.amount || ' ' || r.currency || ' rejected: ' || trim(p_reason), 'Rejected');
end;
$$;

-- These move money: only the server (service role) may call them, never a browser.
revoke all on function approve_deposit(uuid, uuid) from public, anon, authenticated;
revoke all on function reject_deposit(uuid, uuid) from public, anon, authenticated;
revoke all on function fulfill_withdrawal(uuid, uuid, text) from public, anon, authenticated;
revoke all on function reject_withdrawal(uuid, uuid, text) from public, anon, authenticated;
grant execute on function approve_deposit(uuid, uuid) to service_role;
grant execute on function reject_deposit(uuid, uuid) to service_role;
grant execute on function fulfill_withdrawal(uuid, uuid, text) to service_role;
grant execute on function reject_withdrawal(uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- SECURITY FIX (was open since 0001): row-level security decides WHICH rows a
-- user may touch but not WHICH COLUMNS, so a signed-in user could PATCH their own
-- profile and set balance / role / kyc_status. Restrict writes at the column level.
-- Privileged writes (balance, role, KYC status, requests) go through server code
-- using the service role, which bypasses these grants.
-- ---------------------------------------------------------------------------
revoke insert, update, delete on profiles from authenticated, anon;
grant update (full_name, username) on profiles to authenticated;

revoke insert, update, delete on deposit_requests from authenticated, anon;
revoke insert, update, delete on withdrawal_requests from authenticated, anon;
revoke insert, update, delete on kyc_documents from authenticated, anon;
