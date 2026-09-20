"use server";

import { redirect } from "next/navigation";
import { getRequestIp } from "@/lib/client-ip";
import { recordIp } from "@/lib/record-ip";
import { createClient } from "@/lib/supabase/server";

export async function loginUser(
  _prevState: { error: string } | undefined,
  formData: FormData,
): Promise<{ error: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Invalid email or password." };
  }

  if (data.user) await recordIp(data.user.id, await getRequestIp());

  redirect("/");
}
