import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";

const ALLOWED = /^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/;

export function validateProofFile(file: FormDataEntryValue | null): string | null {
  if (!(file instanceof File) || file.size === 0) return "Attach a screenshot or PDF.";
  if (file.size > MAX_UPLOAD_BYTES) return `File must be smaller than ${MAX_UPLOAD_LABEL}.`;
  if (!ALLOWED.test(file.type)) return "Only images (PNG, JPG, WebP, GIF) or PDF files are allowed.";
  return null;
}

type Detected = { mime: string; ext: string };

// The declared type comes from the uploader and can lie, so identify the file from
// its actual leading bytes ("magic numbers").
function detectType(b: Uint8Array): Detected | null {
  const ascii = (from: number, len: number) => String.fromCharCode(...b.slice(from, from + len));
  if (b.length >= 8 && b[0] === 0x89 && ascii(1, 3) === "PNG" && b[4] === 0x0d && b[5] === 0x0a) {
    return { mime: "image/png", ext: "png" };
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 6 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a")) return { mime: "image/gif", ext: "gif" };
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (b.length >= 5 && ascii(0, 5) === "%PDF-") return { mime: "application/pdf", ext: "pdf" };
  return null;
}

// Uploads into a private bucket under `<ownerId>/…` and returns the storage path.
// The stored type and extension come from the file's real contents, never from
// the uploader's filename or declared type.
export async function uploadToBucket(
  bucket: "payment-proofs" | "kyc-documents",
  ownerId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detected = detectType(head);
  if (!detected) return { error: "That file isn't a valid image or PDF." };

  const path = `${ownerId}/${crypto.randomUUID()}.${detected.ext}`;
  const { error } = await createAdminClient()
    .storage.from(bucket)
    .upload(path, file, { contentType: detected.mime });
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
