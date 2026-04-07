# Managed Sourcing MVP — Phase 1

This file documents the approved buyer-facing entry flow before deeper Supabase/admin work.

## Positioning

Managed Sourcing is a real service layer above the marketplace, not just a CTA.

Core promise:
- Buyer submits the request once
- Maabar prepares it
- Maabar reviews it internally
- Maabar sends it to matching suppliers only
- Buyer receives the top 3 selected offers inside the same request page

## Homepage entry points

Under the hero there are 3 starting paths:

1. دع معبر يتولى الطلب
2. ارفع طلبك بنفسك
3. حوّل فكرتك إلى منتج

The managed path is the featured/default premium option.

## Managed sourcing flow

1. Buyer submits request
2. AI prepares and structures the brief
3. Admin reviews it quickly
4. Request is sent only to matching suppliers
5. Suppliers submit offers
6. Maabar filters / negotiates
7. Buyer sees `العروض المختارة لك` inside the same request page

## Buyer-side UX principle

The buyer should not receive the final decision interface only through:
- chat
- WhatsApp
- PDF

Those can be notification/supporting channels, but the main decision surface must be the request page itself.

## Buyer-side states (Phase 1 approved wording)

1. تم استلام الطلب
2. قيد المراجعة
3. جارٍ البحث والتفاوض
4. تم اختيار أفضل 3 عروض

## Phase 1 deliverable boundary

Phase 1 is only responsible for:
- hero messaging
- entry-point messaging
- visible managed-path framing
- clear buyer-facing flow communication
- keeping wording aligned with the new Maabar visual system

## Explicitly postponed to later phases

- Supabase schema / statuses
- admin review workflow implementation
- supplier-side matching tabs
- shortlist cards + buyer actions on request page
- notifications / email tied to shortlist readiness
