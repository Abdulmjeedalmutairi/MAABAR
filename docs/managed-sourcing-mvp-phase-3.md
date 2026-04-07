# Managed Sourcing MVP — Phase 3

This phase defines the buyer decision surface inside the same request page.

## Core principle

The buyer must receive the managed result inside the request itself.
Not only through:
- chat
- PDF
- WhatsApp

Those can notify, but the decision interface lives inside Maabar.

## Main section name

Preferred Arabic label:
- `العروض المختارة لك`

## Request status flow shown to buyer

1. `تم استلام الطلب`
2. `قيد المراجعة`
3. `جارٍ البحث والتفاوض`
4. `تم اختيار أفضل 3 عروض`

## Shortlist card content

Each shortlisted offer card should present:
- supplier name
- unit price
- MOQ
- production time
- shipping time
- verification level
- Maabar notes
- why the offer was selected

## Buyer actions per card

Exactly 3 actions per offer card:

1. `اختر هذا العرض`
2. `اطلب تفاوض إضافي`
3. `غير مناسب`

## Global action around the shortlist

- `أعد البحث`

Used when none of the 3 options fit.

## Flow after each action

### 1) اختر هذا العرض
Meaning:
- buyer leans toward this supplier
- request moves toward buyer-selected / next operational step
- Maabar continues the deal from this chosen option

### 2) اطلب تفاوض إضافي
Meaning:
- buyer is interested, but wants another round
- request returns to sourcing / negotiation state
- a reason should be captured using quick options:
  - `أريد سعراً أفضل`
  - `أريد وقت تسليم أسرع`
  - `أريد تعديل الكمية أو المواصفات`

### 3) غير مناسب
Meaning:
- this option is out of consideration
- buyer preference is stored on the same request
- remaining shortlisted options stay visible

### 4) أعد البحث
Meaning:
- the current 3 options were not enough
- request goes back to sourcing state
- Maabar can search/match again

## UX result

The buyer can:
- track status
- understand what Maabar is doing
- compare 3 clear curated options
- choose, negotiate, reject, or request new search

All from the same request page.
