"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
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

export async function restrictUser(userId: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: user, error } = await admin
    .from("profiles")
    .update({ kyc_status: "restricted" })
    .eq("id", userId)
    .select("full_name")
    .single();
  if (error) return { error: error.message };

  await admin.from("activity_log").insert({
    user_id: userId,
    type: "Restriction",
    detail: `${user.full_name} restricted by admin`,
    status: "Restricted",
  });

  revalidatePath("/admin/users");
  return {};
}
