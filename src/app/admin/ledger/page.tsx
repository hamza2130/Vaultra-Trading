import { createClient } from "@/lib/supabase/server";
import { LedgerClient, type LedgerRow, type UserOption } from "./LedgerClient";

export default async function AdminLedgerPage() {
  const supabase = await createClient();

  const { data: ledger } = await supabase
    .from("balance_ledger")
    .select("id, user_id, old_balance, new_balance, changed_by, note, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, kyc_status, balance")
    .order("full_name", { ascending: true });

  const nameById = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  // Balance edits apply to real customers, not pending sign-ups or admins.
  const users: UserOption[] = (people ?? [])
    .filter((p) => p.role === "user" && (p.kyc_status === "approved" || p.kyc_status === "restricted"))
    .map((p) => ({ id: p.id, name: p.full_name, email: p.email, balance: Number(p.balance) }));

  const rows: LedgerRow[] = (ledger ?? []).map((l) => ({
    id: l.id,
    userId: l.user_id,
    userName: nameById.get(l.user_id) ?? "Deleted user",
    oldBalance: Number(l.old_balance),
    newBalance: Number(l.new_balance),
    changedBy: nameById.get(l.changed_by) ?? "Unknown admin",
    note: l.note,
    createdAt: l.created_at,
  }));

  return <LedgerClient users={users} rows={rows} />;
}
