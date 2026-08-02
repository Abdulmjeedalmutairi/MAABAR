import { useState, useCallback, useRef } from 'react';
import { sb } from '../supabase';
import { ATTACH_MAX_BYTES, ATTACH_MAX_COUNT } from '../lib/requestFormOptions';

let _seq = 0;
const uid = () => `${Date.now().toString(36)}${(_seq++).toString(36)}`;
const safeName = (name) => String(name || 'file').replace(/[^\w.-]+/g, '_').slice(-80);

const MSG = {
  ar: { count: `الحد الأقصى ${ATTACH_MAX_COUNT} ملفات.`, big: (n) => `«${n}» أكبر من 10 ميجابايت.` },
  en: { count: `Up to ${ATTACH_MAX_COUNT} files.`, big: (n) => `"${n}" is larger than 10 MB.` },
  zh: { count: `最多 ${ATTACH_MAX_COUNT} 个文件。`, big: (n) => `“${n}” 超过 10 MB。` },
};

// Holds picked files in memory and uploads them to the PRIVATE request-attachments
// bucket only at SUBMIT time (after auth is confirmed) — a buyer can compose the
// request before signing in, and files never hit storage until the request is sent.
export default function useAttachmentPicker(lang = 'ar') {
  const m = MSG[lang] || MSG.ar;
  const [files, setFiles] = useState([]); // [{ id, file, name, size }]
  const [error, setError] = useState('');
  const sessionRef = useRef(uid()); // one folder per compose session

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList || []);
    setError('');
    setFiles((prev) => {
      const next = [...prev];
      for (const f of incoming) {
        if (next.length >= ATTACH_MAX_COUNT) { setError(m.count); break; }
        if (f.size > ATTACH_MAX_BYTES) { setError(m.big(f.name)); continue; }
        next.push({ id: uid(), file: f, name: f.name, size: f.size });
      }
      return next;
    });
  }, [m]);

  const removeFile = useCallback((id) => setFiles((prev) => prev.filter((x) => x.id !== id)), []);
  const reset = useCallback(() => { setFiles([]); setError(''); sessionRef.current = uid(); }, []);

  // Upload all held files → array of object paths in the bucket. Throws on error.
  const uploadAll = useCallback(async (userId) => {
    const paths = [];
    for (const item of files) {
      const path = `${userId}/${sessionRef.current}/${uid()}_${safeName(item.name)}`;
      const { error: upErr } = await sb.storage.from('request-attachments')
        .upload(path, item.file, { upsert: true, contentType: item.file.type || undefined });
      if (upErr) throw upErr;
      paths.push(path);
    }
    return paths;
  }, [files]);

  return { files, error, addFiles, removeFile, reset, uploadAll };
}
