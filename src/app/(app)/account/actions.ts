"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();

  if (!fullName || !username) {
    return { error: "Name and username can't be empty." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not signed in." };

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", userData.user.id)
    .maybeSingle();
  if (taken) return { error: "That username is already taken." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, username })
    .eq("id", userData.user.id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}

export async function addSavedAddress(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const label = String(formData.get("label") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!label || !address) return { error: "Enter a label and address." };
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
    return { error: "Enter a valid TRC20 address (starts with T, 34 characters)." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("saved_withdrawal_addresses")
    .insert({ user_id: userData.user.id, label, address });
  if (error) return { error: error.message };

  revalidatePath("/account");
  return {};
}

export async function removeSavedAddress(formData: FormData): Promise<void> {
  const id = String(formData.get("addressId") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("saved_withdrawal_addresses").delete().eq("id", id);
  revalidatePath("/account");
}
