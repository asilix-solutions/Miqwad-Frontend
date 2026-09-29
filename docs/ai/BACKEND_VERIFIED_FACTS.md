# BACKEND_VERIFIED_FACTS.md — Maqwad (مقود)

> **Purpose:** Stable reference for backend behavior that was verified through real requests, live probes, or production behavior and is unsafe to infer from Swagger alone.
>
> Use this file to prevent repeated rediscovery of known backend quirks.
>
> This file is **not** a replacement for Swagger and is **not** a complete API specification.
> Only record facts that were actually verified.
>
> If a fact becomes stale, update or remove it after re-verification.

---

## 1. General Integration Rules

### 1.1 Swagger is not the final source of truth

Across Maqwad, live behavior has repeatedly differed from Swagger in:

- response shapes,
- enum representation,
- number binding,
- date/time representation,
- supported query parameters,
- mutation responses,
- authorization/scoping behavior.

Therefore:

- inspect Swagger for request discovery;
- verify uncertain behavior live before building on it;
- isolate uncertain mappings behind adapters/helpers;
- never spread an unverified assumption across the UI.

---

### 1.2 Common response envelope

A common backend shape is:

```ts
{
  success: boolean;
  message: string | null;
  data: unknown;
  errors: unknown;
}
```

Paginated endpoints commonly use:

```ts
data: {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
```

However, **do not assume every endpoint is consistent**.

Known exceptions exist.

---

### 1.3 Page size

A safe project-wide list size is generally:

```text
PageSize <= 100
```

A live backend probe confirmed at least one endpoint rejects `PageSize=200`.

Do not assume all endpoints have identical pagination limits.

---

### 1.4 Date/time behavior

Multiple backend endpoints return timestamps **without an explicit timezone suffix**.

Do not blindly treat Swagger examples containing `Z` as proof that live responses are UTC-qualified.

Use the project’s established date handling utilities and verify endpoint-specific behavior when correctness matters.

---

## 2. Authentication and Roles

### 2.1 Numeric role mapping

Verified internal role mapping:

```text
1 = Admin
2 = Dealer
3 = WorkshopOwner
4 = SalvageSpecialist
5 = TowTruckDriver
6 = Customer
```

Provider routing should use the established JWT/provider-type logic rather than inventing a parallel role system.

---

### 2.2 Login response

Verified login behavior includes an envelope whose `data` contains fields such as:

```text
id
fullName
email
phoneNumber
token
role
```

A verified login response did **not** include `isActive`/status.

Do not derive activation status from a field that login does not provide.

---

### 2.3 Phone login

Verified behavior:

- `POST /phone/login` is outside the normal `/api` prefix.
- `POST /api/auth/phone/verify` performs verification.
- Phone login is for Customer accounts; non-customer accounts were rejected during live verification.

Do not normalize this endpoint path into the standard API prefix unless the backend changes.

---

## 3. Users

### 3.1 User list shape

Verified user list fields include:

```text
id
fullName
email
phoneNumber
address
city
idenityNumber
isActive
roleId
createdAt
```

Important:

- the backend field is `roleId`, not `role`;
- `idenityNumber` is intentionally misspelled by the backend contract.

Keep raw backend spelling contained at the adapter boundary.

---

### 3.2 User filtering

Verified:

```text
FilterBy=roleId
```

works server-side.

Using:

```text
FilterBy=role
```

caused backend failure during verification.

Activation filtering uses textual boolean values:

```text
true
false
```

Do not assume `1/0` is accepted.

---

### 3.3 User activation

Verified endpoints use `PATCH`:

```text
PATCH /api/Users/{id}/activate
PATCH /api/Users/{id}/deactivate
```

Mutation responses may return `data:null`.

Refetch/invalidate instead of depending on a rich mutation payload.

---

## 4. Provider Profile

### 4.1 Profile image

Verified:

```text
GET    /api/profile/image
POST   /api/profile/image
PUT    /api/profile/image
DELETE /api/profile/image
```

Observed behavior:

- GET with no image → `404`, which means “no image”, not an application failure;
- POST is create-only and can return `409` if an image already exists;
- PUT replaces the existing image;
- DELETE returns success with `data:null`;
- response field is `url`;
- multipart field is `File`.

Established upload decision:

```text
GET
→ 404 => POST
→ existing image => PUT
```

---

### 4.2 Profile update

Verified `PUT /api/profile` behavior:

- `fullName` is required;
- omitting `phoneNumber` is safe;
- `null` does not behave the same as an empty string.

Do not send partial fields casually without checking the endpoint’s replacement semantics.

---

## 5. Working Days / Hours

Verified:

```text
PUT /api/profile/working-days
```

Behavior:

- `workingDays` and `workingHours` are both sent together;
- omitting one can clear it;
- backend storage for this field is not Unicode-safe;
- Arabic text was persisted as `?????`;
- ASCII values such as `Sat-Thu` / `09:00-18:00` are used for storage;
- Arabic is a presentation concern on the frontend;
- this endpoint is Workshop-only; Salvage/Scrap was rejected.

Do not send localized Arabic storage values unless the backend is fixed and re-verified.

---

## 6. Addresses

Verified `/api/Addresses` behavior:

- endpoint is JWT-scoped to the current user for provider-side use;
- provider `userId` should not be fabricated into the request body when the backend derives it from JWT;
- create works for provider roles.

Keep admin and provider scoping distinct.

---

## 7. Categories and Services

### 7.1 Categories

Verified real endpoints:

```text
GET    /api/Categories
POST   /api/Categories
GET    /api/Categories/{id}
PUT    /api/Categories/{id}
DELETE /api/Categories/{id}
```

Verified category payload uses a single:

```text
name
```

—not parallel `nameAr` / `nameEn` fields.

---

### 7.2 Category → Services relationship

Verified:

```text
GET    /api/Categories/{id}/services
POST   /api/Categories/{id}/services/{serviceId}
DELETE /api/Categories/{id}/services/{serviceId}
```

Important response-shape exception:

The GET relationship endpoint returns assigned services nested under:

```text
data.services
```

—not the normal paginated `data.items` shape.

Do not generalize the normal list envelope to this endpoint.

---

### 7.3 Services

Verified real service endpoints support self-join hierarchy through:

```text
parentServiceId
```

The taxonomy `Service` entity is **not** the same concept as an older priced provider-service/offering model.

Do not merge these concepts just because both were historically named “Service”.

---

## 8. Brands and Models

Verified facts:

- Brand create/update uses a single `name`;
- Brand includes `image` as a text URL in the verified contract;
- Model create includes `name` and `brandId`;
- model writes use standalone `/api/Models/{id}` endpoints rather than nested write routes under Brands;
- reads include `/api/Brands` and `/api/Brands/{brandId}/models`.

A prior handover explicitly required live re-verification of some brand/model update/delete behavior before promotion.

Re-probe if behavior is material to a new task.

---

## 9. Provider Services / Dealer Products

Verified product/catalog work uses:

```text
/api/provider-services
```

for provider-scoped priced offerings.

The backend derives provider identity from JWT in the verified dealer flow.

Do not send `providerId` unless the current endpoint contract explicitly requires it.

Historical documentation around the meaning of `provider-services` has changed over time; inspect the current code and live contract before extending it to a new provider workflow.

---

## 10. Orders

### 10.1 Order type

Verified numeric query usage includes:

```text
OrderType=2
```

for salvage/scrap order flow.

This is a dedicated query parameter, not automatically equivalent to generic `FilterBy/FilterValue`.

---

### 10.2 Dealer orders

Verified dealer UI behavior is primarily read/display when no real action endpoints exist.

Do not expose “prepare”, “ship”, “deliver”, or similar actions unless the backend actually provides and authorizes them.

---

### 10.3 Order display quirks

Observed backend data required defensive frontend behavior, including:

- `trackNumber` may be null;
- list-level item counts may be unreliable compared with detail payloads;
- some financial values were temporarily derived client-side because the backend did not provide them.

Any temporary client-side financial calculation must remain clearly marked and should be replaced when the backend becomes authoritative.

---

## 11. Request Quotations / Scrap

The old `/api/Offers` scrap flow was retired in favor of request quotations.

Verified current flow includes:

```text
GET/POST/PUT/DELETE /api/request-quotations
```

with multipart writes.

### Critical numeric binder fact

Swagger described `Price` as a floating-point value, but live verification showed the backend binder accepted whole numbers and rejected decimal values in the tested flow.

A placeholder whole-number price was used as a compatibility workaround.

Do not assume the binder has been fixed without re-verification.

### Attachments

Verified attachment items are objects such as:

```ts
{
  filePath: string;
}
```

—not plain URL strings.

---

## 12. Invoices

### Rich read-only invoice contract

**Verified behavior:** Current live verification supplied by the user for the
Invoices migration (2026-09-12) supersedes the former four-field DTO. This entry
records that supplied evidence; it does not claim a new agent-authenticated probe.

- GET `/api/Invoices`: `{success,message,data:{items,pageNumber,pageSize,totalCount,totalPages},errors}`.
- GET `/api/Invoices/{id}`: the same rich invoice entity inside `data`.
- Identity: numeric `id`, real `invoiceNumber`, numeric `invoiceType`,
  `customerName`, `issueDate`, `supplyDate`, `itemCount`, encoded `qrCode`.
- `buyerId`, `sellerId`, `orderId`, and `orderNumber` can be null.
- `facilityInformation`: `name`, `taxIdNumber`, `commercialRegister`, `address`.
- `buyerInformation` can be null; otherwise it contains `name`, `vatNumber`,
  `address`, and `commercialRegister`.
- `items[]`: numeric `id`, `providerServiceId`, `price`, `quantity`,
  `grossAmount`, `netAmount`; `serviceName`, `providerName`; nullable `offer`
  and `offerName`.
- Totals: `subtotal`, `discountAmount`, `taxableAmount`, `taxRate`,
  `taxAmount`, and `totalPrice` are numbers.

Observed arithmetic is consistent with `grossAmount = price × quantity`,
`taxableAmount = subtotal - discountAmount`,
`taxAmount = taxableAmount × taxRate`, and
`totalPrice = taxableAmount + taxAmount`. Display server amounts rather than
recomputing financial truth from these observations.

`itemCount` appears to mean total quantity: three lines with quantities 6, 6,
and 3 return 15. Use `items.length` for line count. `offer` appears to be a
line-level monetary discount, not a percentage.

**Frontend consequence:** Use the real invoice number, rich parties, lines, and
financial summary. Preserve decimal money; do not default absent amounts to zero.
Dates have no timezone suffix; retain established date handling. The QR payload
is encoded text, not an image URL. Invoice type values 1 and 2 were observed but
their semantic names remain unverified. No payment/status fields or write UI are
justified by this read contract.

Swagger exposes PageNumber, PageSize, SortBy, SortDescending, FilterBy,
FilterValue, DateFilterBy, FromDate, and ToDate. Accepted filter field/value
semantics still need live confirmation before exposing filters. POST exists,
but no POST probe or invoice mutation is authorized for this migration.

**Re-verification trigger:** Changes to invoice DTOs, type semantics, QR encoding,
currency/timezone rules, filtering/sorting, or financial calculations. The API
does not provide a currency field; SAR remains the established frontend convention.

---

## 13. Advertisements

Verified Advertisement model is relatively flat:

```text
id
title
image
deepLink
isActive
createdAt
updatedAt
```

The backend did not justify the older campaign/placement/status/scheduling model.

Multipart boolean serialization was live-verified using textual:

```text
"true"
"false"
```

Do not recreate removed campaign concepts without a real backend model.

---

## 14. Subscription Plans

Verified plan shape includes:

```text
id
name
description
price
billingCycle
isActive
createdAt
updatedAt
```

Important:

- there is a single `name`;
- there is a single `description`;
- there are no verified `features`, `sortOrder`, or rich plan-status fields;
- `price` was verified as a true decimal;
- `billingCycle` is returned as a numeric value despite Swagger representing it differently;
- the exact semantic mapping of the numeric `billingCycle` values remains **unconfirmed** unless re-verified with the backend team;
- no plan DELETE endpoint existed in the verified contract.

Do not expose plan deletion until the backend provides it.

---

## 15. Dealer Offers

Verified Offer model represents a titled, date-windowed bundle of fixed-amount discount lines.

Verified behavior:

- lines target a provider-service ID;
- `discountAmount` is a true decimal;
- server computes values such as original/discounted prices;
- `providerId` is derived from JWT and is not part of the normal write payload;
- write dates use the verified project-specific bare-local format;
- PUT replaces the items array as a full replacement.

### Critical status fact

Backend `isActive` was not a reliable business-status indicator in the verified flow.

UI status must be derived from the offer date window according to the established helper.

### Critical mutation-response fact

Offer POST/PUT responses were observed to return stale/ghost item data.

Do **not** render authoritative post-mutation state directly from those mutation responses.

Use:

```text
mutation
→ invalidate
→ re-GET
→ render refreshed data
```

---

## 16. Chat

Verified architecture:

- sending messages uses REST;
- SignalR is receive/realtime transport;
- loss of hub connection must not block a REST send action.

Do not gate a REST mutation on SignalR connection state unless the transport architecture changes.

### Conversation list inconsistency

A verified account returned a paginated envelope when populated, while an empty account returned a bare array.

The mapper must remain tolerant of both until backend behavior is standardized.

### Peer presence

The existing hub connection state is **not** proof that the other user is online.

Do not display peer-presence status using the client’s own hub connection.

Real peer presence requires a backend presence capability.

---

## 17. Notifications

The previously verified notification implementation was **not** a production-grade persisted user notification system.

Observed behavior at that time:

- SignalR hub path: `/hubs/notifications`;
- test event: `TestNotification`;
- payload included fields such as:
  - `type`
  - `title`
  - `message`
  - `sentAt`
- no verified notification ID;
- no verified persisted read/unread state;
- no verified order reference in the payload;
- no verified per-user targeting;
- test broadcast was effectively global;
- the hub was observed without the required authenticated targeting behavior.

Therefore:

Do not treat the historical Scrap notification shell as proof that real order notifications exist.

A production notification implementation requires re-verification of:

- authenticated hub connection,
- per-user targeting,
- persisted notification REST API,
- read/unread state,
- reference/order ID,
- real event emitted from business workflows.

---

## 18. Mutation Response Safety

Project-wide lesson:

Do not assume a successful POST/PUT response is always the newest authoritative entity representation.

Where backend behavior is uncertain or known to echo stale data:

```text
mutate
→ invalidate query
→ re-fetch
→ render server truth
```

Prefer this pattern over tightly coupling UI state to mutation response shape.

---

## 19. No False Product Behavior

If the backend lacks:

- DELETE,
- update,
- lifecycle transition,
- persisted notification,
- presence,
- filtering,
- relationship data,
- or another capability,

the frontend must not invent it.

Allowed product handling:

- hide unavailable action;
- clearly disable it;
- show a deliberate “coming soon” state when product-appropriate.

Never create a working-looking control backed only by mock behavior in a production/live section.

---

## 20. Adding a New Verified Fact

Add a fact to this document only when one of these is true:

1. observed through a live backend request;
2. proven through current production behavior;
3. confirmed by current backend implementation/team and reflected in the current product contract.

Use this format:

```md
### Fact name

**Verified behavior:**
...

**Frontend consequence:**
...

**Re-verification trigger:**
...
```

Do not record guesses as facts.

If uncertain, put the issue in `PROJECT_STATE.md` as a blocker/question instead.

---

## 21. Admin Coupons

### LIVE VERIFIED — reads and query behavior

**Verified behavior:** The pre-implementation Admin GET audit (2026-09-23),
provided in the approved Coupons task, observed:

- GET `/api/Coupons`: `{success,message,data:{items,pageNumber,pageSize,totalCount,totalPages},errors}`.
- GET `/api/Coupons/{id}`: the same Coupon entity in `data`.
- Entity: numeric `id`, `discountPercentage`, `minimumOrderAmount`, `usageLimit`,
  `usedCount`; `code`, `startDate`, `endDate`, `createdAt`; boolean `isActive`.
  `minimumOrderAmount` was observed null. Preserve Swagger's wider nullable
  contract for `code`, `minimumOrderAmount`, `usageLimit`, and `endDate`.
- An enabled coupon had already expired: `isActive` is administrative activation,
  not proof of temporal validity or remaining usage.
- Dates have no timezone suffix. The frontend preserves bare-local calendar/time
  values, following existing date handling; it does not append `Z`. Unchanged
  edit dates retain the original seconds/fractional precision.
- Nonexistent detail: HTTP 404, `success:false`, `data:null`, `errors:null`.
- `FilterBy=code&FilterValue=<full or partial code>` works; a nonmatching value
  returns an empty page. `FilterBy=isActive&FilterValue=true|false` works.
- `FilterBy=discountPercentage` and invalid filter fields returned HTTP 400.
- `DateFilterBy=createdAt` with `FromDate`/`ToDate` was tested successfully.
  `startDate`/`endDate` date queries were accepted; precise boundaries remain
  unverified. The UI exposes only created-at ranges.
- `SortBy=createdAt|endDate|usedCount` was accepted with `SortDescending`.
  One returned record proves field acceptance, not multi-record sort correctness.
- Beyond-last-page requests return HTTP 200, empty items and correct totals.

**Frontend consequence:** Use server pagination and recover an out-of-range page
with one bounded re-read. Code search and activation are alternative modes because
there is only one documented generic filter pair; do not invent combined filters.
Derive temporal status separately from activation and display usage independently.
Null limits/expiry are shown as “not set”, not as verified unlimited/never-expiring
semantics. No discount-percentage filter is exposed.

### SWAGGER DOCUMENTED — NOT LIVE-MUTATION-VERIFIED

Swagger request schemas were re-inspected on 2026-09-23. These are documentation
facts, not observed write behavior:

- POST `/api/Coupons`: `code` required, 1–50 characters;
  `discountPercentage` required, 1–100; `startDate` required date-time;
  nullable `minimumOrderAmount` (at least 0.01 when supplied), `usageLimit`
  (integer 1–2147483647), and `endDate` (date-time). **No `isActive` field.**
- PUT `/api/Coupons/{id}` uses the same rule/date fields but **neither `code`
  nor `isActive`**. The frontend constructs this body explicitly.
- PATCH `/api/Coupons/{id}/toggle-active` has no request body.
- DELETE `/api/Coupons/{id}` exists. Its live response and deletion constraints
  remain unverified.
- Read DTOs document nullable code/minimum/usage limit/end date. Page size is
  documented as 1–100. Frontend page choices are 10/20/50.
- Write responses are not treated as authoritative entities. Validate the success
  envelope, invalidate the affected lists/detail and re-GET. No live write probe
  was performed during implementation. Runtime write validation and response
  compatibility remain a release gate.

**Re-verification trigger:** Write deployment, date/timezone or boundary semantics,
multiple simultaneous generic filters, null business semantics, authorization,
sort correctness with multiple records, or any DTO/envelope change.

## 22. Transactions / Dealer Balances

### LIVE VERIFIED — supplied pre-implementation audit

The approved task reports GET `/api/transaction` returning
`{success,message,data:{items,pageNumber,pageSize,totalCount,totalPages},errors}`;
PageNumber starts at 1 and PageSize is at most 100. Missing detail and dealer
lookup return 404. GET `/api/transaction/dealer/{dealerId}` returns a single
entity, not a collection. Users filtered with `FilterBy=roleId&FilterValue=2`
return Dealer users. These are the supplied prior audit findings, not new
authenticated probes during this implementation.

### BACKEND BUSINESS CLARIFICATION — 2026-09-29

- `balance` is the FINAL stored balance; POST and PUT set/replace it. No delta,
  deposit, withdrawal, settlement, payment history, or ledger semantics.
- Currency is SAR. Display formatting does not round or alter the write value.
- `dealerId` is `Users.id` for `roleId=2`; there is no separate Dealer identity.
  The existing Users adapter calls the wire `roleId` field `role`.

### SWAGGER DOCUMENTED — re-read 2026-09-29, NOT LIVE-MUTATED

- Entity: `id`, `dealerId` (int64); nullable `dealerName`; `balance` (double);
  `isActive` (boolean); `createdAt` and nullable `updatedAt` (date-time).
- POST `/api/transaction`: required `dealerId`, `balance`.
- PUT `/api/transaction/{id}`: required `balance`, plus `isActive` (always sent
  explicitly by this UI). No dealer reassignment field.
- Neither write DTO specifies a minimum balance: negative/fractional finite
  numbers are accepted by the form, without client arithmetic or rounding.
- POST documents 200/201, PUT 200 with entity envelope; DELETE 200 with a
  Task-shaped `data` envelope. Validate success and refetch; do not display the
  mutation body as financial truth. No live POST/PUT/DELETE was performed.
- Generic filter/sort parameters are documented but their semantics are not
  proven; only pagination is exposed. Nullable page `items` is tolerated only
  when totalCount is zero, never used to conceal a populated response failure.
- Bare date strings retain existing formatting; no timezone suffix is appended.

### IMPLEMENTATION ASSUMPTION — V1, not backend uniqueness proof

One record per Dealer is a conservative UI policy isolated in
`createDealerBalance.ts`. Before POST, re-read the selected User (must still
be roleId=2) and perform an uncached dealer lookup. Existing record blocks POST
and offers editing; only a JSON failure-envelope 404 with null data establishes
absence. Other errors abort. The loaded list is an additional local warning,
not a complete uniqueness index. A concurrent external creation can still race
this preflight: backend uniqueness enforcement is unconfirmed.

Transactions has no dedicated permission in the current frontend permission
registry. The route remains inside the authenticated Admin/super_admin role
guard; server write authorization is still the security boundary. No unrelated
permission is substituted. Production availability is LIVE, independent of mocks.

**Re-verification trigger:** live mutation behavior, concurrency/uniqueness,
permission deployment, new query semantics, or DTO/currency/timezone changes.
