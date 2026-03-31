# MAABAR — Pre-release Supabase batch + final review checklist

_Date: 2026-03-31_

This is the final **no-deploy** handoff checklist for the MAABAR work completed in this session.

## What still needs to be applied later in one Supabase batch

### 1) Run these database/storage migrations in order
Apply these in Supabase **before** the related UI changes are expected to persist fully in production:

1. `supabase/migrations/202603310001_supplier_docs_privacy.sql`
   - Creates/updates the private `supplier-docs` storage bucket
   - Applies storage policies so suppliers can only manage their own verification docs
   - Needed for secure supplier verification document uploads and admin signed-link viewing

2. `supabase/migrations/202603310002_offer_shipping_breakdown.sql`
   - Adds `offers.shipping_cost`
   - Adds `offers.shipping_method`
   - Adds non-negative constraint for shipping cost
   - Needed for the new quote pricing breakdown flow

3. `supabase/migrations/202603310003_supplier_status_and_public_id.sql`
   - Adds `profiles.maabar_supplier_id`
   - Creates supplier ID sequence + trigger
   - Backfills IDs for existing approved/active suppliers
   - Adds unique partial index
   - Needed for the new supplier trust/identity flow and approval email ID block

4. `supabase/migrations/20260331_product_commerce_improvements.sql`
   - Adds `profiles.preferred_display_currency`
   - Adds `products.gallery_images`
   - Adds product spec fields (`spec_material`, `spec_dimensions`, `spec_unit_weight`, `spec_color_options`, `spec_packaging_details`, `spec_customization`, `spec_lead_time_days`)
   - Backfills `gallery_images` from legacy `image_url`
   - Needed for product preview/gallery/specs and display-currency persistence

---

### 2) Supabase Auth settings to verify
In **Supabase Auth > URL Configuration**:

- Confirm **Site URL** is correct for production
- Add/verify this redirect URL:
  - `https://maabar.io/auth/callback`
- Add dev callback(s) if needed by your local flow:
  - `http://localhost:3000/auth/callback`
  - add any other local origin you actually use

Why this matters:
- Supplier email confirmation now routes through `/auth/callback`
- Buyer email confirmation / resumed flows depend on the same callback
- Google buyer auth also returns through the callback route

---

### 3) Deploy / update these Supabase Edge Functions
These are the functions that matter for this session’s changes:

#### Required
- `send-email`
  - Needed for the new master email shell, language-aware emails, callback-related mail flows, and supplier approval email improvements
  - Also now supports both `APP_SUPABASE_*` and standard `SUPABASE_*` secrets for profile/lang/supplier-ID lookups

- `admin-supplier-doc`
  - Needed so admin can open private supplier verification docs via signed URLs

#### Verify whether still used in production
These changed earlier in the session, but the current frontend path mainly uses `send-email`:
- `notify-admin-new-supplier`
- `send-emails`
- `send-welcome-email`

If production still has DB/webhook triggers pointing at any of those, either:
- redeploy them too, or
- intentionally retire that old wiring so prod is not running stale templates/logic

---

### 4) Edge Function secrets / environment to verify

#### `send-email`
Required/important:
- `RESEND_API_KEY`
- `APP_SUPABASE_SERVICE_ROLE_KEY` **or** `SUPABASE_SERVICE_ROLE_KEY`
- `APP_SUPABASE_URL` **or** `SUPABASE_URL`

Why this matters:
- without a service-role key, the function can still send mail, but profile-based language inference and `maabar_supplier_id` lookup may fail
- that especially affects the richer supplier approval email

#### `admin-supplier-doc`
Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Only if still used
- `notify-admin-new-supplier`
  - `RESEND_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`

---

### 5) Supabase-side verification after applying the batch
Do these quick checks directly in Supabase after migrations/functions are applied:

#### Profiles / supplier IDs
- existing approved suppliers got `maabar_supplier_id` backfilled
- newly approved suppliers automatically receive a new ID
- no duplicate IDs exist

#### Storage bucket / policies
- `supplier-docs` bucket exists
- bucket is **private**
- allowed mime types and size limit match the migration
- supplier users can upload their own docs
- supplier users cannot read/write other suppliers’ docs

#### Offers schema
- inserting/updating offers with `shipping_cost` and `shipping_method` works
- negative shipping cost is rejected

#### Product/profile schema
- saving `preferred_display_currency` works on `profiles`
- saving product gallery/spec fields works on `products`
- legacy products still render even if new fields are empty

#### Supplier status compatibility
- old raw values such as `pending`, `under_review`, `submitted`, `review`, `approved` still behave correctly in admin review/public visibility flows
- public supplier visibility is still limited to approved/active suppliers only

---

## Final manual review checklist before eventual deploy

### Auth / callback flow
- [ ] Buyer email sign-up sends confirmation email and lands correctly on `/auth/callback`
- [ ] Buyer confirmed account ends up in the right destination (`/dashboard` or resumed AI/request flow)
- [ ] Supplier email sign-up sends confirmation email and lands correctly on `/auth/callback`
- [ ] Confirmed supplier lands in the pending/review-safe path, not operational dashboard access
- [ ] Resend confirmation email works
- [ ] Google buyer login still returns through the callback route and completes cleanly

### Supplier onboarding / admin review
- [ ] Supplier can upload business license and factory photo successfully
- [ ] Those files go to private storage, not public URLs
- [ ] Admin can open each supplier doc securely from admin using signed links
- [ ] Admin pending-supplier list still loads correctly
- [ ] Approve supplier works
- [ ] Reject supplier works
- [ ] Supplier approval email renders correctly and includes `maabar_supplier_id` once available
- [ ] Approved supplier becomes publicly visible in the expected places only after approval

### Supplier trust + storefront continuity
- [ ] Supplier cards/profile/trust blocks show expected trust signals
- [ ] `maabar_supplier_id` shows where intended and does not appear blank for approved suppliers
- [ ] Status normalization does not break existing supplier accounts with older raw statuses

### Product management + storefront
- [ ] Supplier can create a product with:
  - [ ] main image
  - [ ] gallery images
  - [ ] one video
  - [ ] spec fields
  - [ ] display currency preference impact
- [ ] Product preview works before publish
- [ ] Editing an older product without new columns populated still works
- [ ] Product list page renders gallery/spec snippets safely
- [ ] Product detail page renders gallery/video/specs safely
- [ ] Supplier profile page renders new product media/spec content safely

### Offers / requests / checkout
- [ ] Supplier can submit a quote with unit price + separate shipping cost + shipping method
- [ ] Duplicate quote prevention still works
- [ ] Quote edit flow still works
- [ ] Buyer request/dashboard views show shipping breakdown correctly
- [ ] Estimated totals are correct
- [ ] Checkout still shows the intended supplier trust information
- [ ] Payment success page still shows the intended supplier trust information

### Currency / preferences
- [ ] Buyer can save preferred display currency
- [ ] Supplier can save preferred display currency
- [ ] Preference persists after reload/login
- [ ] Converted amounts display consistently across the touched pages

### Email review
Do a real inbox smoke test for the flows touched in this session:
- [ ] supplier signup / pending email
- [ ] admin new-supplier notification
- [ ] supplier approval email
- [ ] buyer welcome / confirmation-adjacent flow
- [ ] new offer email
- [ ] payment-related email(s) touched by the new shell

What to verify in each email:
- [ ] brand order is `مَعبر | MAABAR`
- [ ] Arabic email is RTL
- [ ] English email is LTR
- [ ] Chinese copy/layout is acceptable
- [ ] CTA links point to the correct page
- [ ] no broken glyphs / spacing regressions

---

## Safe prep already done now
- `supabase/functions/send-email/index.ts` was updated to accept both:
  - `APP_SUPABASE_URL` / `APP_SUPABASE_SERVICE_ROLE_KEY`
  - and the standard `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`

This is a safe compatibility fix so the function can still resolve profile data, infer language, and inject `maabar_supplier_id` even if production secrets only use the standard Supabase names.

---

## Not done here
- No deploy
- No Supabase dashboard changes
- No migration execution
- No function deployment

This file is only the final apply/verify checklist for the later release batch.
