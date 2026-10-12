# Tow Truck Operations Center — Phase 1

Implementation base: `a6599c5761c33caebd9462fbb461d6b1fdb4e816` (`origin/main`).
Delivery: unified Git patch, no implementation commit, push, PR or merge.

## Scope

- `/admin/tow-truck` and `/admin/tow-truck/:orderId`, guarded by `orders.view`.
- Admin sidebar entry; existing Orders tow-truck rows open specialized details.
  Generic edit/delete controls are hidden for tow-truck rows only. Other order
  types retain their existing controls and adapters.
- Shared Orders transport, query keys and raw GET cache. Existing Orders hooks
  select their unchanged legacy view models; the operations screen selects its
  own lossless, nullable projection. No Orders records in Redux.
- GET list uses `OrderType=3`, backend pages of 20 and existing createdAt descending
  sorting. No Status query, client status filtering, speculative search or global
  stage counters. Only the backend totalCount is displayed as total requests.
- GET detail runs only for a selected valid ID. Mismatched ID/type and malformed
  pagination fail visibly; missing responses never become an empty tow queue.
  Existing generic Orders fallback compatibility is preserved with explicit
  server-pagination provenance, rejected by the tow screen when absent.
- Refresh retains same-query data with an explicit stale banner on failure.
  New pages show skeletons instead of old rows mislabeled as the new page.
  Order/page changes use AbortSignal; detail placeholders never cross identities.
- No assignment, reassignment, unassignment, quote, payment, accept/complete or
  SignalR implementation. No online/available/busy indicator is invented.

## Contract evidence and boundaries

VERIFIED BY LIVE GET (prior audit, 2026-10-08): numeric and named TowTruck queries
returned five type-3 orders; pagination page 2 at size 2 returned two rows. List
and sampled detail included destination, vehicle, duration and assigned-driver
fields. All sampled orders had status 1, null/0 payment, no driver or duration.
Four role-5 users were returned as active. These observations are historical
samples, not guarantees about current data or mutation permissions.

The audit's Status=2, status=5, Status=Ready and FilterBy=status queries returned
status-1 orders, so this implementation does not expose that filter.

VERIFIED BY SWAGGER (GET rechecked 2026-10-11): Orders list/detail and pagination
parameters are published. OrderStatus is 1..5, PaymentStatus 1..4, PaymentMethod
1..5, without x-enumNames. A published Status parameter does not override the
failed behavioral probes. No fresh authenticated Orders GET was performed during
implementation: the previously provided credential has expired. No credentials
were saved, refreshed or used for mutations.

VERIFIED IN CURRENT SOURCE: order status labels reuse the existing shared mapping
(InWaiting/Ready/Shipped/Received/Canceled), displayed explicitly as recorded order
status with its raw code. The operational stage does not assume those names prove
trip acceptance, movement, completion or cancellation. No shared enum was changed.

UNKNOWN: authoritative payment code/name mapping (including null/0), current
payment-method semantics, currency, original quote amount, address\* pickup meaning,
driver availability and trip progress. Payment and payment method remain
unconfirmed with any returned numeric code visible. No amount proves payment;
null financial values remain missing and zero remains zero. Values are not
currency-converted or rounded to an invented currency precision.

The two current presentation stages are data-review cues: Needs review / Check
trip details. They do not claim a backend transition. Verified operational stages
can be added after contract resolution; financial actions remain Phase 2.

## UX and responsive behavior

- Purpose-built queue, strong selected state, compact route/customer/vehicle
  summaries, separate payment and assignment information and data-quality cues.
- Detail hierarchy: identity, next-step notice, reported status, route, customer,
  vehicle, driver, financial values, recorded duration, expandable notes/files.
- 320/360/390: one-column queue-to-detail flow, wrapping values and comfortable
  touch controls; financial rows stack below 390. No fixed mobile page width.
- 768/1024: single workspace pane. The Admin navigation becomes a drawer below
  1024; existing fixed sidebar remains on desktop.
- 1280/1440+: queue/detail split, bounded independent queue scrolling and adequate
  detail width. Browser-back/return retains page and focuses the originating row.
- Logical spacing and localized Arabic/English copy; language control; keyboard
  links/buttons, semantic sections/description lists, visible focus, explicit
  status/error announcements and reduced-motion styling.
- Location values are read-only. Range errors, absent coordinates, (0,0) and
  identical points are distinguished. Other plausible placeholders and address
  contradictions cannot be automatically verified. No GPS map or calculated ETA.
- Attachments accept absolute HTTP(S) links without embedded credentials; unsafe
  links are unavailable. Missing attachment data differs from a known empty list.

## Validation and review limits

- TypeScript and production build passed; build retains the existing large-chunk warning.
- Affected-file ESLint compared directly to origin/main: 44 existing errors
  (43 in router, 1 in OrdersPage), 44 after implementation. Zero new errors.
  New Tow Truck files and other changed files have no diagnostics.
- Focused formatting and Git whitespace checks required before export.
- Offline model/regression checks exercised null/zero financials, unknown enums,
  missing assignment, unsafe IDs/types, coordinates, links, pagination and legacy
  order list/detail adapter equivalence across all five order types.
- Browser QA: BLOCKED BY ENVIRONMENT. Playwright is available but Chromium's
  executable is absent. No repeated install/download was attempted. Responsive,
  RTL and accessibility assessments are source reviews, not rendered verification.
- Before acceptance: render all seven requested widths in Arabic and English;
  inspect selected/empty/loading/missing-data/error/stale states, keyboard/focus,
  browser back, long strings, touch behavior and Admin shell regressions.

No dependency, auth/RBAC policy, backend mutation or unrelated feature change is
part of this patch. Historical stash is untouched. The pre-existing chat file was
backed up externally and verified byte-for-byte against main before narrowly
restoring it to the old HEAD solely to permit switching; its main content remains
intact and is not part of the feature diff.
