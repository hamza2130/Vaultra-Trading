import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { PublicNav } from "@/components/PublicNav";
import { createClient } from "@/lib/supabase/server";

// Home, Markets, and coin detail pages are viewable by anyone — logged in or
// not, whatever their KYC status. A logged-in visitor gets the normal app
// nav (Markets + Account); a stranger gets the marketing nav with sign-in
// / sign-up links. Nothing here redirects.
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return (
      <>
        <PublicNav />
        <main>{children}</main>
      </>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  return (
    <>
      <AppNav displayName={profile?.full_name ?? "Account"} isAdmin={profile?.role === "admin"} />
      <main>{children}</main>
    </>
  );
}
