# Managed Sourcing MVP — Phase 2

This phase covers the operational backbone of the managed sourcing workflow.

## Scope of Phase 2

- Supabase schema for managed sourcing
- request status model
- AI-prepared brief storage
- admin review workspace
- supplier matching and supplier-side inbox bucket: `الطلبات المطابقة لك`

## Lifecycle

1. Buyer submits a managed request
2. Request gets `sourcing_mode = managed`
3. Request gets `managed_status = submitted`
4. AI prepares a sourcing brief
5. Admin reviews the brief and either:
   - asks follow-up
   - or moves request to sourcing
6. Admin assigns matching suppliers only
7. Suppliers see the request inside `الطلبات المطابقة لك`
8. Supplier can:
   - submit quote
   - mark as not suitable
9. Admin filters supplier responses and prepares shortlist later (Phase 3)

## Request statuses used in MVP

- `submitted`
- `admin_review`
- `sourcing`
- `shortlist_ready`

Additional admin/supporting fields:
- `managed_priority`
- `managed_review_state`
- `managed_follow_up_needed`
- `managed_last_buyer_action`
- `managed_research_requested_count`
- `managed_ai_ready_at`
- `managed_reviewed_at`
- `managed_shortlist_ready_at`
- `response_deadline`

## New tables

### `managed_request_briefs`
Stores the AI-prepared/admin-reviewed sourcing brief:
- cleaned description
- extracted specs
- category
- priority
- supplier brief
- admin follow-up question
- admin internal notes
- AI confidence / raw output

### `managed_supplier_matches`
Stores which suppliers were selected for the managed request:
- request
- buyer
- supplier
- match status
- supplier/admin notes
- timestamps for viewed/responded/closed

### `managed_shortlisted_offers`
Prepared in this phase at schema level; used fully in Phase 3.
Stores the curated top 3 offers for the buyer.

### `managed_shortlist_feedback`
Prepared in this phase at schema level; used fully in Phase 3.
Stores buyer actions such as:
- choose offer
- request negotiation
- not suitable
- restart search

## Supplier-side UX target in this phase

Supplier dashboard tab:
- `الطلبات المطابقة لك`

Buckets:
- `الطلبات الجديدة`
- `الطلبات اللي قدّم عليها`
- `الطلبات المغلقة`

Per request card minimum:
- product name
- quantity
- specs / brief
- deadline
- CTA: تقديم عرض
- CTA: غير مناسب
- clear indication that the request is managed by Maabar

## Admin-side UX target in this phase

Admin reviews:
- incoming managed requests
- prepared brief
- follow-up need
- matching suppliers
- supplier responses

This phase intentionally stops before the final buyer decision UI.
That belongs to Phase 3.
