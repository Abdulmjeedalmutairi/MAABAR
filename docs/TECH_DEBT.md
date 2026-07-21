# Tech Debt & Known Issues

Tracked, non-sensitive engineering debt. Newest first.

---

## `profiles.verified` (boolean) is dead code
**Logged:** 2026-07-21 · **Severity:** Low (hygiene) · **Status:** open

The `profiles` table carries both a `verified` boolean and a `status` text column.
**`status` is the only source of truth. `verified` is never used.**

Verified 2026-07-21 across the web app, the mobile app, the edge functions and every
migration:

| Check | Result |
|---|---|
| Read in any `select`? | none |
| Filtered on (`.eq` / `.is`)? | none |
| Written to? | none |
| Accessed as a property (`profile.verified`)? | none |
| Referenced in any SQL / migration / policy? | none |

Supplier verification everywhere keys off `profiles.status`, including the
security-critical `is_verified_supplier()` behind the offers RLS policies, which
requires `status = 'verified'` **and** a non-empty `maabar_supplier_id` — so "verified"
for authorization purposes is strictly narrower than the status alone.

**Why this matters:** it is the same shape as the `email_logs` / `template_overrides`
trap elsewhere in this codebase — something that looks meaningful and silently does
nothing. A future `verified: true` write would have no effect and raise no error, and
anyone reading the schema could reasonably assume it is authoritative.

**When picked up:** either drop the column, or add
`COMMENT ON COLUMN public.profiles.verified IS 'DEPRECATED — unused; use status'`.
Check for cloud-only RLS policies referencing it before dropping: the base schema
lives only in the hosted database and is not reproducible from `supabase/migrations/`.

**Rule of thumb for this table:** build all verification/segment logic on `status`,
using the helpers in `src/lib/supplierOnboarding.js` rather than hardcoding values.
