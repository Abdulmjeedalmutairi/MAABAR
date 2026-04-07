import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { demoSeedAccounts, demoSeedManifest, type DemoSeedAccount } from './manifest.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Scope = 'all' | 'suppliers' | 'traders';

type SeedRequest = {
  apply?: boolean;
  scope?: Scope;
  seedKeys?: string[];
  defaultPassword?: string;
  passwordBySeedKey?: Record<string, string>;
  generatePasswords?: boolean;
  includePasswords?: boolean;
};

type AccountResult = {
  seedKey: string;
  email: string;
  role: string;
  outcome: 'dry-run' | 'created' | 'updated' | 'blocked';
  authUserId: string | null;
  profileId: string | null;
  password?: string;
  notes: string[];
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function isApplyMode(body: SeedRequest) {
  return body.apply === true;
}

function isStrongPassword(value: string) {
  return typeof value === 'string' && value.length >= 12 && !/\s/.test(value);
}

function generatePassword(seedKey: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  const suffix = seedKey.replace(/[^a-z0-9]/gi, '').slice(-6) || 'seeded';
  return `Mb!${hex}${suffix}#`;
}

function maskPassword(value: string) {
  if (!value) return '';
  if (value.length <= 6) return '*'.repeat(value.length);
  return `${value.slice(0, 3)}${'*'.repeat(Math.max(4, value.length - 6))}${value.slice(-3)}`;
}

function getScopeAccounts(scope: Scope = 'all') {
  if (scope === 'suppliers') return demoSeedManifest.suppliers;
  if (scope === 'traders') return demoSeedManifest.traders;
  return demoSeedAccounts;
}

function pickAccounts(body: SeedRequest) {
  const selected = getScopeAccounts(body.scope ?? 'all');
  const requestedKeys = Array.isArray(body.seedKeys)
    ? [...new Set(body.seedKeys.map((value) => String(value || '').trim()).filter(Boolean))]
    : [];

  if (requestedKeys.length === 0) {
    return {
      accounts: selected,
      missingKeys: [],
    };
  }

  const selectedByKey = new Map(selected.map((account) => [account.seedKey, account]));
  const missingKeys = requestedKeys.filter((seedKey) => !selectedByKey.has(seedKey));
  const accounts = requestedKeys
    .map((seedKey) => selectedByKey.get(seedKey))
    .filter((account): account is DemoSeedAccount => Boolean(account));

  return { accounts, missingKeys };
}

function normalizeEmail(value: string) {
  return String(value || '').trim().toLowerCase();
}

function buildUserMetadata(account: DemoSeedAccount) {
  return {
    ...account.signupProfile,
    role: account.role,
    is_seed: true,
    seed_key: account.seedKey,
    seed_group: 'demo-marketplace',
    seeded_from_manifest: 'docs/demo-marketplace-seed/account-manifest.json',
  };
}

function buildAppMetadata(account: DemoSeedAccount) {
  return {
    role: account.role,
    is_seed: true,
    seed_key: account.seedKey,
    seed_group: 'demo-marketplace',
  };
}

function buildProfilePayload(account: DemoSeedAccount, userId: string) {
  return {
    id: userId,
    email: normalizeEmail(account.email),
    role: account.role,
    status: account.signupProfile.status,
    is_seed: true,
    ...account.signupProfile,
  };
}

async function listAllAuthUsers(adminSb: ReturnType<typeof createClient>) {
  const users: Array<{ id: string; email?: string | null; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }> = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminSb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const batch = data?.users || [];
    users.push(...batch);

    if (!data?.nextPage || batch.length === 0 || data.nextPage === page) {
      break;
    }

    page = data.nextPage;
  }

  return users;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed. Use POST.' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in function environment.' });
  }

  const adminSb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return json(401, { error: 'Missing bearer token.' });
    }

    const { data: callerAuth, error: callerAuthError } = await adminSb.auth.getUser(token);
    if (callerAuthError || !callerAuth.user) {
      return json(401, { error: 'Unauthorized caller.' });
    }

    const { data: callerProfile, error: callerProfileError } = await adminSb
      .from('profiles')
      .select('id, role, email')
      .eq('id', callerAuth.user.id)
      .maybeSingle();

    if (callerProfileError || callerProfile?.role !== 'admin') {
      return json(403, { error: 'Admin role required.' });
    }

    const body = ((await req.json().catch(() => ({}))) || {}) as SeedRequest;
    const apply = isApplyMode(body);
    const { accounts, missingKeys } = pickAccounts(body);

    if (missingKeys.length > 0) {
      return json(400, {
        error: 'Unknown seedKeys requested.',
        missingKeys,
      });
    }

    if (accounts.length === 0) {
      return json(400, { error: 'No demo accounts selected.' });
    }

    const passwordBySeedKey = Object.fromEntries(
      Object.entries(body.passwordBySeedKey || {}).map(([key, value]) => [key, String(value || '')]),
    );

    const weakPasswords = [
      ...(body.defaultPassword && !isStrongPassword(body.defaultPassword) ? ['defaultPassword'] : []),
      ...Object.entries(passwordBySeedKey)
        .filter(([, value]) => value && !isStrongPassword(value))
        .map(([seedKey]) => `passwordBySeedKey.${seedKey}`),
    ];

    if (weakPasswords.length > 0) {
      return json(400, {
        error: 'All supplied passwords must be at least 12 characters and contain no spaces.',
        weakPasswords,
      });
    }

    if (apply && body.generatePasswords === true && body.includePasswords !== true) {
      return json(400, {
        error: 'generatePasswords requires includePasswords=true so the operator does not lose the generated credentials.',
      });
    }

    const selectedEmails = accounts.map((account) => normalizeEmail(account.email));

    const [{ data: existingProfiles, error: existingProfilesError }, authUsers] = await Promise.all([
      adminSb
        .from('profiles')
        .select('id, email, role, status')
        .in('email', selectedEmails),
      listAllAuthUsers(adminSb),
    ]);

    if (existingProfilesError) throw existingProfilesError;

    const profileByEmail = new Map(
      (existingProfiles || []).map((profile) => [normalizeEmail(profile.email || ''), profile]),
    );
    const authUserByEmail = new Map(
      authUsers.map((user) => [normalizeEmail(user.email || ''), user]),
    );

    const results: AccountResult[] = [];

    for (const account of accounts) {
      const email = normalizeEmail(account.email);
      const existingProfile = profileByEmail.get(email) || null;
      const existingAuthUser = authUserByEmail.get(email) || null;
      const notes: string[] = [];

      if (existingProfile && existingAuthUser && existingProfile.id !== existingAuthUser.id) {
        results.push({
          seedKey: account.seedKey,
          email,
          role: account.role,
          outcome: 'blocked',
          authUserId: existingAuthUser.id,
          profileId: existingProfile.id,
          notes: ['Email already exists with mismatched auth user/profile ids. Clean this account manually before seeding.'],
        });
        continue;
      }

      if (existingProfile && !existingAuthUser) {
        results.push({
          seedKey: account.seedKey,
          email,
          role: account.role,
          outcome: 'blocked',
          authUserId: null,
          profileId: existingProfile.id,
          notes: ['Profile row exists but no matching auth user was found for this email. Investigate manually before applying.'],
        });
        continue;
      }

      const resolvedPassword = passwordBySeedKey[account.seedKey]
        || body.defaultPassword
        || (body.generatePasswords ? generatePassword(account.seedKey) : '');

      if (apply && !resolvedPassword) {
        results.push({
          seedKey: account.seedKey,
          email,
          role: account.role,
          outcome: 'blocked',
          authUserId: existingAuthUser?.id || null,
          profileId: existingProfile?.id || null,
          notes: ['No password supplied for apply=true. Provide defaultPassword, passwordBySeedKey, or generatePasswords=true.'],
        });
        continue;
      }

      if (!apply) {
        notes.push(existingAuthUser ? 'Auth user already exists and would be updated.' : 'Auth user would be created.');
        notes.push(existingProfile ? 'Profile row already exists and would be upserted.' : 'Profile row would be created.');
        results.push({
          seedKey: account.seedKey,
          email,
          role: account.role,
          outcome: 'dry-run',
          authUserId: existingAuthUser?.id || null,
          profileId: existingProfile?.id || null,
          password: resolvedPassword
            ? (body.includePasswords ? resolvedPassword : maskPassword(resolvedPassword))
            : undefined,
          notes,
        });
        continue;
      }

      const nextUserMetadata = {
        ...(existingAuthUser?.user_metadata || {}),
        ...buildUserMetadata(account),
      };
      const nextAppMetadata = {
        ...(existingAuthUser?.app_metadata || {}),
        ...buildAppMetadata(account),
      };

      let authUserId = existingAuthUser?.id || null;
      let outcome: AccountResult['outcome'] = existingAuthUser ? 'updated' : 'created';

      if (existingAuthUser) {
        const { data: updatedAuth, error: updatedAuthError } = await adminSb.auth.admin.updateUserById(existingAuthUser.id, {
          email,
          password: resolvedPassword,
          email_confirm: true,
          user_metadata: nextUserMetadata,
          app_metadata: nextAppMetadata,
        });

        if (updatedAuthError || !updatedAuth.user) {
          results.push({
            seedKey: account.seedKey,
            email,
            role: account.role,
            outcome: 'blocked',
            authUserId: existingAuthUser.id,
            profileId: existingProfile?.id || null,
            password: body.includePasswords ? resolvedPassword : maskPassword(resolvedPassword),
            notes: [`Auth update failed: ${updatedAuthError?.message || 'Unknown error'}`],
          });
          continue;
        }

        authUserId = updatedAuth.user.id;
        notes.push('Confirmed existing auth user and refreshed metadata/password.');
      } else {
        const { data: createdAuth, error: createdAuthError } = await adminSb.auth.admin.createUser({
          email,
          password: resolvedPassword,
          email_confirm: true,
          user_metadata: nextUserMetadata,
          app_metadata: nextAppMetadata,
        });

        if (createdAuthError || !createdAuth.user) {
          results.push({
            seedKey: account.seedKey,
            email,
            role: account.role,
            outcome: 'blocked',
            authUserId: null,
            profileId: existingProfile?.id || null,
            password: body.includePasswords ? resolvedPassword : maskPassword(resolvedPassword),
            notes: [`Auth create failed: ${createdAuthError?.message || 'Unknown error'}`],
          });
          continue;
        }

        authUserId = createdAuth.user.id;
        notes.push('Created confirmed auth user from static demo manifest.');
      }

      const profilePayload = buildProfilePayload(account, authUserId);
      const { data: upsertedProfile, error: upsertProfileError } = await adminSb
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select('id, email, role, status')
        .single();

      if (upsertProfileError) {
        results.push({
          seedKey: account.seedKey,
          email,
          role: account.role,
          outcome: 'blocked',
          authUserId,
          profileId: existingProfile?.id || null,
          password: body.includePasswords ? resolvedPassword : maskPassword(resolvedPassword),
          notes: [`Profile upsert failed after auth ${outcome}: ${upsertProfileError.message}`],
        });
        continue;
      }

      notes.push(`Profile upserted with status=${upsertedProfile.status} and is_seed=true.`);

      results.push({
        seedKey: account.seedKey,
        email,
        role: account.role,
        outcome,
        authUserId,
        profileId: upsertedProfile.id,
        password: body.includePasswords ? resolvedPassword : maskPassword(resolvedPassword),
        notes,
      });
    }

    const blocked = results.filter((item) => item.outcome === 'blocked');
    const created = results.filter((item) => item.outcome === 'created').length;
    const updated = results.filter((item) => item.outcome === 'updated').length;
    const dryRun = results.filter((item) => item.outcome === 'dry-run').length;

    return json(200, {
      ok: blocked.length === 0,
      apply,
      manifestSource: 'docs/demo-marketplace-seed/account-manifest.json',
      sqlBundlePath: 'docs/demo-marketplace-seed/demo-marketplace-seed.sql',
      selectedCount: accounts.length,
      summary: {
        created,
        updated,
        dryRun,
        blocked: blocked.length,
      },
      nextStep: blocked.length === 0 && apply
        ? 'Auth demo accounts are ready. Apply docs/demo-marketplace-seed/demo-marketplace-seed.sql through your approved admin SQL path.'
        : blocked.length === 0
          ? 'Dry-run only. Re-run with apply=true to create/update auth users.'
          : 'Resolve blocked accounts before applying the SQL seed.',
      results,
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
