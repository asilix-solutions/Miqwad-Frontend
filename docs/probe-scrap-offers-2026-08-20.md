# DIAGNOSIS + LIVE PROBE (READ-ONLY) — Scrap Part Requests → Offers workflow

Repo: `Miqwad-Frontend` (local checkout: `maqwad-frontend-project`), branch
`fix/scrap-part-requests-tabs`. Date: 2026-08-20. Strictly read-only — no source
edits, no commits, no branch created. Live probe run against
`https://miqwad-test.runasp.net` — **no JWT was supplied for this session**, so the
probe is Swagger-only (unlike the 2026-08-18 working-hours probe, which had real
tokens). `GET /swagger/v1/swagger.json` returned 200; everything below is read
straight from that live document. **Anything requiring an authenticated call is
explicitly flagged UNVERIFIED — needs a live token probe by the architect.**

---

## 1. PROBE VERDICT

### 1.1 The request↔offer link field is `orderId`, not `partRequestId` — and there is no `PartRequest` entity at all

The live Swagger has **91 paths total**. Searched for anything matching
`request|part|scrap|offer` (case-insensitive): the only hits are `/api/Offers`,
`/api/Offers/{id}`, `/api/public/offers`. There is **no** `/api/PartRequests`,
`/api/scrap/*`, or any dedicated "customer part request" resource anywhere in the
live backend.

`CreateOfferDto` (POST body):
```json
{
  "required": ["name", "title"],
  "properties": {
    "addressId": { "type": "integer", "format": "int64" },
    "orderId":   { "type": "integer", "format": "int64" },
    "name":      { "maxLength": 150, "minLength": 1, "type": "string" },
    "title":     { "maxLength": 200, "minLength": 1, "type": "string" },
    "subtitle":  { "maxLength": 200, "type": "string", "nullable": true },
    "description": { "maxLength": 2000, "type": "string", "nullable": true },
    "isCompatibleWith": { "maxLength": 500, "type": "string", "nullable": true }
  },
  "additionalProperties": false
}
```
**`orderId` is the linking field.** Customer "part requests" are not a separate
resource — they are **`Order` records of a salvage type**, created via
`POST /api/Orders` (multipart form) with a `Salvage.*` sub-object:

```json
"required": ["OrderType","Salvage.BrandModel","Salvage.BrandName","Salvage.BrandYear","Salvage.PiecesName"],
"properties": {
  "OrderType": { "$ref": "#/components/schemas/OrderType" },   // int enum 1..5, names NOT in swagger
  "Salvage.BrandName":   { "maxLength": 150 },
  "Salvage.BrandModel":  { "maxLength": 150 },
  "Salvage.BrandYear":   { "maxLength": 50 },
  "Salvage.PiecesName":  { "maxLength": 200 },   // ← this is the "part name"
  "Salvage.SerialNumber":{ "maxLength": 100 },
  "Salvage.Files":       { "type": "array", "items": { "type": "string", "format": "binary" } }
}
```
This is a decisive structural finding: **this is not "GET requests / POST offers
against a requests resource" — it is "GET Orders (filtered to salvage type) / POST
Offers against an orderId."** The task brief's framing ("Offers API in scope —
Swagger documents REQUESTS only") is not what the live Swagger shows; Swagger
documents **Orders**, not a "Requests" resource. **UNVERIFIED / flag to architect:**
which of the 5 integer `OrderType` values means "Salvage" — the enum has no
`x-enum-names` in Swagger, so this needs either a live probe (create one Salvage
order, read back its `type` string field on `GET /api/Orders`, which *does* return
`type` as a string per the example payload) or a backend-side confirmation.

### 1.2 `GET /api/Offers` — shape confirmed from Swagger, scoping UNVERIFIED

Returns `OfferResponseDtoPaginatedResultApiResponse`:
```json
{
  "success": true, "message": "...",
  "data": {
    "items": [{
      "id": 1, "name": "string", "title": "string", "subtitle": "string",
      "description": "string", "isCompatibleWith": "string",
      "addressId": 1, "addressTitle": "string",
      "orderId": 1, "createdAt": "2026-01-01T00:00:00Z"
    }],
    "pageNumber": 1, "pageSize": 10, "totalCount": 1, "totalPages": 1
  },
  "errors": null
}
```
Standard `PageNumber/PageSize/SortBy/SortDescending/FilterBy/FilterValue/DateFilterBy/
FromDate/ToDate` query params (same generic list pattern used across every other
collection endpoint in this backend — Orders, Users, etc.). **No `price` field
anywhere in the offer shape today.**

**UNVERIFIED — needs a live SalvageSpecialist JWT:**
- Whether `GET /api/Offers` is JWT-scoped to the caller's own offers, or returns
  all offers globally (filtered only via `FilterBy=orderId`/`FilterValue`).
- Whether a scrap provider can even call `GET /api/Offers` with no filter and get
  a sane result, or must always pass `FilterBy=orderId`.
- Whether `POST /api/Offers` is rejected server-side for `orderId` values that
  don't belong to a Salvage-type order (e.g. can a scrap provider technically post
  an offer against a `TowTruck`/`Insurance`/`Mojaz`/`SpareParts` order?). Swagger
  enforces nothing here — only a live/backend-side check will confirm authorization
  rules.
- `/api/public/offers` (`GET`, unauthenticated tag) — a **second**, public offers
  listing exists. Its purpose relative to the customer-facing "who offered on my
  request" view is unconfirmed; not in scope for this scrap-side probe but worth
  flagging as a related surface for the architect.

### 1.3 `PUT /api/Offers/{id}` / `DELETE /api/Offers/{id}` — shapes confirmed

`UpdateOfferDto` (PUT body) — **does not include `orderId`**, so an offer cannot be
re-linked to a different order via update, only its own content edited:
```json
{
  "required": ["name","title"],
  "properties": {
    "addressId": { "type": "integer", "format": "int64" },
    "name": { "maxLength": 150, "minLength": 1 },
    "title": { "maxLength": 200, "minLength": 1 },
    "subtitle": { "maxLength": 200, "nullable": true },
    "description": { "maxLength": 2000, "nullable": true },
    "isCompatibleWith": { "maxLength": 500, "nullable": true }
  },
  "additionalProperties": false
}
```
`DELETE /api/Offers/{id}` → 200, `TaskApiResponse` envelope. **UNVERIFIED:**
authorization on PUT/DELETE (can a scrap provider only mutate their own offers?) —
Swagger doesn't encode ownership checks; needs a live write-probe by the architect,
which this read-only session was told not to attempt without a token.

### 1.4 Where do "customer part requests" actually come from — confirmed structurally, UNVERIFIED for auth

`GET /api/Orders` is the resource the scrap owner would browse. Its response
(`OrderResponseDto`) includes `brandName`, `brandModel`, `brandYear`, `piecesName`,
`serialNumber`, `attachments[]` (photos), `status`, `type`, `createdAt`,
`userFullName` — i.e., everything the current mock `PartRequest` shape already
approximates, but sourced from an `Order`, not a dedicated request entity. It also
carries `orderItems[]`, `totalPrice`, `paymentStatus`, `trackNumber` — fields that
belong to purchase orders, not to a browse-only "leads" list; the frontend will
need to select/derive the relevant subset rather than mapping this DTO 1:1.

**UNVERIFIED / critical gap for the architect:** nothing in Swagger shows a
scrap-scoped "browse other customers' salvage orders" view. `GET /api/Orders` has
no visible parameter restricting results to a given `OrderType`, and
`GET /api/Users/{userId}/orders` is explicitly a **single user's own orders**
(matches "my orders" for the customer who created them, not a marketplace browse
for providers). It is entirely possible the *only* live endpoint is
`GET /api/Orders` with `FilterBy=type&FilterValue=<Salvage-enum-int>`, gated by an
authorization policy that allows salvage-provider roles to see all salvage orders
regardless of `userId` — but Swagger cannot prove that authorization rule exists.
**This is the single most important thing to live-probe before building**: confirm
(a) the exact `FilterBy` value that isolates salvage orders, (b) that a
SalvageSpecialist JWT is actually authorized to list orders it doesn't own, (c) the
exact string `type` comes back as (to map to i18n/status labels).

---

## 2. CURRENT COMPONENT STRUCTURE (read-only inspection)

All of this is **100% mock-backed today** — `scrapApi.ts` calls
`/scrap/part-requests`, `/scrap/part-requests/{id}`,
`/scrap/part-requests/{id}/offer`, `/scrap/part-requests/{id}/status`,
`/scrap/escrow/{id}` — none of which exist on the real backend (see §1.1); these
are all intercepted by the MSW-style mock in
`src/shared/mocks/handlers/scrap.handlers.ts`. Nothing here is wired to the live
API yet.

### 2.1 File map

| File | Role |
|---|---|
| `src/modules/scrap/pages/ScrapPartRequestsPage.tsx` | List page: tabs (`all`, `new`), search, pagination, cards |
| `src/modules/scrap/components/ScrapPartRequestCard.tsx` | Inbox-row card for the list |
| `src/modules/scrap/components/dashboard/PartRequestPreviewRow.tsx` | Compact row reused on the dashboard's recent-requests widget |
| `src/modules/scrap/components/ScrapPartRequestDetailDialog.tsx` | Thin `ProviderDialog` wrapper around the shared detail content |
| `src/modules/scrap/pages/ScrapPartRequestDetailPage.tsx` | Full-page route (`/provider/scrap/part-requests/:id`), also just wraps the shared detail content |
| `src/modules/scrap/components/PartRequestDetailContent.tsx` | The actual detail view — self-contained, fetches its own data. **This is where nearly everything lives.** |
| `src/modules/scrap/pages/ScrapMyOffersPage.tsx` + `ScrapOfferCard.tsx` | Separate "My Offers" page — derived view over the same mock data |
| `src/modules/scrap/lib/offerStatus.ts` | Derives `OfferStatus` from `PartRequestStatus` |
| `src/modules/scrap/lib/partRequestLifecycle.ts` | Status state machine + tone mapping |
| `src/modules/scrap/lib/escrowLifecycle.ts` | Escrow status tone mapping |
| `src/modules/scrap/api/scrapApi.ts` | Mock-backed API layer |
| `src/modules/scrap/hooks/useScrapQueries.ts` | TanStack Query hooks + key factory |
| `src/modules/scrap/schemas/scrap.schemas.ts` | `offerSchema` (price/note/photos), `scrapProfileSchema` |
| `src/modules/scrap/types.ts` | `PartRequest`, `PartRequestStatus`, `MyOffer`, `OfferStatus`, `Escrow`, `SubmitOfferPayload` |

### 2.2 `ScrapPartRequestCard.tsx` — section by section

- Photo thumbnail (`request.photos[0]`, safe-fallback to a `Package` icon)
- Part name + `request.requestNumber` (رقم الطلب) — **line 123-125**
- Vehicle line: brand · model · year
- Status pill (`partRequestStatusTone`) + optional escrow status pill (only if
  `request.escrowId` exists) — lines 136-147
- Relative time ("قبل ساعة" style) + masked-phone privacy badge

### 2.3 `PartRequestDetailContent.tsx` — section by section (this is the file that needs surgery)

1. **Header** (lines 522-536): part name, `requestNumber` (رقم الطلب — **line
   528-530**), status pill.
2. **Part info** (540-576): vehicle line, description, masked-phone badge.
3. **Photo gallery** (578-590): `request.photos.map(...)`.
4. **Escrow timeline** = "مراحل الضمان" (594-604), rendered via the `EscrowTimeline`
   component defined at **lines 79-211**. Title comes from
   `t("scrap.partRequests.escrowTimelineTitle")` → i18n string **"مراحل الضمان"**
   (`src/app/i18n.ts:2357`, en at `:4927`). Renders a 3-step stepper
   (pending → held → released) plus special disputed/refunded states.
5. **State-driven action area** (608-654):
   - `status === "new"` → renders `OfferForm` (219-313): Price + Note + multi-photo
     `ProviderImageUpload`, submits via `useSubmitOfferMutation`.
   - `status === "accepted"` → renders `MarkShippedButton` (317-409) — this is the
     **shipping action** (الشحن). Label `t("scrap.partRequests.markShipped")` →
     **"تم الشحن"** (`i18n.ts:2348`). Confirms via
     `useUpdatePartRequestStatusMutation({status:"shipped"})`.
   - `status === "quoted"` → info panel "بانتظار قبول العميل".
   - `status === "shipped"` → info panel "بانتظار تأكيد استلام العميل" — this is
     the **shipping wait state**, a second shipping-related surface.
   - `status === "completed"` / `"cancelled"` → info panels.
6. **Chat entry** (656-676): disabled placeholder button, not in scope.

### 2.4 Exact removal map (warranty/order-number/shipping)

| To remove | Where | Notes |
|---|---|---|
| مراحل الضمان (escrow/warranty stages) | `PartRequestDetailContent.tsx:79-211` (`EscrowTimeline` component definition) + `:594-604` (render site) + `:411-446` region uses `InfoPanel` which stays (reused by other states) | Also drop the `escrowNotStarted` branch (599-603) and the `useEscrowQuery` call (461-463) once escrow is gone from this view |
| رقم الطلب (order/request number) | `ScrapPartRequestCard.tsx:123-125`, `PartRequestDetailContent.tsx:528-530` | Also appears in `PartRequestPreviewRow.tsx` (not explicitly grepped for `requestNumber` text but the row reuses the same `PartRequest.requestNumber` field pattern — check before final build) and `ScrapOfferCard.tsx:95-98` (My Offers page — separate surface, confirm with architect whether My Offers keeps it) |
| الشحن (shipping) | `MarkShippedButton` component `PartRequestDetailContent.tsx:317-409` + its render site `:619-621`; the `"shipped"` info-panel branch `:631-637`; `useUpdatePartRequestStatusMutation` (`useScrapQueries.ts:121-134`) and `updatePartRequestStatus` (`scrapApi.ts:84-93`) become dead code once no caller remains (check `ScrapDashboardPage.tsx` isn't also calling it before deleting) |

Also note: `partRequestLifecycle.ts`'s state machine (`new→quoted→accepted→shipped→
completed/cancelled`) encodes the **old** buy/accept/ship/escrow workflow end to
end. If the new model is "browse orders, submit competing offers," this whole
lifecycle may no longer represent scrap-side state at all — see §4 blast radius.

### 2.5 Existing offer code — mostly reusable, needs re-pointing

- **Types** (`types.ts:153-159`): `SubmitOfferPayload { price, note?, photos? }` —
  reusable field names once repointed at `CreateOfferDto`'s real fields
  (`name`, `title`, `description`, `isCompatibleWith`, `addressId`, `orderId`).
  **No `price` field exists in the live backend today** — confirms the task
  brief's note that Price isn't live yet.
- **Schema** (`scrap.schemas.ts:31-37`): `offerSchema` (price/note/photos) — needs
  a new schema aligned to `CreateOfferDto`'s actual required fields (`name`,
  `title`) plus optional `subtitle`/`description`/`isCompatibleWith`/`addressId`.
  Current schema requires `price` as positive — that's UI-only aspiration today.
- **Form UI** (`OfferForm`, `PartRequestDetailContent.tsx:219-313`): built and
  already includes a multi-photo `ProviderImageUpload` (line 282-289) — this is
  **directly reusable** once wired to the real photo-upload mechanism (see §2.6).
- **`useSubmitOfferMutation`** (`useScrapQueries.ts:106-119`): reusable shape —
  swap `scrapApi.submitOffer` internals for `POST /api/Offers` with `orderId`.
- **My Offers page + `ScrapOfferCard`**: fully built UI, currently derived from
  `PartRequest` records with `offerPrice`/`offeredAt` (denormalized mock fields
  that don't exist on the real `Order`). Once real offers live at `GET /api/Offers`,
  this page should query offers directly instead of deriving them from part
  requests — a cleaner and more accurate data source than the current
  `usePartRequestsQuery({status:"all"}).filter(...)` approach in
  `useMyOffersQuery` (`useScrapQueries.ts:84-104`).
- **`offerStatus.ts`**: entirely built around `PartRequestStatus`, which won't
  exist once requests are Orders. This mapping needs to be redesigned once real
  order/offer statuses are confirmed live (see §4).

**Conclusion: "make an offer" is NOT new — a complete form, mutation, and card UI
already exist. The work is re-pointing the data layer (api/types/schema) at
`Orders`+`Offers`, not building offer UI from scratch.**

### 2.6 Multi-photo readiness

- Current offer-photo UI: `ProviderImageUpload` component
  (`src/shared/provider-ui/ProviderImageUpload.tsx`), already used with
  `multiple maxSizeMB={8}` in `OfferForm` (`PartRequestDetailContent.tsx:282-289`).
  This is exactly the primitive to reuse when the backend ships offer photos.
- **On the request side**, multi-photo is *already live* on the real backend:
  `Salvage.Files` in `POST /api/Orders` is `type: array, items: string(binary)` —
  i.e. the customer-submitted salvage request already supports multiple photo
  files today. The scrap-side detail view's photo gallery
  (`PartRequestDetailContent.tsx:578-590`) already renders `request.photos.map()`
  and just needs pointing at the real `Order.attachments[]` array.
- **On the offer side**, `CreateOfferDto`/`UpdateOfferDto` have **no photo field
  at all** yet (confirmed in §1.1/§1.3) — matches the task brief's note that
  Price + Description + Photos land later on offers. Description *already exists*
  in the live DTO today (contrary to the brief's framing that groups it with the
  unshipped fields) — worth flagging to the architect that Description can be
  wired now, only Price and Photos are genuinely not-yet-supported on offers.

### 2.7 i18n + styling conventions

- Namespace: flat keys under `scrap.partRequests.*`, `scrap.offer.*`,
  `scrap.escrow.*`, `scrap.myOffers.*`, `scrap.status.*` in `src/app/i18n.ts`
  (ar tree ~line 2300-2360, en tree ~line 4870-4930 — mirrored 1:1, hand-edited
  per CLAUDE.md rules).
- RTL: `rtl:rotate-180` used for chevrons (`PartRequestPreviewRow.tsx:122`);
  logical-only spacing throughout (`ps/pe/ms/me`), no `pl/pr/ml/mr` found in these
  files.
- Provider-UI primitives already used and reusable for an offer dialog/form:
  `ProviderDialog` (blurBackdrop, size lg), `ProviderInput`, `ProviderTextarea`,
  `ProviderImageUpload`, `ProviderStatusPill`, `ProviderSkeleton`,
  `ProviderPageHeader`, `ProviderTabs`, `ProviderSearchBar`, `ProviderEmptyState`.
  No new primitives needed for the rebuilt offer flow.

---

## 3. RECOMMENDED FILTER SET

Real fields available once sourced from `Order` (per `OrderResponseDto`, §1.4):
`brandName`, `brandModel`, `brandYear`, `piecesName`, `status`, `createdAt`,
`type`. Grounded, minimal, high-value set:

1. **All / New** (status-based) — already the current tab set post-cleanup
   (commit `2ab1e20`); keep as-is, it maps directly to `Order.status`.
2. **Vehicle brand** (`brandName`) — matches the scrap provider's own
   specialization filter already used elsewhere (`ScrapVehicleBrand` enum in
   `types.ts`), a natural high-value filter since providers specialize by brand.
3. **Search** (already implemented, `ProviderSearchBar`) — should search
   `piecesName` + `brandModel` server-side once wired to `FilterBy/FilterValue`
   or a dedicated search param (confirm exact query contract in a live probe —
   Swagger's generic `FilterBy/FilterValue` pair doesn't specify which field
   names are valid server-side).
4. **"Not yet offered on"** — genuinely useful ("only show requests I haven't
   quoted") but requires either (a) a `hasMyOffer` flag from the backend, or (b)
   client-side cross-referencing this scrap's `GET /api/Offers` results against
   the order list by `orderId`. Recommend (b) first — no backend dependency,
   same N+1-avoidance pattern already used for escrow lookups today, and doable
   once §1.4's authorization question is resolved.

**Not recommended (no backing field):** date-range filtering (`FromDate/ToDate`
exist generically but add UI complexity with unclear customer value here), any
filter on fields not present in `OrderResponseDto` (e.g. urgency/priority — not
in the schema).

---

## 4. BLAST RADIUS & PLAN

### 4.1 Stays scrap-only — confirmed

- `PartRequestStatus`, `partRequestLifecycle.ts`, `offerStatus.ts`,
  `escrowLifecycle.ts`, `MyOffer`, `SubmitOfferPayload` are all defined inside
  `src/modules/scrap/` and referenced only by scrap pages/components/hooks (no
  cross-module grep hits outside `src/modules/scrap/`). Safe to change freely —
  nothing in dealer/workshop/admin imports these.
- The provider-ui primitives reused here (`ProviderDialog`, `ProviderImageUpload`,
  etc.) are consumed but not modified — no shared-code risk.

### 4.2 What must NOT be broken

- `ScrapDashboardPage.tsx` and `PartRequestPreviewRow.tsx` both consume
  `PartRequest`/`usePartRequestsQuery`/`useEscrowQuery` for the dashboard's
  recent-requests widget — any type/API change must keep these compiling, or the
  dashboard needs matching updates in the same pass.
- `ScrapMyOffersPage.tsx` / `ScrapOfferCard.tsx` depend on `MyOffer` derived from
  `PartRequest` — becomes a real `GET /api/Offers`-backed view, which is a bigger
  change than a simple type edit (data source changes, not just shape).

### 4.3 Remove vs. wire-now vs. prepare-but-leave-unwired

**REMOVE** (per §2.4): escrow/warranty timeline UI + query, `MarkShippedButton` +
shipped-status flow, `requestNumber` display. These map to an escrow/shipping
model that has no equivalent live endpoint (`Escrow` type has no backend
counterpart at all in the 91-path Swagger — confirms it should go, not just be
hidden).

**WIRE NOW** (backend supports today, per §1):
- List customer salvage requests: `GET /api/Orders` (filtered to salvage type —
  exact filter mechanics UNVERIFIED, §1.4).
- View one request's detail: `GET /api/Orders/{id}` (path exists per the generic
  Orders CRUD set, `id` int64).
- Submit an offer: `POST /api/Offers` with `name`, `title`, `orderId`, optional
  `subtitle`/`description`/`isCompatibleWith`/`addressId`.
- Edit/withdraw an offer: `PUT`/`DELETE /api/Offers/{id}`.
- List this scrap's own offers (My Offers page): `GET /api/Offers`
  (scoping UNVERIFIED, §1.2).

**PREPARE BUT LEAVE UNWIRED** (backend doesn't support yet):
- **Price** on offers — no field in `CreateOfferDto`/`UpdateOfferDto`/
  `OfferResponseDto`. Keep a price input in the form UI (already built,
  `OfferForm` lines 256-268) but do not submit it until the backend adds it —
  or hide it behind a feature flag if the architect wants it fully absent rather
  than visually present-but-inert.
- **Multi-photo on offers** — no field in the offer DTOs. `ProviderImageUpload`
  is already wired in the form (lines 282-289); leave it in place but keep it
  from being sent, same treatment as Price.
- Description **can** be wired now (it already exists in the live DTO) —
  recommend decoupling it from the "prepare only" bucket the task brief grouped
  it into.

### 4.4 Safest, most sustainable plan

1. **Live-probe first, before any build**: resolve §1.4 (how a scrap provider
   lists other customers' salvage orders, and whether `GET /api/Orders` is even
   authorized for that role) and the `OrderType` enum mapping (§1.1) with a real
   SalvageSpecialist JWT. Building against an assumed filter contract that turns
   out wrong is the highest-risk item here — worth a dedicated live-write/list
   probe before touching code.
2. Rename/re-scope the domain: introduce a `SalvageOrder` (or similarly named)
   type sourced from `OrderResponseDto`'s relevant subset, replacing the mock
   `PartRequest` shape — keep `requestNumber`-style display removed per §2.4, but
   note `Order.id` (or a `trackNumber`) still needs *some* identifier if the UI
   wants one; confirm with architect whether removing "رقم الطلب" means dropping
   the identifier entirely or just de-emphasizing it.
3. Re-point `scrapApi.ts` at `/api/Orders` (list/detail) and `/api/Offers`
   (create/update/delete/list), replacing the mock-only endpoints. Drop
   `getEscrow`/`updatePartRequestStatus` once their only callers are removed
   (§2.4).
4. Rebuild `PartRequestDetailContent.tsx` (rewrite whole file per CLAUDE.md rule
   for large files) with: header (part name, vehicle, no order number per
   architect's call in step 2), photo gallery from `Order.attachments`, and the
   existing `OfferForm` re-pointed to `CreateOfferDto` fields with Price/Photos
   present-but-unwired.
5. Rebuild `ScrapMyOffersPage.tsx` to query `GET /api/Offers` directly instead of
   deriving from part requests — this is a real behavior change, not just a
   rename, so budget it as its own step.
6. Apply the filter set from §3, gated on confirming the `FilterBy` contract in
   step 1.
7. `npx tsc -b --noEmit` + visual review per CLAUDE.md before any commit — this
   task doesn't build any code today, so this step is for the fix branch, not
   this diagnosis.
