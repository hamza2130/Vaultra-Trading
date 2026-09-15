import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { count: pendingCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("kyc_status", "pending");
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-[11.5px] font-bold uppercase tracking-wide text-text-dim">
            Pending KYC
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-text">
            {pendingCount ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-[11.5px] font-bold uppercase tracking-wide text-text-dim">
            Total users
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-text">
            {totalUsers ?? 0}
          </div>
        </div>
      </div>
      <p className="mt-6 text-[13px] text-text-dim">
        User review, request queue, wallets, and the balance ledger land in the next build
        phases.
      </p>
    </div>
  );
}
