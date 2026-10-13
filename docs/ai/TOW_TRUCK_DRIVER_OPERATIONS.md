# Tow Truck driver operations and account management

Date: 2026-10-12. Scope: driver removal and account activation/deactivation, plus the previously approved UX messaging increment missing from the published feature branch. No live mutations were executed.

## Baselines and patch boundary

- Published patch base commit: `87335d6366711fe30ebe341989a7ddd8d49a788e`.
- Published base tree: `11b0811940cf935512111b2825ad914df7aa45df`.
- Approved pre-task local implementation tree: `b70697de30bbca401a3d4becef4b4cb4a333fbd6` (25 verified implementation files, backed up externally before editing).
- Local branch remains `feat/admin-tow-truck-operations-phase2`; HEAD remains `a6599c5761c33caebd9462fbb461d6b1fdb4e816`. The real index and historical stash are preserved.
- Export compares the published feature tree with the complete final implementation tree using isolated temporary indexes. It does not repeat Phase 1, Phase 2 or initial-assignment code already published.
- `scripts/check-tow-truck-initial-assignment.cjs` is a **new path relative to the published base**. A Windows copy may already exist untracked. Back it up externally and verify its hash before moving that untracked copy out of the way; never overwrite a tracked or different file silently. `git apply --check` is mandatory. Other local messaging changes also require reconciliation before applying this self-contained patch.

## Evidence and contracts

| Capability                                                              | Evidence                                                            | Implemented behavior                                                                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `DELETE /api/Orders/{id}/tow-truck-driver`                              | VERIFIED BY SWAGGER; removal attempts approved by user              | Shared Orders client; no request body; fresh TowTruck order, ID and assigned-driver validation; explicit confirmation       |
| `PATCH /api/Users/{id}/deactivate`                                      | VERIFIED BY SWAGGER and SOURCE CODE                                 | Shared Users client; `{ note }`, trimmed 1–500 characters; fresh user identity, role 5 and active state                     |
| `PATCH /api/Users/{id}/activate`                                        | VERIFIED BY SWAGGER and SOURCE CODE                                 | Shared Users client; no request body; fresh identity, role 5 and inactive state                                             |
| User read and role/account fields                                       | VERIFIED BY SOURCE CODE and Swagger                                 | Existing Users adapters/cache; strict ID, role and boolean `isActive` checks; controlled reads reject failure envelopes     |
| Permission codes                                                        | VERIFIED BY SOURCE CODE                                             | Removal: `orders.view` + `orders.manage`. Account: `orders.view` + `users.view` + `users.suspend` or `users.restore`        |
| Pending payment code 1                                                  | Existing verified contract evidence                                 | Pending warning; sending an initial quote never marks payment paid                                                          |
| Numeric payment codes 2, 3, 4                                           | UNKNOWN semantic names in authoritative evidence                    | Existing conservative payment presentation preserved; these values require stronger unassignment warning and acknowledgment |
| Literal `Paid`                                                          | Explicit semantic value, defensive runtime support; NOT LIVE TESTED | Paid-specific confirmation; never inferred from an amount or unknown numeric code                                           |
| Live removal, paid removal, driver activation/deactivation in this task | NOT TESTED                                                          | No live POST/PUT/PATCH/DELETE executed                                                                                      |
| Availability / realtime                                                 | UNKNOWN; no supporting capability verified                          | No Online/Offline, Available/Busy, GPS, realtime or workload controls                                                       |

Swagger was read via GET on the documented test service during this task. The successful mutation schemas advertise HTTP 200 envelopes. The client also handles an empty HTTP 204 as an acknowledgment (covered offline, not claimed live). `success:false`, missing/malformed acknowledgments and unexpected response statuses never produce a success message.

A populated paid order is not blocked merely because it is paid. Unknown numeric payment states remain eligible to attempt removal after a stronger financial warning and explicit acknowledgment; this does not assert that the server will permit the action. No financial, invoice, refund, payment-method or cancellation field is written by this workflow. Financial values shown after removal come exclusively from the refreshed order. Changed or unavailable pre/post financial comparisons generate a warning.

## UX and operational separation

The existing full-width queue and full-screen request dialog remain. A driver-management section separates **this order's driver** from **driver account access**. Removal has its own confirmation; account controls open a focused, paginated driver-account workspace. An inactive account can be selected for activation. No driver is presumed available from account activation.

Account confirmation shows the driver name/ID, associated order context and the consequence of activation/deactivation. Deactivation requires a reason; it is kept in memory on rejection or network failure, and survives closing/reopening the nested dialog. Choosing a different account requires clearing that reason so it cannot silently be applied to the wrong person. Leaving the request uses the existing unsaved-draft guard. Nothing promises persistence of form drafts across a hard browser reload.

Radix dialog primitives provide focus trapping and modal behavior. The Cancel/Close control receives initial focus, focus returns to the originating control, outside dismissal is prevented, and Escape/closing is locked during a live operation. Outcome feedback uses live regions and focused feedback. Controls wrap on narrow widths and have 44px minimum height; the dialog has an independent viewport-constrained scroll area. CSS uses logical properties, explicit RTL direction and reduced-motion-compatible behavior. Actual keyboard, screen-reader, mobile and visual QA remains **BLOCKED BY ENVIRONMENT** (no runnable Chromium); source assessment is not visual verification.

Arabic and English messages distinguish confirmed success, explicit rejection, uncertain result, observed state and accepted-but-not-yet-refreshed state. Backend text is not injected into these new action messages. The existing exact busy-driver 409 assignment mapping remains unchanged.

## Submission, recovery and concurrency

1. Validate permission, identity, reason and existing unresolved operation.
2. Lock the operation synchronously, fetch authoritative data, and compare the reviewed snapshot. Changes to driver, order status, payment or relevant financial values require renewed confirmation. Account identity, role, status or name changes do likewise.
3. Check current actor and permissions again after the GET. Write a minimal session journal before any mutation. Failed safety storage prevents submission.
4. Send once per confirmation with TanStack mutation retry disabled and the existing Axios refresh/replay path opted out. The shared Users functions use an optional controlled mode; existing Users callers retain their behavior.
5. Validate the acknowledgment, invalidate Orders/Users list caches, and fetch the affected record. UI uses only authoritative GET data, never an optimistic driver/account/financial update.
6. Explicit 400/401/403/404/409/422 or failure-envelope rejections remain failures. Refresh the affected record after non-auth rejection; show refresh failure separately. No automatic mutation retry occurs.
7. Timeout/network/5xx/malformed response triggers GET reconciliation. A matching observed state without acknowledgment is reported as observed, not attributed to this mutation. An unchanged verified state allows only a new review and confirmation. A different assigned driver is never automatically removed.
8. Acknowledged mutations with failed or not-yet-matching GET stay locked with a read-only Check outcome action. Failed reconciliation also stays locked. Journal recovery after reload is GET-only.

The actor-scoped Query cache and session journal coordinate removal, activation/deactivation and initial assignment within this browser tab. The journal stores action and order/driver IDs plus an acknowledgment flag, never credentials, names, notes or amounts. Malformed/unreadable journal data conservatively blocks operations and requests support review.

After a removal attempt, a per-order session safety marker blocks using **initial assignment as an unapproved reassignment workaround**, even if the server clears financial data. The marker is intentionally retained for this session, including after a rejected removal attempt; an existing assigned order was already ineligible for initial assignment. There is no automatic replacement, cancellation or refund. Reassignment remains unavailable.

## Explicit limits

- Fresh GET plus snapshot checks reduce races but cannot make GET + DELETE/PATCH atomic. No version/ETag/conditional-write/idempotency contract was supplied. Another administrator or browser tab can change data after the GET. Backend authorization and business rules remain final. Locks do not claim cross-tab or cross-device exclusion.
- The complete stage-by-stage rules for paid/unpaid reassignment and post-removal quoting remain unapproved. Existing PUT documents ignoring cost for paid orders while still requiring a positive value; that alone is insufficient to enable replacement. Reassignment is not implemented here.
- Driver account deactivation may be rejected for active work. Account activation does not prove readiness, and deactivation does not automatically remove the driver from orders in this client.
- Numeric Paid mapping needs authoritative clarification; do not replace the conservative unknown warning with the legacy inferred mapping.
- Shared GET authentication behavior remains unchanged: an expired session may redirect to login. In-memory drafts do not survive that hard navigation; messages advise preserving the draft.
- Session-storage denial/corruption intentionally blocks unsafe operations. Recovery of an unidentifiable record needs an operational/support review, not blind clearing and retrying.
- No browser-rendered screenshots or responsive/a11y pass are claimed for 320/360/390/768/1024/1280/1440+ widths.

## Offline checks

- `node scripts/check-tow-truck-initial-assignment.cjs`: existing assignment, quotation and messaging regression suite.
- `node scripts/check-tow-truck-driver-operations.cjs`: actual workflow and shared API modules with stubbed transport; removal (including paid/unknown), account state/role/ID validation, note bounds, permission separation/revocation, concurrent operations, duplicate clicks, response envelopes, conflict refresh, timeout/5xx/reload recovery, exact request paths/bodies and shared Users compatibility.
- Typecheck, production build, focused lint, formatting, full lint comparison, diff integrity, secret/scope and temporary-index patch portability checks are recorded in the delivery report.
- `adminApi.ts` contains pre-existing formatting differences. Only edited function/import sections are formatted and checked; unrelated legacy formatting is preserved.
