# PROJECT_STATE.md — Maqwad (مقود) Frontend

> Operational snapshot; repository history and verified runtime behavior take precedence.
> Engineering rules: `/AGENTS.md`. Backend evidence: `BACKEND_VERIFIED_FACTS.md`.

## Current work — Admin production availability, 2026-09-28

- Refinement baseline: `origin/main` / HEAD `f82a7b864e47e6a27b64bbf9fba8bdd901f95624`
  (PR #77). The existing availability work started at `347e466` and was preserved
  byte-for-byte while fast-forwarding this same branch to the requested baseline.
- Branch: `fix/admin-production-feature-availability`; isolated worktree.
  Existing dirty worktrees were not modified or copied into this change.
- Explicit capability gating keeps LIVE sections and real request errors;
  MOCK_ONLY implementations require explicitly enabled development mocks.
  Providers, Revenues, Notifications, Complaints and Settings stay visible under
  existing RBAC and show a neutral COMING_SOON page only in production when
  unavailable, without
  mounting their original pages/queries. Other unsupported widgets, actions and
  reference tabs remain hidden. Local development always opens original known
  routes, never Coming Soon; explicit mocks are needed for mock-backed behavior.
  With local mocks OFF, unsupported endpoint requests may fail normally.
  PARTIAL pages retain live portions; STATIC stays;
  UNKNOWN mappings need an audit, never a guessed endpoint substitution.
- Full route/widget classification, flag precedence, constraints and manual QA:
  [ADMIN_FEATURE_AVAILABILITY.md](ADMIN_FEATURE_AVAILABILITY.md).
- Refinement validation: typecheck/build/focused lint/focused format/diff-check
  pass; isolated rendering checks cover route presentation and existing RBAC.
  Manual Arabic/English and network-panel QA remains required.
- The original safety patch is untouched; this refinement is uncommitted.
  No new commit or push; no protected branch changed. Visual QA is left to the user.
  No fresh authenticated backend behavior is claimed by this source audit.

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
