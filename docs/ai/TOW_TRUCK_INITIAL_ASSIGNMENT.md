# Initial Tow Truck driver assignment and quotation

Incremental extension of the exact Phase 1 + Phase 2 implementation. No recreation
of either baseline, generic Orders editing, reassignment or driver removal.

## Contract and evidence

- **Backend-team confirmation supplied by the user:** initial assignment is
  allowed for an unassigned TowTruck order in InWaiting. PUT accepts numeric
  `towTruckDriverId`, numeric `cost`, and string `duration`; successful quotation
  establishes Pending payment. The customer pays in their app.
- **VERIFIED BY SWAGGER (public GET):**
  `PUT /api/Orders/{id}/tow-truck-driver`, required DTO fields, cost >= 0.01,
  duration 1–100 characters, and a 200 response with `{success:true,data:...}`.
  A malformed success acknowledgment is not treated as confirmed success.
- **VERIFIED BY SOURCE:** shared numeric maps TowTruck=3, InWaiting=1 and
  Pending=1; role TowTruckDriver=5. Existing actual GET projection expects numeric
  codes. Pending is the attested payment mapping; other payment names are not
  inferred. The generic Orders enum helpers remain unchanged.
- No authenticated live assignment, payment, deletion or driver operation was
  executed. Public Swagger GET and offline tests do not prove live write behavior.

## Exact eligibility and confirmation

The preparation/submit UI requires `orders.manage` and `users.view`, successfully
loaded current detail, a confirmed null driver (undefined/0 is not absence),
InWaiting status, and no unsupported payment code. Null/0 legacy payment and
Pending=1 are admitted; all other values fail closed, including possible paid
requests. The shared adapter rejects wrong order type and invalid identities.

The final button appears in a review showing order number, driver name/ID,
cost and duration. It is disabled during operations, stale/error reads, changed
review snapshots, missing permissions, ineligible status/assignment/payment or
unresolved previous outcomes. Clicking it explicitly confirms the initial quote;
it never initiates payment or a driver trip action.

Immediately before PUT, the operation:

1. Acquires a synchronous per-user/order operation lock in the QueryClient.
2. Validates driver ID, finite numeric cost >= 0.01 and trimmed duration 1–100.
   Decimal conversion must preserve the entered value; unsafe numeric precision
   is rejected. No currency or currency rounding rule is invented.
3. GETs the selected user, checking identity, role 5 and boolean `isActive=true`.
   Active account does not mean online or available.
4. GETs the order afresh after canceling older detail reads. It checks identity,
   type, InWaiting, confirmed absence of a driver, payment guard and unchanged
   assignment/financial/status review snapshot.
5. Rechecks current authenticated-user identity and permissions, saves a minimal
   pending-result session marker, and sends exactly one PUT via shared Orders API.

A QueryClient journal retains operation status across dialog remounts. A scoped
sessionStorage marker retains only that an outcome needs checking across reloads;
it contains no quote, driver/contact data, tokens or credentials. If the marker
cannot be saved, no PUT is sent. There is no new global auth or retry policy:
the individual PUT opts out of the existing interceptor replay with `_retry:true`.
TanStack mutation retries are explicitly disabled.

The dialog blocks closing/navigation during preflight, PUT and reconciliation.
A browser force-close/reload cannot be prohibited; the retained marker then
requires GET recovery. Field values survive validation/network failures in the
open dialog, and are reset only after acknowledged success plus refreshed driver
identity. No financial/order cache is optimistically fabricated.

## Results and recovery

| Outcome                                             | Behavior                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 400/422 or explicit failure envelope                | Validation banner/details; proposal preserved; new review required                 |
| 401/403                                             | Authentication/permission error; no interceptor replay                             |
| 404                                                 | Request unavailable; no false success                                              |
| 409                                                 | Conflict message; new review and fresh checks required                             |
| Timeout/network/5xx/malformed 2xx                   | Invalidate Orders and immediately GET authoritative detail; no automatic PUT retry |
| Unknown outcome, GET still eligible and unassigned  | Permit explicit new review/confirmation; do not claim prior success                |
| Unknown outcome, GET shows assigned driver          | Observe assignment and stop writes; do not attribute it to this attempt            |
| Unknown outcome, GET fails/ineligible unknown state | Remain locked; Check outcome performs GET only                                     |
| Acknowledged write, detail fails or driver differs  | Keep accepted-but-unreconciled state; GET recovery only, no resubmission           |
| Acknowledged write plus matching refreshed driver   | Confirm success; show accepted quote receipt and actual refreshed order data       |

All Orders queries are invalidated; active lists refetch. Fresh validated raw
order detail is written into the existing shared detail cache. Its payment value
controls Pending display; a quote is never labeled Paid. The receipt identifies
submitted cost/duration; recorded subtotal/discount/total stay server-authoritative
and are not assumed interchangeable with the quote DTO.

## Remaining boundaries

- Reassignment, paid reassignment, unassignment, payment and driver actions remain
  unavailable. No new DELETE method/handler is introduced.
- No backend idempotency key, ETag or atomic concurrency guarantee was supplied.
  Fresh GET reduces stale actions, but the server must enforce initial-assignment
  eligibility atomically across admins/tabs and late-running requests. Manual
  retry after an ambiguous result always requires a fresh eligible GET and a new
  confirmation; it is not an automatic or exactly-once delivery guarantee.
- Quote currency and mappings beyond Pending remain unconfirmed. Do not infer
  payment completion from cost, totals or response success.
- Browser/visual QA remains subject to environment availability. Static/build and
  offline checks do not certify rendered focus, responsive layout or live writes.

## Reproducible validation

Run `node scripts/check-tow-truck-initial-assignment.cjs` from the repository.
It loads the actual TypeScript models, orchestration and Orders transport through
TypeScript's installed transpiler, stubbing transport completely. Tests exercise
eligibility, permissions, validation/precision, changed snapshots, fresh read order,
duplicate clicks, error classes, ambiguous outcomes, persistent-lock recovery,
acknowledged-but-unread results, payment display and interceptor replay opt-out.
No backend requests or real customer data are used by this script.

Validation in the delivery environment: TypeScript and production build passed;
focused lint passed, and full lint remained at 106 errors / 24 warnings with no
new diagnostics. The 20 offline checks passed. Browser QA is BLOCKED BY
ENVIRONMENT: Playwright is present, but the Chromium executable is absent. No
rendered/mobile/keyboard or live assignment verification is claimed. Production
retains the repository's existing large-chunk warning.
