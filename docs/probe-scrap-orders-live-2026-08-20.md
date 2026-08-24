# LIVE PROBE (READ-ONLY) — Can a scrap provider browse customer salvage Orders?

Repo: `Miqwad-Frontend`. Date: 2026-08-20. Follow-up to
`docs/probe-scrap-offers-2026-08-20.md` (Swagger-only session, which flagged this
exact question as UNVERIFIED). This session used a real `SalvageSpecialist` JWT
supplied by the architect (`TestScrap1@gmail.com`, userId `40`, role claim
`SalvageSpecialist`, base `https://miqwad-test.runasp.net/api`). Strictly
read-only: no writes attempted, no source edits, no commits.

---

## 1. VERDICT: **NO** — a scrap provider cannot browse customer salvage orders today

`GET /api/Orders` (with or without filters), `GET /api/Orders/{id}`, and
`GET /api/Users/{userId}/orders` **all return `403 Forbidden`** (empty body) for a
`SalvageSpecialist` token. This is a clean, consistent role-authorization block —
not a "not found" or validation error — so it isn't a filter/parameter problem, it's
the endpoint being closed to this role entirely.

Raw evidence:

```
GET /api/Orders                              → 403 Forbidden
GET /api/Orders?PageNumber=1&PageSize=10      → 403 Forbidden
GET /api/Orders/1                             → 403 Forbidden
GET /api/Users/40/orders  (the token's OWN userId) → 403 Forbidden
```

The same token works fine against other controllers, confirming the token itself
is valid and the block is role-specific to `Orders`:

```
GET /api/Offers        → 200 {"success":true,...,"data":{"items":[],"totalCount":0,...}}
GET /api/public/offers → 200 {"success":true,...,"data":{"items":[],"totalCount":0,...}}
```

Note even the scrap account's **own** orders (`/api/Users/40/orders`) are
forbidden — this isn't "scoped to caller only," it's "this role has no read access
to the Orders resource at all," which is a stronger and more clear-cut block than
the prior session hypothesized.

---

## 2. No alternate browse endpoint exists — `/api/public/salvages` is a red herring

Swagger has an `/api/public/salvages` path (sibling to `/api/public/tows`,
`/api/public/workshops`, `/api/public/offers`) that looked promising by name, but
its response schema is `UserResponseDtoPaginatedResultApiResponse` — the same
shape as `/api/public/workshops`/`/api/public/tows`. It is a **public directory of
registered scrap-provider businesses** (fields: `id`, `fullName`, `email`,
`phoneNumber`, `address`, `city`, `roleId`, `attachments[]` = profile photos) —
i.e. "list scrap yards a customer can browse," the mirror-image of what this task
needs. It has nothing to do with customer salvage *requests*. Confirmed by reading
its full Swagger definition; not worth a live call since the schema alone rules it
out.

No other path in the live 91-route Swagger matches `request|lead|salvage-order|
browse` in a way that suggests a scrap-scoped requests feed. The full path list
was re-scanned for this session; nothing new since the prior probe.

---

## 3. This blocks the browse-and-offer workflow — backend work is required

**Flag to architect, loudly:** there is currently no live endpoint through which a
`SalvageSpecialist` can see *any* customer salvage `Order`, their own or anyone
else's. The offer-linking mechanism (`POST /api/Offers` with `orderId`, confirmed
in the prior probe) has nothing to attach to from the scrap side — a scrap
provider has no way today to discover a valid `orderId` to offer against, short of
being told it out-of-band.

This needs one of:
- A policy change on `GET /api/Orders` (or `/api/Orders/{id}`) to authorize
  `SalvageSpecialist` for salvage-typed orders specifically, plus a filter that
  isolates `OrderType = Salvage`, or
- A new dedicated endpoint (e.g. `GET /api/Salvage/available` or similar) scoped
  to exactly this use case.

Either way, this is **backend work, not a frontend wiring task.** Do not build the
browse UI against `/api/Orders` — it will 403 for every real scrap account.

---

## 4. What's still confirmed reusable from the prior probe (unaffected by this finding)

- `POST /api/Offers` accepts `orderId`, `name`, `title`, optional `subtitle` /
  `description` / `isCompatibleWith` / `addressId` — this part of the workflow is
  fine once an `orderId` is obtainable.
- `GET /api/Offers` (own offers, "My Offers" page) works today (200, correctly
  scoped/empty for this fresh test account) — safe to wire now.
- No live write-probe of `POST /api/Offers` was attempted this session (would
  need a real salvage-typed `orderId`, which — per §1 — this token cannot
  discover through any live endpoint). Still needs a write-probe once a valid
  `orderId` is obtained (e.g. via an admin/customer token, or once the backend
  gap above is fixed).

---

## 5. Recommendation

Do not proceed to build the "browse orders" surface of the scrap Offers workflow
until the backend exposes a way for `SalvageSpecialist` to list salvage orders.
Everything else scoped in the prior probe (Offer creation/edit/delete, My Offers
list) can proceed independently since it doesn't depend on this gap.
