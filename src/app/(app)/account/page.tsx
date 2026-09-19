import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { ProfileForm } from "./ProfileForm";
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
              ${profile?.balance.toFixed(2) ?? "0.00"}
            </div>
            <p className="mt-3 text-[12px] text-text-faint">
              Deposit and withdraw requests land in the next build phase.
            </p>
          </Card>
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            username={profile?.username ?? ""}
            email={profile?.email ?? ""}
          />
        </div>
        <SavedAddresses addresses={addresses ?? []} />
      </div>
    </div>
  );
}
