# PROJECT_STATE.md — Maqwad (مقود) Frontend

> **Purpose:** Short-lived operational state for resuming work safely.
>
> This file records the **current repository baseline, drift, blockers, active decisions, and next approved task**.
> It is intentionally concise and must be updated whenever branch state, blockers, or the active development task changes.
>
> Permanent engineering rules belong in `/AGENTS.md`.
> Stable backend quirks verified through live behavior belong in `docs/ai/BACKEND_VERIFIED_FACTS.md`.
> Historical `HANDOVER_*.md` files are reference material only.

---

## 1. Last Verified Baseline

**Last verified:** 2026-09-12  
**Repository:** `asilix-solutions/Miqwad-Frontend`

### Environment branches

| Branch | Verified SHA | Relationship at last audit |
|---|---:|---|
| `main` | `bf49bcf` | Production baseline; latest merge was PR #70 |
| `Develop` | `3ab270b` | 25 commits behind `main`; no unique commits |
| `Test` | `6f2755d` | 84 commits behind `Develop` |
| `Stage` | `2cd5af8` | 113 commits behind `Develop` |

### Pull requests and branches

- No open PRs at the last audit.
- 47 branches were reviewed.
- Of 43 non-environment branches:
  - 40 were fully contained in `main`.
  - `feat/admin-mock-bridge` and `fix/dev-cors-base-url` retained historical unique commits, but their merged functionality is represented in current code.
  - `p6-dropdown-theme` retained **3 unmerged historical UI commits** and was approximately 189 commits behind `main`.
- `preview/admin-invoices-mock` was not present remotely at the last audit.

---

## 2. Current Baseline Decision

### Source of truth

Until branch reconciliation is completed:

- **`main` is the verified production baseline.**
- **`Develop` must not be assumed to contain all production behavior.**

The most important known drift is that production user deactivate/reactivate behavior exists in `main` but was absent from the audited `Develop` baseline.

Do **not** rebuild or duplicate production functionality that already exists in `main`.

---

## 3. Current Drift

The last audit identified these important discrepancies:

1. Historical handover claims that taxonomy pagination was unmerged are obsolete.
   - Commit `c9a66b4` reached `main` through PR #67.
   - It reached `Develop` through PR #69.
   - Promotion completed through PR #70.

2. `main → Develop` synchronization is no longer only historical/CI drift.
   - Production functionality from PR #68 exists only in `main` at the audited baseline.

3. Earlier claims that `main`, `Develop`, and `Test` were synchronized are stale.

4. `CLAUDE.md` and parts of `README.md` contain stale mock/backend-pending descriptions.

5. No root `AGENTS.md` existed at audit time.
   - **This is now intentionally being added.**

6. Provider-Subscriptions Stage 3 remains a placeholder.

---

## 4. Current Blockers

### P0 — Baseline inconsistency

`Develop` is behind `main`.

**Impact:** starting new feature development from `Develop` risks omitting production behavior and creating duplicate or conflicting work.

**Required action:** reconcile the production `main` baseline back into `Develop` through a reviewed synchronization workflow.

---

### P1 — Validation not yet established for the audited state

The audit inspected repository metadata and `package.json`, but did not execute a local checkout/build.

Actual repository scripts identified at audit time:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

No `test` script existed at the last audit.

After any reconciliation or significant change, run the actual repository validation commands before considering the baseline healthy.

---

### P1 — Historical UI branch requires explicit disposition

`p6-dropdown-theme` contains 3 unmerged historical UI commits.

Do not delete or cherry-pick it automatically.

Required decision:

- intentionally accept relevant changes,
- intentionally retire the branch,
- or preserve it as historical reference.

---

### P1 — Backend dependencies still require verification

The following items remain unresolved or backend-dependent:

- exact semantic mapping of Subscription Plan `billingCycle` numeric values;
- real authenticated, per-user, persisted order notifications;
- real Provider-Subscriptions Stage 3 contract before implementation.

Do not build product behavior from assumptions.

---

## 5. Recommended Next Task

### Current next task

**Reconcile `main` back into `Develop` while preserving all current production behavior.**

The preferred workflow is:

1. Re-fetch and re-verify the audited baseline.
2. If materially changed, stop and re-audit.
3. Create a dedicated reconciliation branch.
4. Incorporate the current `main` baseline for eventual `Develop` synchronization.
5. Resolve conflicts conservatively.
6. Run:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run format:check`
   - `npm run build`
7. Review the final diff.
8. Prepare a PR.
9. **Do not merge without human approval.**

Suggested branch:

```text
chore/reconcile-main-into-develop
```

---

## 6. Known Reconciliation Scope

At the last audit, the `Develop` vs `main` difference involved these areas:

```text
src/modules/admin/api/adminApi.ts
src/modules/admin/hooks/useAdminQueries.ts
src/modules/admin/components/users/RestoreUserDialog.tsx
src/modules/admin/components/users/SuspendUserDialog.tsx
src/modules/admin/pages/AdminUserDetailsPage.tsx
src/shared/mocks/handlers/admin.handlers.ts
.github/workflows/discord_notifcation.yml
vercel.json
README.md
```

Documentation reconciliation should also inspect:

```text
CLAUDE.md
HANDOVER_*.md
```

Do not assume this list is still current without re-fetching.

---

## 7. Next Feature Candidate After Reconciliation

After branch reconciliation and validation, the nearest logical feature candidate is:

### Provider-Subscriptions — Stage 3

Before implementation:

- perform a READ-ONLY contract inspection;
- verify the live backend behavior;
- confirm entity shape, scoping, permissions, pagination, write capabilities, and lifecycle;
- design the UI from the real content/workflow, not from an assumed CRUD template.

Do not implement Stage 3 until its backend contract is verified.

---

## 8. Repository Governance State

Expected governance files:

```text
/AGENTS.md
/docs/ai/PROJECT_STATE.md
/docs/ai/BACKEND_VERIFIED_FACTS.md
```

Current intended roles:

- `/AGENTS.md`
  - permanent engineering/product-quality contract;
- `PROJECT_STATE.md`
  - temporary operational state and next-task baseline;
- `BACKEND_VERIFIED_FACTS.md`
  - stable live-verified backend quirks and integration facts.

Historical handovers should be treated as evidence and history, not automatically loaded as current truth.

---

## 9. Update Rule

Update this file when any of the following changes:

- `main` / `Develop` relationship,
- active branch,
- open PR state,
- a blocker is resolved or introduced,
- the next approved task changes,
- a major feature is merged,
- repository validation status changes.

Keep this file short.

Do **not** turn it into a chronological handover log.

When reconciliation is complete, replace the pre-reconciliation branch state with the newly verified baseline and remove resolved drift/blockers.
