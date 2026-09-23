"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT_RE = /^-?\d+(\.\d{1,2})?$/;

// One entry per user per day — posting again for the same date overwrites it.
export async function setDailyPnl(input: {
  userId: string;
  date: string;
  amount: string;
  note: string;
}): Promise<{ error?: string }> {
  const adminId = await requireAdmin();

  const date = input.date.trim();
  const amountRaw = input.amount.trim();
  if (!DATE_RE.test(date)) return { error: "Choose a valid date." };
  if (new Date(date).getTime() > Date.now()) return { error: "Can't post PnL for a future date." };
  if (!AMOUNT_RE.test(amountRaw)) return { error: "Enter an amount with up to 2 decimals (negative allowed)." };

  const admin = createAdminClient();
  const { data: user } = await admin.from("profiles").select("full_name").eq("id", input.userId).maybeSingle();
  if (!user) return { error: "User not found." };

  const amount = Number(amountRaw);
  const { error } = await admin.from("daily_pnl").upsert(
    {
      user_id: input.userId,
      entry_date: date,
      amount,
      note: input.note.trim().slice(0, 200) || null,
      created_by: adminId,
    },
    { onConflict: "user_id,entry_date" },
  );
  if (error) return { error: error.message };

  await admin.from("activity_log").insert({
    user_id: input.userId,
    type: "PnL",
    detail: `${user.full_name} posted ${amount >= 0 ? "+" : ""}${amount.toFixed(2)} PnL for ${date}`,
    status: "Approved",
  });

  revalidatePath("/admin/pnl");
  revalidatePath("/account");
  return {};
}

export async function deleteDailyPnl(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("daily_pnl").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/pnl");
  revalidatePath("/account");
  return {};
}
