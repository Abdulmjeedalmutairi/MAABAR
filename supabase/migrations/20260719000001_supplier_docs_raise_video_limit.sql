-- Raise the supplier-docs bucket file size limit 50MB -> 200MB so suppliers can
-- upload factory verification videos (phone videos routinely exceed 50MB).
--
-- IMPORTANT: the Supabase project's GLOBAL upload size limit must also be >= 200MB.
-- Set it in the dashboard: Storage -> Settings -> "Global file size limit" (Pro
-- plan). The per-bucket limit below can never exceed the global limit.
--
-- allowed_mime_types already includes video/mp4, video/webm, video/quicktime
-- (see 202604010110_supplier_docs_video_support.sql), so no MIME change needed.
update storage.buckets
   set file_size_limit = 209715200  -- 200 * 1024 * 1024
 where id = 'supplier-docs';
