import { sb } from '../supabase';

// Send a MAABAR-branded email to a factory from the Admin Console. The factory's
// address is resolved server-side by the admin-factory-email edge function; here
// we just pass the structured content (the caller's JWT authorizes it).
export async function sendFactoryEmail({ factoryId, lang, headline, paragraphs, ctaUrl, ctaText }) {
  const { data, error } = await sb.functions.invoke('admin-factory-email', {
    body: { factoryId, lang, headline, paragraphs, ctaUrl, ctaText },
  });
  if (error) throw new Error(error.message || 'send failed');
  if (data?.error) throw new Error(data.error);
  return data;
}
