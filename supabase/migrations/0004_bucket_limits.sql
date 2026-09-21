-- Defense in depth for the two private buckets. The app already validates uploads,
-- but the storage layer enforces the same rules for any writer (including bugs):
-- images or PDFs only, 5MB max (the app's own cap is 4MB).
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
where id in ('kyc-documents', 'payment-proofs');
