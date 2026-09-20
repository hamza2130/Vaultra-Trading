import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, username, role, kyc_status, created_at")
    .order("created_at", { ascending: false });

  const { data: blacklist } = await supabase
    .from("email_blacklist")
    .select("email, reason, blacklisted_at")
    .order("blacklisted_at", { ascending: false });

  const { data: blockedIps } = await supabase
    .from("blocked_ips")
    .select("ip, user_id, reason, blocked_at")
    .order("blocked_at", { ascending: false });

  const { data: docs } = await supabase.from("kyc_documents").select("user_id, doc_type");
  const docTypeByUser = new Map((docs ?? []).map((d) => [d.user_id, d.doc_type]));
  const nameById = new Map((users ?? []).map((u) => [u.id, u.full_name]));

  const rows = (users ?? []).map((u) => ({
    ...u,
    doc_type: docTypeByUser.get(u.id) ?? null,
  }));

  const ips = (blockedIps ?? []).map((b) => ({
    ip: b.ip,
    userName: b.user_id ? (nameById.get(b.user_id) ?? "Unknown user") : "—",
    reason: b.reason,
    blockedAt: b.blocked_at,
  }));

  return <UsersClient users={rows} blacklist={blacklist ?? []} blockedIps={ips} />;
}
