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
{ filePath: string }
```

—not plain URL strings.

---

## 12. Invoices

Verified invoice DTO at the time of implementation was minimal:

```text
id
fullName
totalPrice
createdAt
```

List and detail were effectively the same minimal shape.

No line items, tax, payment detail, or party detail were available in the verified DTO.

The UI intentionally avoids fabricating these values.

Re-probe before activating richer invoice sections.

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
