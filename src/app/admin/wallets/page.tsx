import { createClient } from "@/lib/supabase/server";
import { WalletsClient } from "./WalletsClient";

export default async function AdminWalletsPage() {
  const supabase = await createClient();
  const { data: wallets } = await supabase
    .from("platform_wallets")
    .select("id, label, address, network, active")
    .order("created_at", { ascending: true });

  return <WalletsClient wallets={wallets ?? []} />;
}
