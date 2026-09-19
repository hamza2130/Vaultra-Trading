import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { BalanceActions } from "./BalanceActions";
import { ProfileForm } from "./ProfileForm";
import { RequestHistory, type RequestItem } from "./RequestHistory";
import { SavedAddresses } from "./SavedAddresses";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, email, balance")
    .eq("id", userData.user!.id)
    .single();
  const { data: addresses } = await supabase
    .from("saved_withdrawal_addresses")
    .select("id, label, address")
    .order("created_at", { ascending: true });
  const { data: wallets } = await supabase
    .from("platform_wallets")
    .select("id, label, address")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1);
  const { data: deposits } = await supabase
    .from("deposit_requests")
    .select("id, amount, currency, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  const { data: withdrawals } = await supabase
    .from("withdrawal_requests")
    .select("id, amount, currency, status, created_at, reject_reason, admin_proof_storage_path")
    .order("created_at", { ascending: false })
    .limit(10);

  const balance = Number(profile?.balance ?? 0);
  const reserved = (withdrawals ?? [])
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const items: RequestItem[] = [
    ...(deposits ?? []).map((d) => ({
      id: d.id,
      kind: "Deposit" as const,
      amount: Number(d.amount),
      currency: d.currency,
      status: d.status,
      createdAt: d.created_at,
      rejectReason: null,
      hasPayoutProof: false,
    })),
    ...(withdrawals ?? []).map((w) => ({
      id: w.id,
      kind: "Withdrawal" as const,
      amount: Number(w.amount),
      currency: w.currency,
      status: w.status,
      createdAt: w.created_at,
      rejectReason: w.reject_reason,
      hasPayoutProof: !!w.admin_proof_storage_path,
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-10">
      <h1 className="font-display text-xl font-extrabold text-text">Account</h1>
      <p className="mt-1 text-[13px] text-text-dim">Balance, profile, and withdrawal destinations.</p>
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Card>
            <span className="text-xs font-semibold uppercase tracking-wide text-text-dim">
              Available balance
            </span>
            <div className="mt-1.5 font-mono text-4xl font-bold tabular-nums text-text">
              ${balance.toFixed(2)}
            </div>
            {reserved > 0 ? (
              <p className="mt-1 text-[12px] text-text-faint">
                ${reserved.toFixed(2)} is reserved for pending withdrawals.
              </p>
            ) : null}
            <BalanceActions
              wallet={wallets?.[0] ?? null}
              addresses={addresses ?? []}
              available={Math.max(balance - reserved, 0)}
            />
          </Card>
          <RequestHistory items={items} />
        </div>
        <div className="flex flex-col gap-5">
          <SavedAddresses addresses={addresses ?? []} />
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            username={profile?.username ?? ""}
            email={profile?.email ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
