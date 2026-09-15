import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, email, balance")
    .eq("id", userData.user!.id)
    .single();

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-10">
      <h1 className="font-display text-xl font-extrabold text-text">Account</h1>
      <p className="mt-1 text-[13px] text-text-dim">
        Balance and profile are wired to the database. Deposit/withdraw and saved addresses land
        in Phase 3.
      </p>
      <Card className="mt-6 max-w-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-dim">
          Available balance
        </span>
        <div className="mt-1.5 font-mono text-4xl font-bold tabular-nums text-text">
          ${profile?.balance.toFixed(2) ?? "0.00"}
        </div>
        <dl className="mt-5 space-y-2 border-t border-border-soft pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-dim">Name</dt>
            <dd className="font-medium text-text">{profile?.full_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-dim">Username</dt>
            <dd className="font-medium text-text">{profile?.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-dim">Email</dt>
            <dd className="font-medium text-text">{profile?.email}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
