import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function Tile({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <div className="text-[11.5px] font-bold uppercase tracking-wide text-text-dim">{label}</div>
      <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-text">{value}</div>
    </>
  );
  const cls = "rounded-2xl border border-border bg-surface p-4 shadow-sm";
  return href ? (
    <Link href={href} className={`${cls} transition hover:border-accent`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const count = async (table: "profiles" | "deposit_requests" | "withdrawal_requests", col?: string, val?: string) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (col && val) q = q.eq(col, val);
    return (await q).count ?? 0;
  };

  const [pendingKyc, pendingDeposits, pendingWithdrawals, totalUsers] = await Promise.all([
    count("profiles", "kyc_status", "pending"),
    count("deposit_requests", "status", "pending"),
    count("withdrawal_requests", "status", "pending"),
    count("profiles"),
  ]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Pending KYC" value={pendingKyc} href="/admin/users" />
        <Tile label="Pending deposits" value={pendingDeposits} href="/admin/requests" />
        <Tile label="Pending withdrawals" value={pendingWithdrawals} href="/admin/requests" />
        <Tile label="Total users" value={totalUsers} />
      </div>
      <p className="mt-6 text-[13px] text-text-dim">
        The balance ledger and full activity history land in the next build phase.
      </p>
    </div>
  );
}
