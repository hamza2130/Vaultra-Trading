import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

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
