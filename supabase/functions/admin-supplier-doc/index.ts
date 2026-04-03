import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeSupplierDocStoragePath(rawValue: string | null | undefined) {
  if (!rawValue) return '';
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  if (!trimmed.startsWith('http')) {
    return trimmed.replace(/^supplier-docs\//, '');
  }

  try {
    const parsed = new URL(trimmed);
    const bucketMarker = '/supplier-docs/';
    const markerIndex = parsed.pathname.indexOf(bucketMarker);
    if (markerIndex === -1) return '';
    return decodeURIComponent(parsed.pathname.slice(markerIndex + bucketMarker.length));
  } catch {
    return '';
  }
}

function normalizeMediaList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeSupplierDocStoragePath(typeof item === 'string' ? item : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => normalizeSupplierDocStoragePath(typeof item === 'string' ? item : ''))
          .filter(Boolean);
      }
    } catch {
      return [normalizeSupplierDocStoragePath(trimmed)].filter(Boolean);
    }

    return [normalizeSupplierDocStoragePath(trimmed)].filter(Boolean);
  }

  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: authData, error: authError } = await sb.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: adminProfile, error: adminProfileError } = await sb
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (adminProfileError || adminProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { supplierId, docPath, docType } = await req.json();
    if (!supplierId || (!docPath && !docType)) {
      return new Response(JSON.stringify({ error: 'Invalid request payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await sb
      .from('profiles')
      .select('license_photo,factory_photo,factory_images,factory_videos')
      .eq('id', supplierId)
      .maybeSingle();

    if (profileError) throw profileError;

    const allowedPaths = new Set<string>([
      normalizeSupplierDocStoragePath(profile?.license_photo),
      normalizeSupplierDocStoragePath(profile?.factory_photo),
      ...normalizeMediaList(profile?.factory_images),
      ...normalizeMediaList(profile?.factory_videos),
    ].filter(Boolean));

    const fallbackPath = docType === 'license'
      ? normalizeSupplierDocStoragePath(profile?.license_photo)
      : docType === 'factory'
        ? normalizeSupplierDocStoragePath(profile?.factory_photo)
        : '';

    const objectPath = normalizeSupplierDocStoragePath(docPath) || fallbackPath;

    if (!objectPath || !allowedPaths.has(objectPath)) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: signedData, error: signedError } = await sb.storage
      .from('supplier-docs')
      .createSignedUrl(objectPath, 60 * 10);

    if (signedError || !signedData?.signedUrl) {
      throw signedError || new Error('Failed to create signed URL');
    }

    const signedUrl = signedData.signedUrl.startsWith('http')
      ? signedData.signedUrl
      : `${SUPABASE_URL}${signedData.signedUrl}`;

    return new Response(JSON.stringify({ ok: true, signedUrl, path: objectPath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
