// Vercel rejects request bodies over ~4.5MB before our code runs, so uploads (which
// go through server actions) must stay safely under that. Images are shrunk in the
// browser first (see prepare-upload.ts) so phone photos fit.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "4MB";
