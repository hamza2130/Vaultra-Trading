"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { DocType } from "@/lib/supabase/types";

const DOC_TYPES: DocType[] = ["national_id", "passport", "student_card"];

export async function registerUser(
  _prevState: { error: string } | undefined,
  formData: FormData,
): Promise<{ error: string }> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const docType = String(formData.get("docType") ?? "") as DocType;
  const doc = formData.get("document");

  if (!fullName || !email || !username || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!DOC_TYPES.includes(docType)) {
    return { error: "Select a document type." };
  }
  if (!(doc instanceof File) || doc.size === 0) {
    return { error: "Upload an ID document." };
  }
  if (doc.size > 6 * 1024 * 1024) {
    return { error: "Document must be smaller than 6MB." };
  }

  const admin = createAdminClient();

  // Blocked before it ever reaches an admin queue.
  const { data: blacklisted } = await admin
    .from("email_blacklist")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (blacklisted) {
    return { error: "This email cannot be registered." };
  }

  const { data: usernameTaken } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (usernameTaken) {
    return { error: "That username is already taken." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return { error: createError?.message ?? "Could not create account." };
  }
  const userId = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email,
    username,
    full_name: fullName,
    role: "user",
    kyc_status: "pending",
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Could not create profile: " + profileError.message };
  }

  const ext = doc.name.split(".").pop() ?? "bin";
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from("kyc-documents")
    .upload(storagePath, doc, { contentType: doc.type });
  if (uploadError) {
    return { error: "Could not upload document: " + uploadError.message };
  }

  await admin.from("kyc_documents").insert({
    user_id: userId,
    doc_type: docType,
    storage_path: storagePath,
  });

  await admin.from("activity_log").insert({
    user_id: userId,
    type: "Registration",
    detail: `Submitted ${docType.replace("_", " ")} for KYC review`,
    status: "Pending",
  });

  // Sign the new user in so the proxy can route them to /pending.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    redirect("/login");
  }

  redirect("/pending");
}
