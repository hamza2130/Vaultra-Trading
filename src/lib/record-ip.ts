import "server-only";
import { isPublicIp } from "@/lib/client-ip";
import { createAdminClient } from "@/lib/supabase/admin";

const REFRESH_MS = 10 * 60 * 1000;

// Remembers which IPs a user has been seen from, so a later restriction can block
// them. Never throws: failing to record an IP must not break login or page loads.
// Only public addresses are kept — loopback/private ones can never be blocked.
export async function recordIp(userId: string, ip: string | null): Promise<void> {
  if (!ip || !isPublicIp(ip)) return;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("user_ips")
      .select("last_seen")
      .eq("user_id", userId)
      .eq("ip", ip)
      .maybeSingle();
    if (data && Date.now() - new Date(data.last_seen).getTime() < REFRESH_MS) return;

    await admin
      .from("user_ips")
      .upsert({ user_id: userId, ip, last_seen: new Date().toISOString() }, { onConflict: "user_id,ip" });
  } catch {
    // best effort
  }
}
