# PROJECT_STATE.md — Maqwad (مقود) Frontend

> Operational snapshot; repository history and verified runtime behavior take precedence.
> Engineering rules: `/AGENTS.md`. Backend evidence: `BACKEND_VERIFIED_FACTS.md`.

## Current work — Admin Dealer Balances, 2026-09-29

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
