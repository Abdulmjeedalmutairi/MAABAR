# Tech Debt & Known Issues

Tracked, non-sensitive engineering debt. Newest first.

---

## Phone-registered suppliers' optional email is unverified
**Logged:** 2026-07-26 · **Severity:** Low–Medium (data quality / deliverability) · **Status:** intentionally deferred

Phone is the default supplier signup method (Supabase phone provider, confirmations
off — live session, no OTP). Email is optional in the signup wizard. When a
phone-registered supplier supplies that optional email, it is written **profile-only**:

`src/pages/Login.jsx` (~L636-639) runs `sb.from('profiles').update({ email })` after the
phone `signUp`. It does **not** set `auth.users.email`, does **not** call
`signUp`/`resend`, and sends **no** confirmation email. So the address lands in
`profiles.email` while `auth.users.email` stays `null` — stored, but never confirmed to
belong to that supplier.

**Why this matters:** `profiles.email` is the field the admin bulk-email system reads,
including the "unverified email" segment (`admin_email_segment`). This produces addresses
that look present and segmentable but are unverified — a typo or someone else's address
is still selectable and mailable, which hurts deliverability and can mail the wrong
person. (The verification RPC is unaffected: `submit_supplier_verification` checks
`auth.users.confirmed_at`, which phone confirmation sets — not `profiles.email`.)

**Status:** intentionally deferred — no signup/auth change now; logged for future
consideration. If picked up, options include: (a) route the optional email through a real
confirmation (`auth.updateUser({ email })` → Supabase confirmation) so `auth.users.email`
is set and verified before it reaches `profiles.email`; or (b) flag `profiles.email` rows
that lack a matching confirmed `auth.users.email` so the bulk-email segments can exclude
them.

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
