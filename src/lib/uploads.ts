import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/;

export function validateProofFile(file: FormDataEntryValue | null): string | null {
  if (!(file instanceof File) || file.size === 0) return "Attach a screenshot or PDF.";
  if (file.size > MAX_BYTES) return "File must be smaller than 6MB.";
  if (!ALLOWED.test(file.type)) return "Only images (PNG, JPG, WebP, GIF) or PDF files are allowed.";
  return null;
}

// Uploads into a private bucket under `<ownerId>/…` and returns the storage path.
export async function uploadToBucket(
  bucket: "payment-proofs" | "kyc-documents",
  ownerId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  const ext = (file.name.split(".").pop() ?? "bin").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "bin";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await createAdminClient()
    .storage.from(bucket)
    .upload(path, file, { contentType: file.type });
  return error ? { error: error.message } : { path };
}

export async function signedUrl(
  bucket: "payment-proofs" | "kyc-documents",
  path: string,
  seconds = 300,
): Promise<string | null> {
  const { data } = await createAdminClient().storage.from(bucket).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}
