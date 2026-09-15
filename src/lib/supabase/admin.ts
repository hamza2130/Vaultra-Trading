import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role client — bypasses RLS entirely. Server-only (the
 * `server-only` import throws if this is ever pulled into a client bundle).
 * Use for: blacklist/IP checks during registration, admin.createUser,
 * and privileged writes (balance_ledger, activity_log, admin proof uploads).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
