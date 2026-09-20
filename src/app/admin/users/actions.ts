"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPublicIp } from "@/lib/client-ip";
import { requireAdmin } from "@/lib/require-admin";

export async function getKycDocUrl(userId: string): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: doc } = await admin
    .from("kyc_documents")
    .select("storage_path")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!doc) return { error: "No document on file." };

  const { data, error } = await admin.storage
    .from("kyc-documents")
    .createSignedUrl(doc.storage_path, 300);
  if (error || !data) return { error: error?.message ?? "Could not open document." };

  return { url: data.signedUrl };
}

export async function approveKyc(userId: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: user, error } = await admin
    .from("profiles")
    .update({ kyc_status: "approved" })
    .eq("id", userId)
    .select("full_name")
    .single();
  if (error) return { error: error.message };

  await admin.from("activity_log").insert({
    user_id: userId,
    type: "Registration",
    detail: `${user.full_name} approved after KYC review`,
    status: "Approved",
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return {};
}

export async function rejectKyc(userId: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: user, error: fetchError } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();
  if (fetchError || !user) return { error: fetchError?.message ?? "User not found." };

  await admin.from("activity_log").insert({
    user_id: userId,
    type: "Registration",
    detail: `${user.full_name} (${user.email}) rejected on review — email blacklisted permanently`,
    status: "Rejected",
  });

  await admin.from("email_blacklist").insert({
    email: user.email,
    reason: "Rejected on KYC review",
  });

  // Cascades: profile row and kyc_documents are removed via FK on delete cascade.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return {};
}

export type RestrictResult = { error?: string; blocked?: number; skipped?: number };

// Locks the account and blocks every public IP the user has been seen from.
// Deterrent, not a guarantee: a VPN or a new network gets around an IP block.
export async function restrictUser(userId: string): Promise<RestrictResult> {
  const adminId = await requireAdmin();
  if (userId === adminId) return { error: "You can't restrict your own account." };
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { error: "User not found." };
  if (target.role === "admin") return { error: "Admin accounts can't be restricted." };

  const { error } = await admin.from("profiles").update({ kyc_status: "restricted" }).eq("id", userId);
  if (error) return { error: error.message };

  const { data: seen } = await admin.from("user_ips").select("ip").eq("user_id", userId);
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  const { data: adminIps } = admins?.length
    ? await admin.from("user_ips").select("ip").in("user_id", admins.map((a) => a.id))
    : { data: [] };

  // Never block an IP an admin also uses (e.g. a shared office network).
  const adminOwned = new Set((adminIps ?? []).map((r) => r.ip));
  const all = (seen ?? []).map((r) => r.ip);
  const eligible = all.filter((ip) => isPublicIp(ip) && !adminOwned.has(ip));

  if (eligible.length > 0) {
    await admin.from("blocked_ips").upsert(
      eligible.map((ip) => ({ ip, user_id: userId, reason: `Restricted: ${target.full_name}` })),
      { onConflict: "ip", ignoreDuplicates: true },
    );
  }

  await admin.from("activity_log").insert({
    user_id: userId,
    type: "Restriction",
    detail: `${target.full_name} restricted by admin — ${eligible.length} IP${eligible.length === 1 ? "" : "s"} blocked${
      all.length > eligible.length ? `, ${all.length - eligible.length} skipped (private or shared with an admin)` : ""
    }`,
    status: "Restricted",
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/history");
  return { blocked: eligible.length, skipped: all.length - eligible.length };
}

// Lifts a restriction and releases the IPs that were blocked because of it.
export async function unrestrictUser(userId: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: user, error } = await admin
    .from("profiles")
    .update({ kyc_status: "approved" })
    .eq("id", userId)
    .eq("kyc_status", "restricted")
    .select("full_name")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!user) return { error: "That user isn't restricted." };

  await admin.from("blocked_ips").delete().eq("user_id", userId);
  await admin.from("activity_log").insert({
    user_id: userId,
    type: "Restriction",
    detail: `${user.full_name} unrestricted — access and blocked IPs restored`,
    status: "Approved",
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/history");
  return {};
}

export async function unblockIp(ip: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("blocked_ips").delete().eq("ip", ip);
  if (error) return { error: error.message };

  await admin.from("activity_log").insert({
    user_id: null,
    type: "Restriction",
    detail: `IP ${ip} unblocked by admin`,
    status: "Approved",
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/history");
  return {};
}
