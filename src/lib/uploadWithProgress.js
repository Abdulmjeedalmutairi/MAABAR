import { sb, SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase';

// Upload a File to Supabase Storage with real byte-level progress.
//
// supabase-js `.upload()` runs on fetch(), which exposes NO upload-progress
// events — so a 200MB verification video looks frozen the entire time it is
// going out, with nothing for the user to see. This mirrors exactly what
// `.upload({ upsert })` does under the hood (a POST to the Storage REST object
// endpoint with the x-upsert header) but over XMLHttpRequest, whose
// `upload.onprogress` fires as the bytes leave the device. No new dependency,
// same wire path, same speed — the win is that the user can finally see it move.
//
// Returns the same `{ error }` shape callers already branch on, so it is a
// drop-in for `sb.storage.from(bucket).upload(path, file, { upsert:true })`.
export async function uploadWithProgress(bucket, path, file, { upsert = true, onProgress } = {}) {
  // The signed-in supplier's token — the Storage RLS policy on 'supplier-docs'
  // is what authorises writing under `${user.id}/…`. Fall back to anon only so
  // the request still forms; RLS will then reject it exactly as before.
  let token = SUPABASE_ANON_KEY;
  try {
    const { data } = await sb.auth.getSession();
    if (data?.session?.access_token) token = data.session.access_token;
  } catch { /* keep anon fallback */ }

  const encodedPath = String(path).split('/').map(encodeURIComponent).join('/');
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('x-upsert', upsert ? 'true' : 'false');
    xhr.setRequestHeader('cache-control', '3600');
    if (file.type) xhr.setRequestHeader('content-type', file.type);

    if (typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve({ error: null });
      } else {
        let message = `Upload failed (${xhr.status})`;
        try {
          const parsed = JSON.parse(xhr.responseText);
          message = parsed.message || parsed.error || message;
        } catch { /* keep the status-code message */ }
        resolve({ error: new Error(message) });
      }
    };
    xhr.onerror = () => resolve({ error: new Error('Network error during upload') });
    xhr.onabort = () => resolve({ error: new Error('Upload aborted') });

    xhr.send(file);
  });
}
