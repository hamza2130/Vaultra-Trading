"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import { signedUrl, uploadToBucket, validateProofFile } from "@/lib/uploads";

function refresh() {
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}

// The database functions raise readable messages ("Request is already approved", …).
function message(error: { message: string }): string {
  return error.message.replace(/^.*?exception:\s*/i, "");
}

export async function getProofUrl(
  kind: "deposit" | "withdrawal",
  requestId: string,
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  let path: string | null | undefined;
  if (kind === "deposit") {
    const { data } = await admin.from("deposit_requests").select("proof_storage_path").eq("id", requestId).maybeSingle();
    path = data?.proof_storage_path;
  } else {
    const { data } = await admin.from("withdrawal_requests").select("admin_proof_storage_path").eq("id", requestId).maybeSingle();
    path = data?.admin_proof_storage_path;
  }
  if (!path) return { error: "No proof on file." };

  const url = await signedUrl("payment-proofs", path);
  return url ? { url } : { error: "Could not open the proof." };
}

export async function approveDeposit(requestId: string): Promise<{ error?: string }> {
  const adminId = await requireAdmin();
  const { error } = await createAdminClient().rpc("approve_deposit", { p_request: requestId, p_admin: adminId });
  if (error) return { error: message(error) };
  refresh();
  return {};
}

export async function rejectDeposit(requestId: string): Promise<{ error?: string }> {
  const adminId = await requireAdmin();
  const { error } = await createAdminClient().rpc("reject_deposit", { p_request: requestId, p_admin: adminId });
  if (error) return { error: message(error) };
  refresh();
  return {};
}

// Approving a withdrawal means the admin has already sent the funds; the payout
// screenshot is mandatory and becomes visible to the user.
export async function fulfillWithdrawal(formData: FormData): Promise<{ error?: string }> {
  const adminId = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const proof = formData.get("proof");

  const fileError = validateProofFile(proof);
  if (fileError) return { error: fileError };

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("withdrawal_requests")
    .select("user_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { error: "Request not found." };
  if (request.status !== "pending") return { error: `Request is already ${request.status}.` };

  const upload = await uploadToBucket("payment-proofs", request.user_id, proof as File);
  if (upload.error || !upload.path) return { error: upload.error ?? "Could not upload the proof." };

  const { error } = await admin.rpc("fulfill_withdrawal", {
    p_request: requestId,
    p_admin: adminId,
    p_proof_path: upload.path,
  });
  if (error) {
    await admin.storage.from("payment-proofs").remove([upload.path]);
    return { error: message(error) };
  }

  refresh();
  return {};
}

export async function rejectWithdrawal(requestId: string, reason: string): Promise<{ error?: string }> {
  const adminId = await requireAdmin();
  if (!reason.trim()) return { error: "Write a reason — the user will see it." };
  const { error } = await createAdminClient().rpc("reject_withdrawal", {
    p_request: requestId,
    p_admin: adminId,
    p_reason: reason,
  });
  if (error) return { error: message(error) };
  refresh();
  return {};
}
