-- Widen the request-attachments bucket to accept Adobe Illustrator files (the
-- upload hint lists "AI"). Modern .ai files are often PDF-compatible (already
-- allowed); this adds the PostScript/Illustrator MIME types for the rest.
-- Additive only — existing allowed types are preserved.
begin;

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/postscript', 'application/illustrator'
]
where id = 'request-attachments';

commit;
