import { createClient } from "@/lib/supabase/server";
import { RequestsClient, type QueueRow } from "./RequestsClient";

export default async function AdminRequestsPage() {
  const supabase = await createClient();

  const { data: deposits } = await supabase
    .from("deposit_requests")
    .select("id, user_id, amount, currency, status, created_at, deposit_address")
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: withdrawals } = await supabase
    .from("withdrawal_requests")
    .select("id, user_id, amount, currency, status, created_at, address, reject_reason, admin_proof_storage_path")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = [...new Set([...(deposits ?? []), ...(withdrawals ?? [])].map((r) => r.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };
  const who = new Map((profiles ?? []).map((p) => [p.id, p]));

  const toRow = (
    r: { id: string; user_id: string; amount: number; currency: string; status: string; created_at: string },
    kind: QueueRow["kind"],
    address: string,
    extra: Partial<QueueRow> = {},
  ): QueueRow => ({
    id: r.id,
    kind,
    userName: who.get(r.user_id)?.full_name ?? "Unknown user",
    userEmail: who.get(r.user_id)?.email ?? "",
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status,
    createdAt: r.created_at,
    address,
    rejectReason: null,
    hasPayoutProof: false,
    ...extra,
  });

  return (
    <RequestsClient
      deposits={(deposits ?? []).map((d) => toRow(d, "deposit", d.deposit_address))}
      withdrawals={(withdrawals ?? []).map((w) =>
        toRow(w, "withdrawal", w.address, {
          rejectReason: w.reject_reason,
          hasPayoutProof: !!w.admin_proof_storage_path,
        }),
      )}
    />
  );
}
