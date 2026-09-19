import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";
import { AdminSideNav } from "@/components/AdminSideNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userData.user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { count: pendingCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("kyc_status", "pending");

  return (
    <div className="flex min-h-screen">
      <aside className="w-[230px] flex-shrink-0 border-r border-border bg-raised px-3.5 py-5">
        <div className="mb-5 flex items-center gap-2 px-2.5 font-display text-base font-extrabold text-text">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-ink text-[11px] font-extrabold text-[#04140F]">
            V
          </span>
          Vaultra <span className="text-[11px] font-semibold text-text-faint">ADMIN</span>
        </div>
        <AdminSideNav pendingCount={pendingCount ?? 0} />
      </aside>
      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-border bg-surface px-7 py-4">
          <h2 className="font-display text-[17px] font-extrabold text-text">Admin</h2>
          <form action={signOut}>
            <button type="submit" className="text-[12.5px] font-semibold text-text-dim hover:text-text">
              {profile?.full_name} · Sign out
            </button>
          </form>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}
