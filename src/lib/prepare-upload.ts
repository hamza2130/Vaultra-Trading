import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "./upload-limits";

const MAX_DIMENSION = 2400;
const SHRINK_ABOVE_BYTES = 1.5 * 1024 * 1024;
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];

async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

  // Try progressively lower quality, then smaller dimensions, until it fits.
  for (let attempt = 0; attempt < 3; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of QUALITIES) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= MAX_UPLOAD_BYTES * 0.9) {
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      }
    }
    scale *= 0.7;
  }
  return file;
}

// Makes a chosen file safe to upload: large photos/screenshots are downscaled and
// re-encoded as JPEG; PDFs and small files pass through. Returns an error message
// instead of a file when it still can't fit.
export async function prepareUpload(file: File): Promise<{ file?: File; error?: string }> {
  let out = file;

  if (file.type.startsWith("image/") && file.type !== "image/gif" && file.size > SHRINK_ABOVE_BYTES) {
    try {
      out = await shrinkImage(file);
    } catch {
      out = file; // undecodable — let the server's validation have the final say
    }
  }

  if (out.size > MAX_UPLOAD_BYTES) {
    return {
      error: `That file is too large (max ${MAX_UPLOAD_LABEL}). ${
        file.type === "application/pdf" ? "Try a smaller PDF, or a photo instead." : "Try a smaller image."
      }`,
    };
  }
  return { file: out };
}
