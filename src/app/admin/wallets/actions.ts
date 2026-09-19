"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export async function addWallet(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!label || !address) return { error: "Enter a label and an address." };
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
    return { error: "Enter a valid TRC20 address (starts with T, 34 characters)." };
  }

  const { error } = await createAdminClient().from("platform_wallets").insert({ label, address });
  if (error) return { error: error.message };

  revalidatePath("/admin/wallets");
  return {};
}

export async function setWalletActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("walletId") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await createAdminClient().from("platform_wallets").update({ active }).eq("id", id);
  revalidatePath("/admin/wallets");
}
