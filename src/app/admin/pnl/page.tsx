import { createClient } from "@/lib/supabase/server";
import { PnlClient, type PnlRow, type UserOption } from "./PnlClient";

export default async function AdminPnlPage() {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("daily_pnl")
    .select("id, user_id, entry_date, amount, note, created_by, created_at")
    .order("entry_date", { ascending: false })
    .limit(300);

  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, kyc_status")
    .order("full_name", { ascending: true });

  const nameById = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  // PnL applies to real, active customers only.
  const users: UserOption[] = (people ?? [])
    .filter((p) => p.role === "user" && (p.kyc_status === "approved" || p.kyc_status === "restricted"))
    .map((p) => ({ id: p.id, name: p.full_name, email: p.email }));

  const rows: PnlRow[] = (entries ?? []).map((e) => ({
    id: e.id,
    userId: e.user_id,
    userName: nameById.get(e.user_id) ?? "Deleted user",
    date: e.entry_date,
    amount: Number(e.amount),
    note: e.note,
    postedBy: nameById.get(e.created_by) ?? "Unknown admin",
    createdAt: e.created_at,
  }));

  return <PnlClient users={users} rows={rows} />;
}
