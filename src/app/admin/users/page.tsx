import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, username, kyc_status, created_at")
    .order("created_at", { ascending: false });

  const { data: blacklist } = await supabase
    .from("email_blacklist")
    .select("email, reason, blacklisted_at")
    .order("blacklisted_at", { ascending: false });

  const { data: docs } = await supabase.from("kyc_documents").select("user_id, doc_type");
  const docTypeByUser = new Map((docs ?? []).map((d) => [d.user_id, d.doc_type]));

  const rows = (users ?? []).map((u) => ({
    ...u,
    doc_type: docTypeByUser.get(u.id) ?? null,
  }));

  return <UsersClient users={rows} blacklist={blacklist ?? []} />;
}
