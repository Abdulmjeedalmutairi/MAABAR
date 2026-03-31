export const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
export const SUPABASE_ANON_FUNCTION_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

export async function sendMaabarEmail({ type, to, data }) {
  const res = await fetch(SEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_FUNCTION_KEY}`,
    },
    body: JSON.stringify({ type, to, data }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(payload?.error || payload?.message || `Email request failed (${res.status})`);
  }

  return payload;
}
