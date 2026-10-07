# PROJECT_STATE.md — Maqwad (مقود) Frontend

> Operational snapshot; repository history and verified runtime behavior take precedence.
> Engineering rules: `/AGENTS.md`. Backend evidence: `BACKEND_VERIFIED_FACTS.md`.

## Current work — Chat voice recording / attachment picker, 2026-10-07

- Existing checkout and branch `feat/conversations-multimedia`; starting HEAD
  `0c3b813971a9c05f3f15d94f8e427cbc6c02d022` contains the completed responsive refinement.
  The original feature is its parent `1f672734e2795f5979b2ab82c4dff912675eab25`.
- Current enhancement is uncommitted. No branch/worktree/clone creation, reset,
  stash application, push, PR or merge. Historical stash remains untouched.
- Paperclip now opens the existing accessible Radix menu for PNG images and WAV
  audio files. Both have prior **VERIFIED BY LIVE REQUEST** evidence in backend
  facts §16. JPEG, Video and generic File remain **UNKNOWN** and are not offered.
  No fresh authenticated upload probes were performed for this enhancement.
- Explicit microphone action uses `getUserMedia({ audio: true })`, AudioWorklet
  mono PCM capture and RIFF/WAVE PCM16 encoding into `audio/wav`. No MediaRecorder
  container assumptions, transcoding dependency or new MIME allowlist. Sample
  rate is the actual AudioContext rate; prior live PCM WAV was 8 kHz mono/16-bit.
  New browser-captured WAV output is source/offline verified, **not live tested**.
- Stop releases microphone tracks immediately, then creates a draft preview;
  upload and standalone message POST happen only on explicit Send. Native audio
  controls, duration, discard and localized Voice message labels are provided.
- Text is preserved for the next message while audio is sent with `message:null`
  and existing `attachmentIds`. New-conversation draft-key migration also
  preserves carried text if another destination send is already in flight.
- Capture cancels on composer unmount. Hidden tab/view, window focus loss, device interruption or
  suspended audio context stop capture and retain already received PCM as a
  preview when possible. Late permission results are stopped after cancellation.
  Timers, audio nodes, contexts and tracks are released; the existing draft owner
  revokes preview URLs on removal, successful send or account-session unmount.
- Completed previews survive conversation switches within the mounted chat
  session; active recording is cancelled on conversation replacement. Reload or
  leaving the chat session does not persist drafts. No duration limit is invented;
  PCM uses memory proportional to duration. Pause/resume is intentionally omitted.
- A failed history refresh with cached messages keeps the composer mounted and
  shows a retry banner, so a transient read failure cannot discard active capture.
- REST API, media policy, SignalR reconciliation and read/unread hooks are unchanged.
  Prior image mosaic, responsive grids, ownership menus and long press remain.
- Validation: typecheck, affected-file ESLint, focused formatting and production
  build pass (existing large-chunk warning). Offline source tests cover encoding,
  capture lifecycle/errors, draft recovery/text retention, reconciliation and
  active-only read behavior. Worklet is emitted as a standalone production asset.
- Browser/MIME capability probing: **BLOCKED BY ENVIRONMENT**, Chromium missing;
  no install/download retried. Real microphone, permission UI, playback, mobile
  320/360/390px, desktop, Arabic/English and keyboard/focus QA remain pending.
  No generated recordings, secrets or scratchpad artifacts are proposed for commit.

## Historical work — Conversations / multimedia, reviewed 2026-10-06

- Existing checkout only; branch `feat/conversations-multimedia` from verified
  `origin/main` / HEAD `c071bb68a49db10781971258627552aa66bb0dfe`.
- The unrelated prior PROJECT_STATE edit remains in the named
  `preexisting-project-state-do-not-touch` stash. It was not popped or copied.
  This update starts from committed main documentation.
- Scrap and Workshop retain their existing routes and share the upgraded Chat
  module: paginated conversations, rich messages, image/WAV attachments,
  upload/draft recovery, own text editing, confirmed deletion and unread handling.
- TanStack Query is the sole message/server cache; Redux retains connection
  state. REST and SignalR reconcile by server message IDs, with no polling.
- Live verification used authorized test accounts in both directions. Multipart
  field `File`, numeric `attachmentIds`, PNG/WAV, image-only, images+text,
  audio-only, own edit/delete and read/unread were verified. Audio+text is rejected.
  The exact evidence and unknowns are in BACKEND_VERIFIED_FACTS §16.
- No recording, unverified upload formats, fabricated avatars/presence, invented
  media limits or edit/delete SignalR event names were added.
- Important backend constraints: detail GET marks messages read; media URLs were
  publicly fetchable; no conversation-delete endpoint exists; orphan retention
  is unknown. UI draft removal does not claim to delete uploaded server media.
- Test-created messages/media were cleaned; empty conversation `10019` remains.
  No historical messages/media were edited/deleted.
- Validation: typecheck/build and focused source ESLint/Prettier pass; full lint
  matches baseline (106 errors, 24 warnings); full format has existing failures
  including UTF-16 swagger.json. No automated test script exists.
- Live API/SignalR and source adapter checks passed. Browser interaction/visual
  QA remains blocked: Chromium download failed and Cloud Browser denied the
  local dev URL. Arabic/English, 320/360/390px, desktop, playback, error/retry,
  keyboard, reconnect and logout-in-flight must still be verified before commit.
- No dependencies, commits, pushes, PRs or merges. Implementation is uncommitted
  and awaits review; no release-ready visual claim is made.
- Recovery review confirmed that all content outside this Conversations section
  equals origin/main (apart from the historical-section heading). Read-only
  comparison of the stash found no historical content mixed into this change.
  Preserved stash SHA: `953838a68295564d0cf061dd931a5e13dc063fea`.
- JPEG live evidence could not be recovered. The previous claim was corrected;
  JPEG is UNKNOWN and removed from the upload allowlist. No backend probes were
  repeated. Historical server media still renders by MIME when the browser supports it.
- Review fixes: conversation-ID selection/draft keys, delayed creation-event
  protection for edited/deleted messages, cancellation of hidden/switched detail
  requests, post-await unmount guards, and removal of unused Redux selection.
- Current-source checks rerun: typecheck PASS; focused ESLint PASS; full ESLint
  BASELINE FAILURE (106 errors / 24 warnings, zero new diagnostics); all 19 changed
  and new files pass focused formatting; production build PASS with chunk warning.
  Secret scan found no credentials or persisted test response dumps in the feature.
- Offline recovered-source checks PASS for attachment reconciliation in both
  orders, stale creation events, draft retry/uncertainty/unmount, preview cleanup,
  and active-only QueryObserver invalidation. These use in-memory transport and a
  hook lifecycle harness, not browser rendering or live backend requests.
- One browser launch check: BLOCKED BY ENVIRONMENT (Chromium executable missing).
  No install/download retried. Existing cleanup statements above are retained
  historical evidence, not a new verification of backend state.
- Read limitations: cancellation cannot undo a request already processed by the
  server; a conversation-wide read may include arrivals during the request. Drafts
  survive conversation changes only within this mounted account session, not reloads.
  Remote edit/delete notifications remain unverified; refresh/focus/reconnect is
  required to reconcile changes made elsewhere.

## Historical work — Admin Dealer Balances, 2026-09-29

- Source of truth: `origin/main`; Develop is no longer the integration baseline
  for this work. Exact base: `e5014281cbb31526de5f0b3ec30ef0d0593d5f59` (PR #78).
- Admin Production Feature Availability is now merged, including production-only
  Coming Soon. Existing classifications, guards and mock restrictions remain intact.
- Branch: `feat/admin-transactions-live-contract`; isolated worktree rebuilt from
  current main. Other dirty worktrees remain untouched.
- New LIVE `/admin/transactions`: Dealer Balances / أرصدة التجار, with paginated
  reads, detail, create, final-balance/status editing and confirmed deletion.
  Admin-level RBAC is preserved; no Transactions permission currently exists.
- Users.id for roleId=2 is sent as dealerId. Final balance is SAR, never a delta.
  Explicit paginated Dealer selection; no unsupported global filters/search.
- V1 one-record-per-dealer UX uses uncached preflight; backend uniqueness remains
  unconfirmed. Mutation responses/authorization have not been live write-tested.
- Delivery: self-contained patch against the exact base above. No commit, push,
  merge, live writes, browser automation or claimed visual QA.
- Validation: typecheck/build pass; new module and non-router touched sources
  pass focused ESLint; all touched source passes Prettier. Router retains its
  43 baseline Fast Refresh errors. Full lint matches clean main (106 errors,
  24 warnings); full format retains baseline failures, including UTF-16 Swagger.
  Seven offline contract/domain check groups pass; no automated test script exists.
- Manual Arabic/English, responsive, error and CRUD QA remains a release gate.
  Existing fixed-width Admin sidebar behavior is outside this module's scope.

## Verified baseline — 2026-09-23

- Repository: `asilix-solutions/Miqwad-Frontend`.
- `origin/Develop`: `4d7986d867bb3ed0fa69b36f821f3b2c0cb9097a` (PR #74).
- `origin/main`: `178763bea610bc9fd4b4cead6e06c29c53eda578` (PR #73).
- Develop contains main; their file trees are identical at this baseline.
- **Reconciliation blocker resolved.** Production user deactivate/reactivate,
  rich live Invoices (`1f7c342`), and all governance files are present in Develop.
- Test/Stage and historical branches were not changed or re-audited for this task.
- `p6-dropdown-theme` remains intentionally preserved for separate manual UI review.

## Historical Coupons work (now incorporated in main)

- Branch: `feat/admin-coupons-live-contract`, based exactly on the Develop SHA above.
- Admin Coupons implemented as an uncommitted patch: list/detail, verified query
  controls, create/edit, independent activation toggle, and confirmed deletion.
- Read contracts use the completed GET audit. Mutation requests follow current
  Swagger and have **not** been live write-tested.
- The original worktree's existing PROJECT_STATE modification is separate and
  was not copied, overwritten, or included in this worktree.
- Delivery is patch-only. No commit, push, PR or merge is authorized for this task.

## Validation and release gates

- Baseline typecheck/build pass; lint and formatting have existing repository-wide
  failures, including UTF-16 `swagger.json` parsing. No automated test script exists.
- Coupons typecheck/build pass. Full lint retains the same 107 errors and 24
  warnings as baseline; formatting retains existing failures, with no new warned
  files. Coupon source passes focused lint/Prettier. Eight offline contract/domain
  check groups pass; no live writes or browser automation were performed.
- Static checks do not establish visual or live mutation correctness.
- Next engineering task: apply the patch to the exact base, perform user visual QA
  in Arabic/English (list/cards, filters, dialogs, keyboard and narrow widths),
  then separately authorize controlled live mutation verification before release.
- Existing Admin shell uses a fixed 260px sidebar at all widths. Coupons uses
  container-responsive cards and bounded dialogs, but the shared shell's mobile
  layout remains a separate limitation; no unrelated shell redesign is included.
- Coupons: actual multi-record sorting, exact date boundaries, null-limit business
  semantics, write responses and backend mutation authorization remain unverified.

## Other unresolved backend dependencies

- Subscription Plan `billingCycle` numeric meanings.
- Authenticated, per-user, persisted order notifications.
- Provider-Subscriptions Stage 3 contract; no implementation in this task.
