import "server-only";
import { createClient } from "@/lib/supabase/server";

// Every admin server action must call this first: server actions are reachable
// by direct POST, so hiding the button in the UI is not access control.
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return userData.user.id;
}

// Any signed-in, approved user (not pending / restricted).
export async function requireApprovedUser(): Promise<string> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("kyc_status")
    .eq("id", userData.user.id)
    .single();
  if (profile?.kyc_status !== "approved") throw new Error("Forbidden");
  return userData.user.id;
}
