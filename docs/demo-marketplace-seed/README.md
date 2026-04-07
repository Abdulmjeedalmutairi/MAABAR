# Demo marketplace seeding plan

> Synthetic demo-safe data only. No real company records, licenses, or private documents.

## Chosen approach

Use the mechanisms that already exist in this repo/runtime instead of inventing a new backend path:

1. **Existing auth/profile flow** creates the user shell.
2. **Existing Supabase tables** (`profiles`, `products`, `requests`) hold the marketplace-facing data.
3. This package prepares:
   - account manifest for demo suppliers/traders
   - rich profile patch data
   - import-ready SQL that updates profiles by **email** and inserts products/requests idempotently

## Why this approach

- `src/pages/AdminSeed.jsx` only supports very small AI-driven inserts for requests/products. It is not a real bulk marketplace seeder and cannot create the supplier/trader account base.
- Current repo already depends on Supabase tables and real auth flows, so the safest implementation is to prepare deterministic synthetic data for those exact tables.

## Dataset created

- Sectors: **10**
- Suppliers: **10**
- Traders: **15**
- Products: **100** (**10 per supplier**)
- Requests: **20**

## Sector coverage

- Consumer Electronics & Mobile Accessories (electronics)
- Smart Home, Access Control & Security (electronics)
- Solar Energy, Inverters & Storage (electronics)
- Building Materials, Fixtures & Hardware (building)
- Hospitality, Office & Residential Furniture (furniture)
- Packaging, Labels & Printing (other)
- Textiles, Uniforms & Apparel (clothing)
- Beauty Packaging & Personal Care Tools (other)
- Food Service, Kitchen & HORECA Supplies (food)
- Industrial Tools, Safety & Site Equipment (building)

## Important constraint discovered

The current app exposes only **6 first-class product/request categories** in UI filters (`electronics`, `furniture`, `clothing`, `building`, `food`, `other`).

So this seed covers **10 commercial sectors**, but some sectors are mapped into the nearest existing app category while preserving full sector identity through:
- supplier `speciality`
- company descriptions
- product naming/specs
- request titles/descriptions

## Prepared files

- `account-manifest.json`
- `demo-marketplace-seed.bundle.json`
- `demo-marketplace-seed.sql`
- `seed-demo-auth-users.request.example.json`
- `../../scripts/invoke_demo_seed_auth_users.js`
- `../../supabase/functions/seed-demo-auth-users/index.ts`

## Temporary live execution path (safe admin path)

A temporary Supabase Edge Function now exists in-repo at:

- `supabase/functions/seed-demo-auth-users/index.ts`

What it does:

- reads the checked-in static demo manifest (`docs/demo-marketplace-seed/account-manifest.json`, bundled into the function)
- requires a **real authenticated admin user token**; anon-only calls are rejected
- uses the function's server-side `SUPABASE_SERVICE_ROLE_KEY` to create or update demo auth users safely
- marks emails as confirmed (`email_confirm: true`)
- upserts the matching `public.profiles` shell rows with `is_seed=true`, `role`, `status`, and the signup profile fields
- supports **dry-run first**, then `apply=true`
- supports either one shared operator-supplied password or generated per-account passwords (returned only when explicitly requested)

## Exact operator flow

### 1) Deploy the temporary function

```bash
supabase functions deploy seed-demo-auth-users --project-ref utzalmszfqfcofywfetv
```

### 2) Prepare the request body locally

Start from:

- `docs/demo-marketplace-seed/seed-demo-auth-users.request.example.json`

Recommended first pass:

```json
{
  "apply": false,
  "scope": "all",
  "defaultPassword": "CHANGE_ME_PRIVATE_STRONG_PASSWORD",
  "includePasswords": false
}
```

Then change `apply` to `true` only after the dry-run looks clean.

### 3) Get a current admin access token

Use a real admin session token from the live Maabar admin login. One practical path from browser DevTools while logged in as admin:

```js
JSON.parse(localStorage.getItem('sb-utzalmszfqfcofywfetv-auth-token')).access_token
```

Do **not** use the service role key here.

### 4) Invoke the function from this repo

```bash
MAABAR_ADMIN_JWT="<ADMIN_ACCESS_TOKEN>" \
node scripts/invoke_demo_seed_auth_users.js \
  docs/demo-marketplace-seed/seed-demo-auth-users.request.example.json
```

### 5) Apply the marketplace SQL only after auth seeding succeeds

Run `docs/demo-marketplace-seed/demo-marketplace-seed.sql` through the approved admin SQL path (Supabase SQL editor or the operator's existing approved management path).

### 6) Spot-check after SQL apply

- public suppliers directory
- public products directory
- product detail
- supplier public profile
- public requests list

## Execution notes / blockers

### Ready now
- Rich synthetic dataset is prepared and deterministic.
- A safe temporary admin-only auth-user creation path is now in-repo.
- SQL is import-ready once the demo auth users/profiles are created successfully.

### Remaining blockers before full live execution
- The function still needs to be **deployed** by the main agent/operator.
- Invocation still requires a valid **admin access token** from a real admin session.
- If the dry-run reports `blocked` accounts (for example mismatched/orphan profile/auth rows), those rows need cleanup before applying the SQL.
- Private supplier verification documents are intentionally **not** generated or uploaded. That remains out of scope for this demo-safe seed.
