# Tow Truck workspace — incremental UX and dispatch preparation

> Subsequent increment: `TOW_TRUCK_INITIAL_ASSIGNMENT.md` documents the approved
> initial-assignment write path. Its eligibility, submission and recovery rules
> supersede the preparation-only restrictions below for initial assignments only.
> Reassignment and unassignment remain unavailable. The original Phase 2 record
> below describes its delivered baseline.

This increment requires the exact approved Phase 1 implementation. It supersedes
Phase 1's split-view UX, not its shared Orders GET architecture. It does **not**
complete backend dispatch mutations.

## Implemented experience

- A full-width queue uses operational rows when the actual content container is
  wide enough. Identity, route, customer/vehicle, payment and driver are distinct.
  Narrow screens use stacked cards. No permanent details pane or inner queue
  scrolling remains. Server pagination, total and explicit refresh are preserved.
- Opening `/admin/tow-truck/:orderId` presents a Radix modal with a dimmed, blurred
  backdrop, focus containment, initial close-button focus and body scroll lock.
  Only its content scrolls; toolbar and close control remain visible. Outside
  pointer dismissal is disabled; Escape uses the same navigation as Close.
- Queue-originated details return through history; direct/reloaded detail links
  replace themselves with the queue URL. Search parameters are retained. Focus
  and scroll return to the originating row where it still exists. Browser
  back/forward is supported through the existing route, without another router.
- Unsaved local proposals warn on route departure and browser unload. Switching
  request identity resets the form. Language changes do not erase its values.
- Arabic/English operational labels distinguish recorded order status, payment
  uncertainty, assigned driver identity and unknown availability. Known order
  labels use the existing shared mapping without redundant raw codes. Unknown
  payment/method values keep diagnostic codes. No trip stage is inferred.

## Phase 2 boundary: preparation, not execution

The UI allows permitted admins to prepare a **local, unsent proposal**:

1. Explicitly open preparation; driver GETs do not run beforehand.
2. Page through Users with `FilterBy=roleId`, `FilterValue=5`, page size 10,
   reusing the shared Users API and query keys. A response from another page,
   mixed role, malformed active value, unsafe ID or duplicate identity fails
   visibly. No invented search/status/availability filtering is added.
3. Select an active role-5 account. `isActive` describes the account, never online
   presence or trip availability. The current assigned driver cannot be selected
   as a proposed replacement; inactive accounts are visibly unavailable.
4. Enter proposed cost for a confirmed unassigned order and estimated duration.
   Zod/RHF enforce a finite cost >= 0.01 and trimmed duration of 1–100 characters.
   The form describes decimal input explicitly. Currency remains unconfirmed.
5. Review triggers fresh order and selected-user GETs via their shared caches.
   Identity, account role/activity and assignment/financial/status changes are
   checked. A failure preserves the proposal. Duplicate review clicks are locked.
   The review page labels the proposal unsent; it is never a success receipt.

Assigned orders never expose an editable cost. No amount is copied or derived
from subtotal, discount or total to satisfy a required paid-reassignment DTO.
The recorded amounts remain untouched. Missing assignment information disables
preparation; stale/loading order data disables review.

**Assign, reassign and remove-driver actions remain disabled with an adjacent
explanation.** No mutation transport, mutation hook, optimistic update, simulated
success or dormant write handler is introduced. Consequently uncertain write
outcomes and write retries are not reachable; their implementation remains
blocked with the write actions. Review only retries GETs.

### Exact missing requirements

- A trustworthy order-status-to-action eligibility matrix for each of assignment,
  reassignment and unassignment, including accepted/in-progress/completed stages.
- Authoritative payment code semantics, including null/0 and paid identification.
- The authoritative positive amount field for a paid reassignment payload, and
  the applicable quote currency/financial semantics.
- Mutation response/error and concurrency guarantees before enabling writes,
  including a safe way to reconcile uncertain outcomes without blind retry.

An endpoint's existence is insufficient to enable it for every recorded status.
Once the contract is resolved, implement writes through the shared Orders API,
revalidate permissions/order/driver before submission, lock duplicate submission,
confirm destructive changes, preserve paid totals, and reconcile by GET. Do not
silently enable existing generic Orders editing for Tow Truck orders.

## Evidence

| Item                                                | Evidence                                     | Limit                                                                            |
| --------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| Orders raw cache and detail/list keys               | VERIFIED BY SOURCE CODE                      | Unchanged in this increment                                                      |
| PUT/DELETE `/api/Orders/{id}/tow-truck-driver`      | VERIFIED BY SWAGGER                          | Published operations have no stage eligibility descriptions                      |
| PUT DTO `towTruckDriverId`, `cost`, `duration`      | VERIFIED BY SWAGGER                          | Cost minimum 0.01; duration 1–100; no authoritative paid-amount field identified |
| Backend ignores submitted cost on paid reassignment | User-provided contract                       | Not verified by a live mutation; DTO still requires positive cost                |
| Role 5 and role-filtered Users pagination           | VERIFIED BY SOURCE CODE; historical LIVE GET | Active account is not dispatch availability                                      |
| Order status names                                  | VERIFIED BY SOURCE CODE                      | Existing shared labels do not establish trip progress                            |
| Payment mappings and allowed action stages          | UNKNOWN                                      | Controls fail closed                                                             |
| Current Swagger                                     | Public GET checked during implementation     | No credentials required or persisted                                             |
| Phase 2 authenticated live behavior                 | NOT TESTED                                   | Prior credential expired; no live mutations executed                             |

Phase 1 historical live evidence is recorded in `TOW_TRUCK_PHASE1.md`. It is not
represented as fresh verification of this increment.

## Validation and acceptance limits

- Typecheck, production build, focused lint, focused formatting and Git whitespace
  checks pass. Production retains the existing large-chunk warning.
- Full ESLint remains the repository baseline: 106 errors, 24 warnings; comparison
  of file/rule/severity/message multisets found zero added diagnostics.
- 18 offline checks cover financial null/zero preservation, unknown enums, strict
  driver eligibility, validation, stale review snapshots, malformed pagination,
  unsafe links/coordinates and Arabic/English key parity. No backend writes run.
- Shared Orders/Admin source, router, dependencies and legacy adapters are
  byte-for-byte unchanged from Phase 1. No unrelated feature changes are included.
- Source layout review covers 320/360/390/768/1024/1280/1440+ widths, shrinking
  grid tracks, logical RTL spacing, full-screen mobile dialog, near-full-screen
  tablet/desktop dialog, long text wrapping and one content scroll area.
- Browser/visual/accessibility QA: **BLOCKED BY ENVIRONMENT**. The installed
  Playwright cannot launch because Chromium's executable is absent. No browser
  screenshots or rendered width/focus/scroll assertions are claimed.
- Before acceptance, render all seven widths in both languages; exercise loading,
  empty, malformed/missing, stale and error states, long labels, keyboard/radio
  navigation, focus return, Escape, draft discard, direct URLs, history and mobile
  keyboard scrolling. Actual server driver data and the proposed review flow need
  authenticated GET QA. Execution remains unavailable pending the contract above.
