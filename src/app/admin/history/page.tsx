import { createClient } from "@/lib/supabase/server";
import { HistoryClient, type HistoryRow } from "./HistoryClient";

export default async function AdminHistoryPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("activity_log")
    .select("id, user_id, type, detail, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const ids = [...new Set((events ?? []).flatMap((e) => (e.user_id ? [e.user_id] : [])))];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
    : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id, p]));

  const rows: HistoryRow[] = (events ?? []).map((e) => ({
    id: e.id,
    // user_id is cleared when an account is deleted (e.g. a rejected registration);
    // the event text itself still names the person.
    userName: e.user_id ? (who.get(e.user_id)?.full_name ?? "Unknown user") : "—",
    userEmail: e.user_id ? (who.get(e.user_id)?.email ?? "") : "",
    type: e.type,
    detail: e.detail,
    status: e.status,
    createdAt: e.created_at,
  }));

  return <HistoryClient rows={rows} />;
}
