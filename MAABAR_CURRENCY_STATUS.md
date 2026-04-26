# Maabar Currency Standardization — Status

**Last updated:** 2026-04-26
**Resume instruction for the next session:** read this file first.

---

## Completed work

- **3 DB migrations applied** (requests.budget_currency, managed_shortlisted_offers.currency, offers.currency)
- **Mobile displayCurrency lib** — `maabar-app` commit `a1d3cd3`
- **Flow 3 RFQ** — web `3dc3bba` + mobile `ad4c94d`
- **Fix 1** — currency conversion on mobile product listings — `201883a`
- **Fix 2** — Western numerals platform-wide — web `3b079e1` + mobile `d2233a5`
- **Fix 3** — Inter font for clean number rendering — web `8af82dd` + mobile `1f8d5f7`
- **Flow 2 Build Your Idea** — web `859b5ac` (edge function `maabar-ai` deployed) + mobile `f3eb320`

---

## Remaining (in order)

1. **Flow 1 — Managed Sourcing** (web + mobile)
2. **Flow 4 — Direct Product Purchase** (web + mobile) — **CRITICAL, real payments**
3. **Q7 — DashboardSupplier RFQ list update** (hardcoded SAR at line 2924)
4. **Side task** — Harmonize web `IdeaToProduct` → managed flow (web Build-Your-Idea currently writes a plain RFQ; mobile writes a managed request and calls `setupManagedRequest`)

---

## Standards (apply to all remaining work)

- **Role-based display defaults**: Trader sees SAR, Supplier sees USD
- **Storage**: DB stores AS-ENTERED with currency tag, never convert on save
- **FX**: live rates from `open.er-api.com`; fallback `USD=1, SAR=3.75, CNY=7.2`
- **Display rule**: show both rows when source ≠ display (`1,200 USD ≈ 4,500 SAR`); single row when they match
- **Numeral locale**: `'ar-SA-u-nu-latn'` everywhere (Arabic punctuation, Latin digits)
- **Number font**: Inter via `@font-face` unicode-range on web; `F.num` / `F.numSemi` (Inter_500Medium / Inter_600SemiBold) on mobile

---

## Key library entry points

### Web (`maabar/src/lib/displayCurrency.js`)
- `formatCurrencyAmount(amount, currency, lang, options)`
- `formatPriceWithConversion({ amount, sourceCurrency, displayCurrency, rates, lang, options })`
- `buildDisplayPrice({ amount, sourceCurrency, displayCurrency, rates, lang })`
- `normalizeDisplayCurrency(value)` · `DISPLAY_CURRENCIES` · `DEFAULT_DISPLAY_CURRENCY`
- `persistDisplayCurrencyPreference({ sb, userId, currency, setProfile })`

### Mobile (`maabar-app/src/lib/displayCurrency.js`)
- All of the above, plus:
- `useDisplayCurrency()` → `{ displayCurrency, rates }` (subscribes)
- `getCurrentDisplayCurrency()` · `setCurrentDisplayCurrency()`
- `hydrateDisplayCurrencyState({ profile, lang })` — called by `RootNavigator` after profile load
- `getRoleDefaultCurrency(role, lang)` — supplier→CNY, AR→SAR, else USD

---

## How each Flow has been wired (reference for remaining flows)

1. **Buyer-create form**: add a 3-currency selector next to the amount input. Default to viewer's `displayCurrency` (or 'SAR' inline when no hook is available, e.g. web IdeaToProduct).
2. **Insert payload**: include the `*_currency` column AS-ENTERED. Pass through `runWithOptionalColumns({ optionalKeys: [..., 'currency'] })` for backward compatibility.
3. **Supplier-side display of buyer's amount**: `formatPriceWithConversion({ source: r.budget_currency || 'SAR', display: viewerCurrency, ... })` — fallback to `'SAR'` is the migration's stated contract for legacy NULL rows.
4. **Buyer-side display of supplier's amount**: same helper, fallback to `'USD'` per the offers.currency migration default.
5. **AI prompts** (managed brief): include the currency tag alongside the bare amount, e.g. `Budget per unit (optional): 150 SAR`. Edge function type `ManagedBriefPayload` already accepts `budget_currency?: string | null`.

---

## Open caveats / known divergences

- **Web `IdeaToProduct.jsx` does NOT write `sourcing_mode='managed'`** — mobile equivalent does. Tracked as Side task above.
- **Pre-existing eslint errors** in `maabar/src/pages/DashboardBuyer.jsx` lines 37-39 (imports after constants) — not introduced by this work; ignore unless scope expands.
- **Push from this environment is blocked** by Git Credential Manager (`wincredman`) — pushes have to be run by the user from an interactive terminal. Same for `npx supabase functions deploy` (needs `supabase login` or `SUPABASE_ACCESS_TOKEN`).

---

## Files most-touched so far (worth re-reading on resume)

| Area | Web | Mobile |
|---|---|---|
| Currency lib | `src/lib/displayCurrency.js` | `src/lib/displayCurrency.js` |
| RFQ buyer | `src/pages/Requests.jsx` | `src/screens/buyer/NewRequestScreen.js` |
| RFQ supplier | `src/pages/DashboardSupplier.jsx` (offer composer + edit modal + RFQ list) | `src/screens/supplier/SupplierRequestsScreen.js`, `SupplierOffersScreen.js` |
| RFQ buyer-view of offers | `src/pages/DashboardBuyer.jsx` | `src/screens/buyer/OffersScreen.js`, `AllOffersScreen.js`, `RequestsScreen.js` |
| Build Your Idea | `src/components/IdeaToProduct.jsx`, `src/lib/ideaToProductFlow.js`, `src/lib/managedSourcing.js` | `src/screens/buyer/IdeaToProductScreen.js`, `src/lib/managedBrief.js` |
| Edge function | `supabase/functions/maabar-ai/index.ts` (`ManagedBriefPayload` + prompt) | — |
| Product listings | — | `src/screens/shared/ProductsScreen.js`, `SupplierProfileScreen.js`, `src/screens/supplier/SupplierProductsScreen.js`, `SupplierDirectOrdersScreen.js` |
