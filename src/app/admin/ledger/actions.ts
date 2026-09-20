"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export async function editBalance(input: {
  userId: string;
  newBalance: string;
  note: string;
}): Promise<{ error?: string }> {
  const adminId = await requireAdmin();

  const raw = input.newBalance.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    return { error: "Enter the new balance as a number with up to 2 decimals." };
  }

  const { error } = await createAdminClient().rpc("set_balance", {
    p_user: input.userId,
    p_new: Number(raw),
    p_note: input.note.slice(0, 200),
    p_admin: adminId,
  });
  if (error) return { error: error.message.replace(/^.*?exception:\s*/i, "") };

  revalidatePath("/admin/ledger");
  revalidatePath("/admin/history");
  return {};
}
