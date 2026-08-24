# VERIFY (read-only) — Scrap Orders(salvage) browse + Offers wiring

Date: 2026-08-23. Branch: `feat/scrap-orders-offers`. Strictly read-only — no edits, no
commits, no branch created, no write calls attempted.

---

## 1. PROBE verdict — BLOCKED, not completed as scoped

**No `SalvageSpecialist` JWT was available this session.** `GET /api/Orders` returns
`401 Unauthorized` with no token (confirmed live). I cannot run the decisive
`OrderType` enumeration (Part A, steps 1–2, 4–5) without a real token — doing so would
require guessing/fabricating a bearer token, which I won't do. **This needs the
architect to supply a fresh token and rerun Part A**, or run it themselves.

What I *could* and did verify without a token — fetching the live public Swagger
document (`GET /swagger/v1/swagger.json` → 200, no auth required) and diffing it
against the two prior probe docs in this repo:

- **`OrderType` is still an unnamed integer enum `[1,2,3,4,5]`** in the current live
  Swagger — no `x-enum-names`, so which integer means "Salvage" remains unconfirmed
  from documentation alone. This matches the prior probes' finding; still needs a
  live token to resolve.
- **`GET /api/Orders` takes `OrderType` as a dedicated top-level query parameter**
  (`schema: $ref OrderType`, i.e. an integer), separate from the generic
  `FilterBy`/`FilterValue` pair. This is a **new, decisive structural fact** the task
  brief didn't have: filtering by order type is not done via
  `FilterBy=type&FilterValue=Salvage` — it's `?OrderType=<int>`. (See §2 below: the
  current code does it the wrong way.)
- `PageSize` schema caps at `maximum: 100` — confirms "100 ok, 200→400" from prior
  sessions.
- Full `GET /api/Orders` query param list (confirmed from live Swagger): `OrderType`,
  `PageNumber`, `PageSize`, `SortBy`, `SortDescending`, `FilterBy`, `FilterValue`,
  `DateFilterBy`, `FromDate`, `ToDate` — matches the task brief.
- `OrderResponseDto` (live, current) fields: `id`, `userId`, `userFullName`, `type`
  (string — **not** `orderType`), `status`, `paymentMethod`, `paymentStatus`,
  `trackNumber`, `subtotal`, `discountAmount`, `totalPrice`, `addressTitle`,
  `addressDescription`, `addressShortNumber`, `addressLatitude`,
  `addressLongitude` (flattened, not a nested `address` object as the task brief's
  "Key new facts" described), `brandName`, `brandModel`, `brandYear`, `piecesName`,
  `serialNumber`, `createdAt`, `orderItems[]`, `attachments[]`, `offers[]`.
  **Detail shape carries no dedicated part-photo field beyond `attachments[]`**
  (same array as the list — not verified live whether `GET /Orders/{id}` populates
  more of it than `GET /Orders` list items do, since that needs the same missing
  token).
- **The Offers contract has changed since the 2026-08-20 probe docs.** `CreateOfferDto`
  today is `{ orderId, providerServiceId, startDate, endDate }` (all required) — it
  no longer has `name`/`title`/`subtitle`/`description`/`isCompatibleWith`/`addressId`
  at all. `UpdateOfferDto` is `{ providerServiceId, startDate, endDate }` (no
  `orderId`). This is a **backend contract change since the prior probes**, not a
  documentation error — the two `docs/probe-scrap-*-2026-08-20.md` files in this repo
  are now stale on this specific point and should not be used as the source of truth
  for the Offers payload shape.

**Bottom line: the exact working `OrderType` value for salvage is still unconfirmed.**
Nothing in this session found a way to resolve it without a token. Recommend the
architect either supply `TestScrap1@gmail.com`'s current token (the one in the old
curl is likely expired per the task brief) or run the 4 curls in Part A directly.

---

## 2. Current wiring state — fixture, not live, and the live path would be wrong today

**`salvageOrdersApi.ts:28`**
```ts
const SALVAGE_ORDERS_SOURCE: "fixture" | "live" = "fixture";
```
Still `"fixture"`, despite the file's own header comment (lines 11–19) describing the
switch as something to flip once GET /api/Orders opens up. The switch has **not**
been flipped even though the task's "Key new facts" state the endpoint is now
reachable (401 instead of 403, i.e. auth-gated but not role-blocked) — this looks
like an intentional not-yet-done step, not an oversight, since the live branch below
is also unfinished/wrong.

**The live branch, if flipped on today, would fail.** `salvageOrdersApi.ts:186–194`:
```ts
const { data } = await apiClient.get<{ data: RawOrdersPage }>("/Orders", {
  params: {
    PageNumber: page,
    PageSize: pageSize,
    FilterBy: "type",
    FilterValue: SALVAGE_ORDER_TYPE_FILTER_VALUE,  // "Salvage" (a string)
  },
});
```
Per the live Swagger (§1), `OrderType` filtering is a **dedicated query param taking
an integer** (`?OrderType=2`, etc.), not `FilterBy=type&FilterValue=Salvage`. This
query would either 400 or silently return unfiltered/wrong results — it's built
against the wrong mechanism entirely, independent of the still-unresolved "which
integer means Salvage" question. **This must be rewritten to `OrderType: <int>` once
the correct integer is confirmed (§1) before flipping the source switch.**

**Adapter field mismatch (`salvageOrdersApi.ts:41–78`)**: `RawSalvageOrder` /
`adaptSalvageOrder` only reads `id, brandName, brandModel, brandYear, piecesName,
serialNumber, attachments, status, type, createdAt, userFullName` — a subset of the
real `OrderResponseDto`. Everything else in the real shape
(`userId, paymentMethod, paymentStatus, trackNumber, subtotal, discountAmount,
totalPrice, addressTitle/Description/ShortNumber/Latitude/Longitude, orderItems,
offers`) is silently dropped, which is fine (the UI doesn't need purchase-order
fields for a browse view) — no adapter bug found, but flagging that `attachments[]`
is assumed to already be photo URLs; not verified live whether it needs any
transformation (e.g. a `filePath` extraction, the way `offersApi.ts`'s
`adaptProviderService` does for `RawAttachment.filePath` at line 66–68). Worth a live
check once the token is available, since the two adapters treat superficially
similar `attachments[]` arrays differently.

---

## 3. Offers wiring — correctly matches the CURRENT live contract

`offersApi.ts` and `useOffersQueries.ts` are real, live-wired (not fixture), and
match the current Swagger exactly (verified in §1):

- `GET /Offers` (`offersApi.ts:102-114`) — paginated, `PageNumber`/`PageSize`, maps
  `providerService.attachments[].filePath → images[]`. Matches live
  `OfferResponseDto`/`ProviderServiceResponseDto`.
- `POST /Offers` (`offersApi.ts:116-125`) — body `{ orderId, providerServiceId,
  startDate, endDate }`, all `Number(...)`-coerced ids, dates converted via
  `toDateTime()`. Matches live `CreateOfferDto` field-for-field, including the
  `additionalProperties: false` constraint (no extra fields sent).
- `PUT /Offers/{id}` (`offersApi.ts:127-136`) — body `{ providerServiceId, startDate,
  endDate }`, **`orderId` correctly excluded**. Matches live `UpdateOfferDto`.
- `DELETE /Offers/{id}` (`offersApi.ts:138-140`) — plain delete, matches Swagger.
- JWT auth: `apiClient` is the shared authenticated axios instance
  (`@shared/lib/axios`) used identically to every other live-wired module — no
  bypass or missing-auth issue found.
- **No price or photos sent** — confirmed: `CreateOfferPayload`/`UpdateOfferPayload`
  types (`types.ts:213-229`) have no `price`/`photos` fields, and the current
  `OfferForm` (`PartRequestDetailContent.tsx:110-373`) only collects
  `providerServiceId`/`startDate`/`endDate` — there is no photo-upload UI on the
  offer form at all today (see §4, the "dropImage" bug does not exist in this flow).

**Note this is a bigger contract change than "no price/photos yet"**: the live
backend has moved from a free-text offer (`name`/`title`/`description`) to a
catalog-linked offer (`providerServiceId`, pointing at the provider's own existing
service/part). The current code has already been rebuilt around this
(`useScrapPartsQuery` + a part-selector dropdown, `PartRequestDetailContent.tsx:120-
334`) — this is consistent with the live contract, not a leftover bug, but it's a
structural pivot from what both prior probe docs (and the task brief's own framing)
describe, so flagging it explicitly in case the architect is still working from the
2026-08-20 contract in their head.

---

## 4. The 3 UI bugs from the task brief — NOT PRESENT in current code

1. **`dealer.products.form.dropImage` exposed key** — the only occurrence in the
   entire `src/` tree is `ProviderImageUpload.tsx:95`, inside a **JSDoc `@example`
   comment block** (lines 88-104), not executable code. `ProviderImageUpload` is not
   used anywhere in the scrap offer flow at all — the current `OfferForm` has no
   image upload (§3, matches the live no-photos-on-offers contract). This bug either
   was already fixed by removing the offer photo dropzone entirely, or the task
   brief's description predates that removal. Nothing to fix; the flagged component
   isn't rendered.

2. **Empty grey circle image placeholder** — both image-thumbnail components in this
   area (`SafeThumb` in `PartRequestDetailContent.tsx:68-90`, `PartThumb` in
   `ScrapPartRequestCard.tsx:41-66`) already render a proper fallback: a
   `bg-[var(--color-surface-2)]` box with a centered `lucide-react` `Package` icon,
   triggered by `onError`/missing-src, not a bare empty circle. No fix needed here
   either — this looks already resolved.

3. **`trackNumber` / "الرقم التسلسلي" shown in the detail** — the field actually
   rendered at `PartRequestDetailContent.tsx:624-631` is `order.serialNumber`
   (`SalvageOrder.serialNumber`, sourced from `Order.serialNumber` — a **product**
   identifier the customer enters when submitting the salvage request), gated behind
   `{order.serialNumber && (...)}` under the i18n key
   `scrap.partRequests.serialNumber` → **"الرقم التسلسلي"** (`i18n.ts:2385`, en
   `:4990`, "Serial Number"). This is a genuinely different field from
   `Order.trackNumber` (a shipping/logistics tracking number, part of
   `OrderResponseDto` per §1, unrelated to salvage part identification) —
   **`trackNumber` itself is not referenced anywhere in `src/modules/scrap/`** (only
   `serialNumber` is). If the architect's intent is specifically "remove
   `Order.trackNumber`," there is nothing to remove — it was never wired. If the
   intent is "remove this serial-number display because Arabic
   'الرقم التسلسلي' reads the same as what they meant by trackNumber," that's a
   product decision, not a bug — flagging the ambiguity rather than guessing which
   one to delete.

---

## 5. Removed sections stay removed — confirmed

`PartRequestDetailContent.tsx` contains no escrow/warranty timeline, no order-number
display, no shipping action/`MarkShippedButton` in the render path — the only hits
for `escrow|warranty|requestNumber|MarkShipped` in that file are two lines of
explanatory JSDoc (lines 8-9) describing the removal, not live code. `tsc -b
--noEmit` passes clean (exit 0, no errors) with these files in their current state.

**Blast-radius note (adjacent, not touched by this change):** the old
escrow/`PartRequest`-lifecycle model is still alive and fixture-backed in
`ScrapDashboardPage.tsx`, `PartRequestPreviewRow.tsx`, `lib/escrowLifecycle.ts`,
`lib/partRequestLifecycle.ts`, `useScrapQueries.ts`, and `api/scrapApi.ts` — the
dashboard's "recent requests" widget is a separate surface that has **not** been
migrated to the new `SalvageOrder`/`Offer` model yet. Nothing is broken (it's
internally consistent fixture code, compiles fine), but it's now inconsistent with
the rebuilt part-requests/offers pages — worth a note for whenever that widget gets
its own pass.

---

## 6. Filters — client-side over the fetched (fixture) list, using real Order fields

`ScrapPartRequestsPage.tsx:79-90`: brand filter, "not yet offered" cross-reference,
and search are all plain `Array.filter()` over the already-fetched
`useSalvageOrdersQuery({ pageSize: 100 })` result — not server params. They filter on
`order.brand`, `order.model`, `order.partName` — all real `OrderResponseDto`-sourced
fields once live (`brandName`/`brandModel`/`piecesName` per §1), not
mock-only fields. "Not offered on yet" cross-references `useOffersQuery`'s
`orderId`s client-side, matching the plan documented in the prior probe (§3 of
`probe-scrap-offers-2026-08-20.md`). No server-side `FilterBy`/`DateFilterBy` usage
anywhere in this page — reasonable given the small (`pageSize: 100`) fixed page size
and that the exact server-side filter contract for `piecesName`/`brandName` search
was never confirmed live.

---

## 7. i18n — no other exposed/wrong keys found; ar/en symmetric

Spot-checked every key referenced by the files in scope
(`serialNumber`, `browsingUnavailableTitle/Description`, `providerServiceLabel/
Placeholder`, `notOfferedFilterLabel`, `brandFilterLabel/All`,
`alreadyOfferedBadge`, `startChat`, `chatComingSoon`, and the `scrap.offer.*`/
`scrap.myOffers.*` keys used in `OfferForm`/`MyOfferPanel`/`ScrapOfferCard`) against
`src/app/i18n.ts` — every key exists in both the `ar` tree (~2300-2395) and `en` tree
(~4870-5000) with a real translated string, no raw/untranslated values found, no
`namespace.subnamespace` typos. `t()` calls throughout render Arabic-first RTL text
correctly.

---

## 8. Blast radius — confirmed scrap-scoped

- `SalvageOrder`, `Offer`, `OfferProviderService`, `CreateOfferPayload`,
  `UpdateOfferPayload`, `salvageOrdersApi`, `offersApi`, `useSalvageOrders*`,
  `useOffersQueries*` are all new/scoped inside `src/modules/scrap/` with no
  cross-module imports found outside scrap.
- `useScrapPartsQueries.ts` reuses the pre-existing shared `providerServicesApi`
  (`@shared/provider-services`) — already live-wired, out of scope for this probe,
  not modified here.
- `npx tsc -b --noEmit` passes with exit 0 across the whole project — no type errors
  introduced by any of the files reviewed.
- Nothing outside `src/modules/scrap/` touches any of the files/types reviewed in
  this report.

---

## Summary for the architect

| Item | Status |
|---|---|
| Correct `OrderType` int for Salvage | **Still unconfirmed — needs a live token, blocked this session** |
| `GET /api/Orders` reachable (401 vs 403) | Confirmed via anonymous call (401, no token) — consistent with "no longer role-blocked, just needs auth" |
| Live query mechanism | **Wrong in code today**: uses `FilterBy=type&FilterValue=Salvage`; live Swagger requires a dedicated `OrderType=<int>` param |
| `SALVAGE_ORDERS_SOURCE` switch | Still `"fixture"` — correctly not flipped yet, since the live query is broken |
| Offers CRUD wiring | **Correct**, matches current live contract exactly (verified against fresh Swagger fetch) |
| Offers contract itself | Changed since 2026-08-20 docs — now `providerServiceId`-based, not `name`/`title`/free-text — code already reflects this |
| 3 named UI bugs (dropImage key, grey placeholder, trackNumber) | **None reproduce in current code** — either already fixed, or based on a field (`trackNumber`) that isn't actually wired anywhere in scrap |
| Removed sections (escrow/order-number/shipping) | Confirmed removed from the rebuilt detail view; legacy versions still live untouched in the dashboard widget |
| Filters | Client-side, real fields, reasonable given fixture/small-page-size state |
| i18n | Clean, symmetric |
| Blast radius | Scrap-scoped, `tsc` clean |

**Single highest-priority next step:** get a fresh `SalvageSpecialist` JWT to the
architect (or run Part A live) to resolve the `OrderType` integer, then fix
`salvageOrdersApi.ts`'s live-branch query to use `OrderType=<int>` instead of
`FilterBy`/`FilterValue`, before flipping `SALVAGE_ORDERS_SOURCE` to `"live"`.

---

## Session 2 (same day, fresh token) — LIVE probe completed, list endpoint is broken server-side

A fresh `SalvageSpecialist` token (userId 40, `TestScrap1@gmail.com`) was supplied and
used against `https://miqwad-test.runasp.net/api` before its ~21:00 UTC expiry.
Real curl calls only — nothing fabricated.

### Auth sanity (rules out a silently-swallowed 401/403)

| Call | Result |
|---|---|
| `GET /Offers` (known-good, existing endpoint) | **200**, real data returned |
| `GET /Orders/10017` (a real order id referenced by this user's own offers) | **200**, real data returned |
| `GET /Orders/1` (id that doesn't exist) | **404** `"الطلب 1 غير موجود."` |
| `GET /Orders?OrderType=1` with garbage token | **401** |
| `GET /Orders?OrderType=1` with no token | **401** |

The token and `apiClient` auth wiring are fine — 401 shows up exactly when it should,
and both a known real order id and an unrelated live endpoint (`/Offers`) return 200
on this same token.

### `OrderType` integer for salvage — CONFIRMED = 2

`GET /Orders/10017` → `200`, full body includes both the salvage-shaped fields
(`brandName`, `brandModel`, `brandYear`, `piecesName`, `serialNumber`, `attachments:
[]`, nested `offers[]`) **and** `"orderType": 2` as a raw integer. This directly
confirms `OrderType=2` is the salvage value — not inferred from probing the list
endpoint (which is broken, see below), but read directly off a real order's own
detail payload.

Real `GET /Orders/{id}` response shape (top-level, flattened — not the nested
`OrderResponseDto` the task brief described):
```
id, userId, userFullName, orderType (int), status (int), paymentMethod,
paymentStatus, trackNumber, subtotal, discountAmount, totalPrice,
addressTitle, addressDescription, addressShortNumber, addressLatitude,
addressLongitude, createdAt,
brandName, brandModel, brandYear, piecesName, serialNumber, attachments[],
offers[]  (embedded array of this order's own submitted Offer records)
```
`status` is a **raw integer** here (`1`), not a string — differs from the
`OrderSummaryResponseDto` example in Swagger which shows `orderType` serialized as a
string name (`"SpareParts"`). The two DTOs (list-summary vs detail) evidently
serialize differently; only the detail shape was confirmed live this session.

**Photos/attachments**: the `attachments` field exists on the detail response and is
an array (confirmed present in the schema/response), but for this specific test order
it was empty (`[]`) — no live example of a populated `attachments[]` was available to
confirm the item shape (string URL vs `{filePath}` object, same ambiguity
`offersApi.ts`'s `RawAttachment.filePath` handles for provider-service attachments).
Not a "photos are missing from the backend" gap — the field is there, this test order
just has none uploaded. `salvageOrdersApi.ts`'s adapter treats `attachments` as
`string[]` directly (unchanged assumption); flag for re-verification once a salvage
order with real attachments is available to probe.

### `GET /api/Orders` (the LIST endpoint) — CONFIRMED BROKEN for this role, backend-side

Every one of the following returned **400** `{"success":false,"message":"بيانات غير
صالحة.","data":null,"errors":null}` (generic, non-field-specific):
- `OrderType=1` through `OrderType=5` (the full enum range), with and without
  `PageNumber`/`PageSize`, with `PageSize=10` and `PageSize=100`
- `OrderType=2` (the now-confirmed salvage value) alone, and combined with paging
- `OrderType` omitted entirely
- `OrderType` as a string enum name (`Salvage`, `SpareParts`, lowercase `salvage`)
- `FilterBy=type&FilterValue=Salvage` (the old mechanism) alone, and combined with
  `OrderType=1`
- lowercase `orderType=2` (casing variant)

Only genuinely malformed input produced a *specific* model-binding error:
`OrderType=0` → `"The value '0' is invalid."` (0 is outside the `[1,2,3,4,5]` enum);
`OrderType=1.0` → `"The value '1.0' is not valid for OrderType."` (non-integer
format). Every syntactically valid value — including the confirmed-correct `2` —
hits the same generic 400, which is the signature of a validation/authorization
failure happening *after* successful model binding, not a wrong-parameter problem.

Combined with the auth-sanity table above (this exact token gets 200s on `/Offers`
and `/Orders/{id}`, and clean 401s when actually unauthenticated), **this points to a
backend bug or an undocumented restriction blocking the `SalvageSpecialist` role from
the `GET /Orders` collection endpoint specifically** — not a query-construction
mistake on the frontend. No combination of parameters this session tried unblocked
it. This is not fixable from `salvageOrdersApi.ts`; it needs the backend team to
either fix the 400 or confirm the intended access pattern for this role (e.g. maybe
list access is meant to be admin-only, and providers are expected to discover orders
some other way — no such alternative endpoint exists in the current live Swagger;
`/api/public/salvages` was checked and is a **directory of salvage-provider Users**,
not orders, so it's not a substitute).

### Offers contract — reconfirmed, no changes needed

`GET /Offers` live response matches `offersApi.ts` exactly:
`{id, orderId, providerServiceId, startDate, endDate, providerService: {id,
providerId, serviceId, serviceName, orderId, quantity, price, notes,
isCompatibleWith, attachments[{id, originalFileName, filePath, contentType, type,
fileSize, createdAt, userName}], brands[]}, createdAt}`. `offersApi.ts`'s adapter
already correctly extracts `filePath` into `images[]` and doesn't send `price`/
`photos` in `create`/`update`. No live offer was created (non-destructive constraint
honored) — the existing real offers (`id: 1`, `id: 2`, both on `orderId: 10017`) were
sufficient to confirm the shape without a new write.

### Fixes applied this session

`salvageOrdersApi.ts`:
- `SALVAGE_ORDER_TYPE_FILTER_VALUE = "Salvage"` (`FilterBy`/`FilterValue` string) →
  replaced with `SALVAGE_ORDER_TYPE = 2` (confirmed int), and the live `list()` query
  now sends `OrderType: 2` as a dedicated param instead of `FilterBy`/`FilterValue`.
- `RawSalvageOrder` / `adaptSalvageOrder` updated to match the real detail shape
  (`userId`, `orderType`, integer `status`, no more assumed `type` field).
- `list()`'s catch now treats **400 as well as 403** as the "forbidden"/blocked UI
  state, since 400 is the confirmed real-world failure mode for this role today —
  the UI should show its friendly blocked state, not a raw error, either way.
- **`SALVAGE_ORDERS_SOURCE` left as `"fixture"` — NOT flipped to `"live"`.** Flipping
  it would put the list page permanently into its blocked/error state, since the
  underlying `GET /Orders` collection endpoint 400s unconditionally for this role
  today. The live query logic is now correct and ready to flip the moment the
  backend fixes the list endpoint — no frontend change will be needed at that point,
  just the one-constant flip.
- `npx tsc -b --noEmit`: exit 0. `npx eslint` on both changed files: exit 0 (clean).

### What's real-wired vs still prepared

| Surface | State |
|---|---|
| `GET /Orders/{id}` (single salvage order detail) | Live-ready, correct shape confirmed — but unused while list source is fixture (list page never has a real id to look up) |
| `GET /Orders` (salvage list/browse) | **Blocked — backend 400s unconditionally for `SalvageSpecialist`.** Query logic fixed and ready; switch stays on `"fixture"` until backend unblocks it |
| `GET/POST/PUT/DELETE /Offers` | **Fully live**, unchanged this session, reconfirmed against fresh live data |

### Backend gap to flag to the team

`GET /api/Orders` (the paginated list/browse endpoint) is inaccessible to the
`SalvageSpecialist` role — every valid `OrderType` query returns a generic 400,
while the same token works fine on `GET /Orders/{id}` and `GET /Offers`. This blocks
scrap providers from ever browsing open salvage requests server-side; they can only
view orders whose id they already know (e.g. one they already have an offer on).
Needs a backend-side fix or an explicit statement of the intended access pattern.
