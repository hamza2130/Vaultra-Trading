"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedUser } from "@/lib/require-admin";
import { signedUrl, uploadToBucket, validateProofFile } from "@/lib/uploads";

const CURRENCIES = ["USDT", "USDC"];
const MAX_AMOUNT = 1_000_000;
const MIN_DEPOSIT = 50;

function parseAmount(raw: unknown): number | null {
  const s = String(raw ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= MAX_AMOUNT ? n : null;
}

export async function submitDeposit(formData: FormData): Promise<{ error?: string }> {
  const userId = await requireApprovedUser();

  const currency = String(formData.get("currency") ?? "");
  const amount = parseAmount(formData.get("amount"));
  const walletId = String(formData.get("walletId") ?? "");
  const proof = formData.get("proof");

  if (!CURRENCIES.includes(currency)) return { error: "Choose a currency." };
  if (amount === null) return { error: "Enter a valid amount (up to 2 decimals, max 1,000,000)." };
  if (amount < MIN_DEPOSIT) return { error: `Minimum deposit is $${MIN_DEPOSIT}.` };
  const fileError = validateProofFile(proof);
  if (fileError) return { error: fileError };

  const admin = createAdminClient();
  const { data: wallet } = await admin
    .from("platform_wallets")
    .select("address")
    .eq("id", walletId)
    .eq("active", true)
    .maybeSingle();
  if (!wallet) return { error: "That deposit address is no longer active. Reopen Deposit and try again." };

  const upload = await uploadToBucket("payment-proofs", userId, proof as File);
  if (upload.error || !upload.path) return { error: upload.error ?? "Could not upload the proof." };

  const { error } = await admin.from("deposit_requests").insert({
    user_id: userId,
    currency,
    amount,
    proof_storage_path: upload.path,
    deposit_address: wallet.address,
  });
  if (error) return { error: error.message };

  await admin.from("activity_log").insert({
    user_id: userId,
    type: "Deposit",
    detail: `${amount.toFixed(2)} ${currency} submitted, awaiting review`,
    status: "Pending",
  });

  revalidatePath("/account");
  revalidatePath("/admin/requests");
  return {};
}

export async function submitWithdrawal(input: {
  currency: string;
  amount: string;
  addressId: string;
}): Promise<{ error?: string }> {
  const userId = await requireApprovedUser();

  const amount = parseAmount(input.amount);
  if (!CURRENCIES.includes(input.currency)) return { error: "Choose a currency." };
  if (amount === null) return { error: "Enter a valid amount (up to 2 decimals, max 1,000,000)." };

  const admin = createAdminClient();

  const { data: saved } = await admin
    .from("saved_withdrawal_addresses")
    .select("address")
    .eq("id", input.addressId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!saved) return { error: "Pick one of your saved addresses." };

  // Available = balance minus what's already promised to other pending withdrawals.
  const { data: profile } = await admin.from("profiles").select("balance").eq("id", userId).single();
  const { data: pending } = await admin
    .from("withdrawal_requests")
    .select("amount")
    .eq("user_id", userId)
    .eq("status", "pending");
  const reserved = (pending ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const available = Number(profile?.balance ?? 0) - reserved;
  if (amount > available) {
    return { error: `Amount exceeds your available balance ($${Math.max(available, 0).toFixed(2)}).` };
  }

  const { error } = await admin.from("withdrawal_requests").insert({
    user_id: userId,
    currency: input.currency,
    amount,
    address_id: input.addressId,
    address: saved.address,
  });
  if (error) return { error: error.message };

  await admin.from("activity_log").insert({
    user_id: userId,
    type: "Withdrawal",
    detail: `${amount.toFixed(2)} ${input.currency} requested to ${saved.address.slice(0, 4)}…${saved.address.slice(-6)}`,
    status: "Pending",
  });

  revalidatePath("/account");
  revalidatePath("/admin/requests");
  return {};
}

// Opens the payout screenshot the admin attached when fulfilling a withdrawal.
export async function getPayoutProofUrl(requestId: string): Promise<{ url?: string; error?: string }> {
  // User-scoped client: row-level security guarantees it's the caller's own request.
  const supabase = await createClient();
  const { data } = await supabase
    .from("withdrawal_requests")
    .select("admin_proof_storage_path")
    .eq("id", requestId)
    .maybeSingle();
  if (!data?.admin_proof_storage_path) return { error: "No payout proof on this request." };

  const url = await signedUrl("payment-proofs", data.admin_proof_storage_path);
  return url ? { url } : { error: "Could not open the proof." };
}
