import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { AppNav } from "@/components/AppNav";
import { getRequestIp } from "@/lib/client-ip";
import { recordIp } from "@/lib/record-ip";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  // Sessions last long after login, so keep the user's current IP up to date.
  // Request headers must be read here, before scheduling the after-response work.
  const userId = userData.user.id;
  const ip = await getRequestIp();
  after(() => recordIp(userId, ip));

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userData.user.id)
    .single();

  return (
    <>
      <AppNav displayName={profile?.full_name ?? "Account"} isAdmin={profile?.role === "admin"} />
      <main>{children}</main>
    </>
  );
}
