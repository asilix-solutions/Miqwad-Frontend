# Super Admin Dashboard — Teardown + Reuse + Scaffold Plan
**Branch:** `super-admin-dashboard` (create from `main` / `shadcn-integration`)
**Date:** 2026-06-10
**Scope:** Diagnostic + Planning only. No files were changed.

---

## 1. TEARDOWN / REUSE DECISION

### Admin-Module Files

| File | Decision | Reason |
|------|----------|--------|
| [`api/adminApi.ts`](file:///d:/maqwad-frontend-project/src/modules/admin/api/adminApi.ts) | **REFACTOR** | Solid axios transport pattern. Keep the file; expand it with all new admin endpoints (users, categories, roles, finance, etc.) as the dashboard grows. The 3 provider endpoints stay intact. |
| [`hooks/useAdminQueries.ts`](file:///d:/maqwad-frontend-project/src/modules/admin/hooks/useAdminQueries.ts) | **REFACTOR** | `adminKeys` factory + TanStack Query hooks are the right pattern. Keep all 3 existing hooks; this file becomes the parent for provider-verification hooks. New domain hooks (users, finance…) go in separate sibling files. |
| [`pages/AdminProvidersPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/admin/pages/AdminProvidersPage.tsx) | **REFACTOR** | The tab-based list + card-grid pattern is good. Remove `setAdminStatus` dispatch from `providersSlice` (wrong home); replace with URL search params or a new `adminSlice`. The rest stays. |
| [`pages/AdminProviderDetailsPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/admin/pages/AdminProviderDetailsPage.tsx) | **REFACTOR** | Excellent deep-review layout (12-col grid, profile/docs/actions columns). Keep the structure; add `<Can permission="providers.approve">` guards and breadcrumb header. |
| [`components/AdminProviderCard.tsx`](file:///d:/maqwad-frontend-project/src/modules/admin/components/AdminProviderCard.tsx) | **REUSE** | Self-contained, no extraneous state. Wrap approve/reject buttons in `<Can>` guards — the component itself doesn't need changing. |
| [`components/RejectProviderDialog.tsx`](file:///d:/maqwad-frontend-project/src/modules/admin/components/RejectProviderDialog.tsx) | **REUSE** | Perfectly composable pattern (Dialog + RHF + Zod). Will be replicated for other "action with reason" dialogs (suspend user, etc.). No change needed. |
| [`schemas/admin.schemas.ts`](file:///d:/maqwad-frontend-project/src/modules/admin/schemas/admin.schemas.ts) | **REUSE** | The `rejectProviderSchema` stays. New action schemas (suspend reason, settlement note…) are added to the same file. |
| [`types.ts`](file:///d:/maqwad-frontend-project/src/modules/admin/types.ts) | **REFACTOR** | `AdminProviderStatus` and `RejectProviderRequest` stay. Add all new domain types here (or in sub-files per domain area). Remove the dependency on `ProviderProfile` re-export once full types are defined. |

### Cross-Cutting Items

| Item | Decision | Detail |
|------|----------|--------|
| **Admin routes in `router.tsx`** | **EXTEND** | Keep existing `/admin/providers` + `/admin/providers/:id`. Replace `RoleGuard allow={["admin"]}` with the new `PermissionGuard` (or extend `RoleGuard` to also accept `"super_admin"`). Add all new route segments incrementally (`/admin/users`, `/admin/categories`, etc.). |
| **Admin nav in `AppLayout.tsx`** | **REPLACE** | The `case "admin"` branch of `navItemsForRole()` currently has only 2 entries and the wrong icon set. Replace with a rich 8-12 item nav when the new `AdminLayout` shell is introduced. Long-term: `AppLayout` should not render the admin nav at all — the admin shell will be its own layout. |
| **`admin.*` i18n keys in `i18n.ts`** | **EXTEND** | The 18 existing keys are valid and stay. A new `superAdmin.*` sub-namespace will be added (dashboard stats, users management, roles, categories admin, finance, escrow, audit log strings). |

### Blast Radius — If Any Admin File Were Deleted

> These are the ONLY files that import each admin artifact outside the admin module itself.

| File to Delete | Importers Outside `admin/` |
|----------------|---------------------------|
| `api/adminApi.ts` | `hooks/useAdminQueries.ts` (only within admin module) — safe |
| `hooks/useAdminQueries.ts` | `pages/AdminProvidersPage.tsx`, `pages/AdminProviderDetailsPage.tsx` — both inside admin module only — safe |
| `pages/AdminProvidersPage.tsx` | `src/app/router.tsx` (lazy import L147-150, route L370) — **1 outside file** |
| `pages/AdminProviderDetailsPage.tsx` | `src/app/router.tsx` (lazy import L152-155, route L373) — **1 outside file** |
| `components/AdminProviderCard.tsx` | `pages/AdminProvidersPage.tsx` only — within module |
| `components/RejectProviderDialog.tsx` | `pages/AdminProvidersPage.tsx`, `pages/AdminProviderDetailsPage.tsx` — within module |
| `schemas/admin.schemas.ts` | `components/RejectProviderDialog.tsx` — within module |
| `types.ts` | `api/adminApi.ts`, `hooks/useAdminQueries.ts`, both pages, both components — ALL within module |
| `setAdminStatus` (in `providersSlice`) | **`pages/AdminProvidersPage.tsx`** imports from `@modules/providers/store/providersSlice` — cross-module coupling; must be migrated to `adminSlice` before touching providers slice |

**Conclusion:** Blast radius is almost entirely self-contained. The only external dependency is `router.tsx` (lazy-loading the 2 pages) and the cross-module `setAdminStatus` import in `AdminProvidersPage`. No other feature areas are affected.

---

## 2. PERMISSION SYSTEM DESIGN

### 2a. TypeScript Shape

```ts
// src/modules/auth/types.ts — additions

export type UserRole = "customer" | "provider" | "driver" | "admin" | "super_admin";
//                                                                      ^ ADD

export interface User {
  // ...existing fields...
  permissions: string[];   // ADD — empty array for non-admin roles
}
```

The `permissions` field is an **explicit string array** attached directly to the `User` object, populated by the backend at login time (e.g., returned as part of `GET /admin/me/permissions` or included in the JWT payload). This means:
- Zero extra API calls at startup for permission data
- Survives Redux hydration as plain JSON
- Easy to mock: just populate the array in the mock layer

### 2b. Permission Code Naming Convention

Format: **`<module>.<action>`** — lowercase, dot-separated.

**Rule of thumb:**
- `<module>` = the functional domain noun (plural for collections, singular for actions on a single entity)
- `<action>` = one of: `view`, `create`, `edit`, `delete`, `approve`, `reject`, `suspend`, `restore`, `settle`, `export`

### 2c. Full Permission Code List (12 Brief Modules)

| Module | Codes |
|--------|-------|
| **Providers Verification** | `providers.view` · `providers.approve` · `providers.reject` · `providers.suspend` · `providers.restore` |
| **Users Management** | `users.view` · `users.create` · `users.edit` · `users.suspend` · `users.restore` · `users.delete` |
| **Roles & Permissions** | `roles.view` · `roles.create` · `roles.edit` · `roles.delete` · `roles.assign` |
| **Service Categories** | `categories.view` · `categories.create` · `categories.edit` · `categories.delete` |
| **Finance / Settlements** | `finance.view` · `finance.settle` · `finance.export` |
| **Escrow / Disputes** | `escrow.view` · `escrow.resolve` · `escrow.refund` |
| **Bookings / Orders** | `bookings.view` · `bookings.cancel` · `bookings.export` |
| **Reviews / Ratings** | `reviews.view` · `reviews.delete` · `reviews.flag` |
| **Analytics / Reports** | `analytics.view` · `analytics.export` |
| **Notifications / Comms** | `notifications.view` · `notifications.send` · `notifications.delete` |
| **System Settings** | `settings.view` · `settings.edit` |
| **Audit Log** | `audit.view` · `audit.export` |

**Super Admin** receives **all permissions** (or a sentinel `"*"` permission) from the backend.

### 2d. Auth Changes Needed

1. **`UserRole`** — add `"super_admin"` union member in `auth/types.ts`.
2. **`User.permissions`** — add `permissions: string[]` field (empty `[]` default for non-admin users).
3. **`authSlice`** — no structural change; `permissions` comes in on the `user` object, stored as-is.
4. **`RoleGuard`** — add `"super_admin"` to `defaultHomeFor()` → `/admin/dashboard`. Keep as-is for role-based route protection.
5. **NEW: `PermissionGuard`** (in `src/shared/guards/PermissionGuard.tsx`) — a route guard that checks `user.permissions.includes(requiredPermission)`. Used to protect individual admin routes.
6. **NEW: `usePermissions()` hook** (in `src/shared/hooks/usePermissions.ts`) — `const { can, permissions } = usePermissions()`. Returns `can(perm: string) => boolean`.
7. **NEW: `<Can>` component** (in `src/shared/components/Can.tsx`) — renders children only if user has the named permission. Wraps `usePermissions` internally.

```tsx
// Usage pattern:
<Can permission="providers.approve">
  <Button onClick={handleApprove}>Approve</Button>
</Can>
```

### 2e. Mock Permissions Provider

Create `src/shared/mocks/handlers/admin.handlers.ts` with a handler for `GET /admin/me/permissions`:
```ts
// Returns a hardcoded permission set for the super_admin mock user.
// Swap: when VITE_USE_MOCKS=false, the real endpoint takes over.
// The auth.handlers mock already seeds phone "500000000" as role="admin".
// Extend the seed to role="super_admin" + permissions=[all].
```

**The mock permissions are injected at login time** (in the `verify-otp` mock response — add `permissions: allPermissions` to the mock user object). Zero extra calls needed.

### 2f. Where the Permission System Lives

**Recommendation: `src/shared/auth/`** — a new sub-folder of `shared/`.

```
src/shared/auth/
  permissions.ts          ← Permission code constants (as const object or union type)
  usePermissions.ts       ← usePermissions() hook
  Can.tsx                 ← <Can permission="..."> component
  PermissionGuard.tsx     ← Route-level guard
```

**Rationale:** `shared/auth/` is the right home because:
- The permission system is **not** admin-specific — Provider dashboards (Phase 2) will reuse `<Can>` for their own scoped permissions
- `shared/guards/` already has `RoleGuard`/`ProtectedRoute` — permission logic belongs alongside it
- Keeps `src/modules/admin/` free to focus on UI features, not auth plumbing
- Avoids circular imports (admin module → shared, never shared → admin module)

---

## 3. MOCK STRATEGY

### Recommendation: **Extend the existing custom axios adapter** (same as current)

**Do NOT introduce MSW** or a separate mock adapter library.

**Why:**
- The project already has a working, battle-tested `createMockAdapter` in `src/shared/mocks/server.ts`. It uses a composable handler chain (`tryAuthMock`, `tryVehiclesMock`, etc.).
- Adding `tryAdminMock` to the chain is a **single line change** in `server.ts`.
- MSW would add a Service Worker layer, a dependency install, and `public/mockServiceWorker.js` — unnecessary overhead for an in-process mock that works.
- The existing pattern simulates real network latency (350ms `sleep`), handles localStorage persistence, and has a clear fallthrough to the real adapter.

**Swap path to real .NET endpoints:**
1. Set `VITE_USE_MOCKS=false` in `.env`.
2. The `installMocks()` function in `server.ts` short-circuits — the axios adapter is not replaced.
3. All `adminApi.ts` calls go to the real `.NET` backend via the unchanged axios instance.
4. Delete `src/shared/mocks/handlers/admin.handlers.ts` at that point.

**No component code changes required.** Components call hooks → hooks call `adminApi` → `adminApi` calls axios → adapter decides mock or real.

### .NET Integration Considerations

Address at the **`adminApi.ts` / response-adapter layer**, not in components:

| Concern | Mitigation |
|---------|-----------|
| **JSON casing** | .NET defaults to `PascalCase`. Add a per-response `camelCase` transformer in `adminApi.ts` (or in the axios interceptor via `humps`/`camelcase-keys`) |
| **Date formats** | .NET returns ISO 8601 strings. Use `new Date(str)` or `date-fns` at the hook/adapter layer; pass typed `Date` objects to components |
| **Pagination shape** | .NET typically returns `{ items: [], totalCount, page, pageSize }`. Normalize to a shared `PaginatedResponse<T>` interface in `src/shared/types/api.ts` |
| **Error shape** | Already normalized via `AppError` in the axios interceptor — no component change needed |

---

## 4. SHADCN COMPONENTS TO ADD

### P0 — Required for Shell + Users/Roles + Verification + Finance + Escrow

| Component | Use Case |
|-----------|----------|
| `sheet` | Detail drawers (provider side-panel, user detail slide-over) |
| `breadcrumb` | Page hierarchy navigation (Admin → Users → User #123) |
| `avatar` | User/provider avatar in tables and profile cards |
| `tooltip` | Icon-button hints (approve, reject, suspend icons) |
| `separator` | Section dividers in detail pages |
| `alert` | Inline status callouts (suspended user warning, pending settlement alert) |
| `pagination` | Table pagination for users list, providers list |
| `switch` | Feature flag toggles, user suspension toggle |

### P1 — Needed for Finance, Analytics, Settings

| Component | Use Case |
|-----------|----------|
| `popover` | Date range picker trigger |
| `calendar` | Date range filter for finance reports |
| `chart` | Dashboard KPI charts (revenue, bookings, growth) |
| `progress` | KYC completion meter, settlement progress |
| `scroll-area` | Long document list in provider details |

### P2 — Deferrable (Advanced Features)

| Component | Use Case |
|-----------|----------|
| `command` | Global search / command palette |
| `accordion` | Collapsible audit log entries |
| `sidebar` | If upgrading to the shadcn Sidebar v2 primitive |

---

## 5. PROPOSED MODULE STRUCTURE

The admin module stays at `src/modules/admin/` — **do not move to a new location**. It is split into domain sub-areas following the existing modular convention.

```
src/
├── shared/
│   ├── auth/                         ← NEW: permission system
│   │   ├── permissions.ts            ← Permission code constants
│   │   ├── usePermissions.ts         ← usePermissions() hook
│   │   ├── Can.tsx                   ← <Can permission="..."> component
│   │   └── PermissionGuard.tsx       ← Route-level permission guard
│   ├── guards/                       ← EXISTING (RoleGuard, ProtectedRoute, GuestRoute)
│   ├── hooks/                        ← EXISTING (empty → add usePermissions alias if needed)
│   ├── mocks/
│   │   ├── handlers/
│   │   │   ├── auth.handlers.ts      ← REFACTOR: add super_admin + permissions to seed
│   │   │   ├── admin.handlers.ts     ← NEW: admin mock handler
│   │   │   ├── providers.handlers.ts ← EXISTING
│   │   │   ├── vehicles.handlers.ts  ← EXISTING
│   │   │   └── discovery.handlers.ts ← EXISTING
│   │   └── server.ts                 ← REFACTOR: add tryAdminMock to chain
│   └── types/
│       └── api.ts                    ← ADD PaginatedResponse<T> interface
│
└── modules/
    └── admin/
        ├── api/
        │   └── adminApi.ts           ← REFACTOR: expand with new endpoints
        │
        ├── components/
        │   ├── verification/         ← NEW sub-folder
        │   │   ├── AdminProviderCard.tsx    ← REUSE (moved here)
        │   │   └── RejectProviderDialog.tsx ← REUSE (moved here)
        │   ├── users/                ← NEW
        │   ├── shared/               ← NEW: DataTable, StatCard, etc.
        │   └── layout/               ← NEW: AdminLayout, AdminSidebar, AdminBreadcrumb
        │
        ├── hooks/
        │   ├── useAdminQueries.ts    ← REFACTOR: rename → useVerificationQueries.ts (or keep)
        │   ├── useUsersQueries.ts    ← NEW
        │   ├── useRolesQueries.ts    ← NEW
        │   ├── useFinanceQueries.ts  ← NEW
        │   └── useEscrowQueries.ts   ← NEW
        │
        ├── pages/
        │   ├── AdminDashboardPage.tsx       ← NEW (P0 shell)
        │   ├── AdminProvidersPage.tsx       ← REFACTOR
        │   ├── AdminProviderDetailsPage.tsx ← REFACTOR
        │   ├── AdminUsersPage.tsx           ← NEW
        │   ├── AdminUserDetailsPage.tsx     ← NEW
        │   ├── AdminRolesPage.tsx           ← NEW
        │   ├── AdminFinancePage.tsx         ← NEW
        │   └── AdminEscrowPage.tsx          ← NEW
        │
        ├── schemas/
        │   └── admin.schemas.ts      ← REUSE + EXTEND
        │
        ├── store/
        │   └── adminSlice.ts         ← NEW: move adminStatus here + add pagination state
        │
        └── types.ts                  ← REFACTOR: expand with all new domain types
```

> **Note on `AdminLayout`:** A new `AdminLayout.tsx` will replace the `AppLayout` for the `/admin/*` routes. It gets its own shell: wider sidebar, breadcrumb bar, global search, KPI header zone. The router's admin block will switch from `element: <AppLayout />` to `element: <AdminLayout />`.

---

## 6. P0 BUILD SEQUENCE

Each step = one focused prompt. `tsc --noEmit` + visual check + `git commit` between each.

| # | Step | Goal |
|---|------|------|
| **1** | **Branch + Permission Types** | Create `super-admin-dashboard` branch. Add `"super_admin"` to `UserRole`, add `permissions: string[]` to `User`, add `permissions.ts` constants file. `tsc` must pass. |
| **2** | **Permission Hooks + `<Can>` Component** | Create `src/shared/auth/usePermissions.ts`, `src/shared/auth/Can.tsx`, `src/shared/auth/PermissionGuard.tsx`. Write unit-level smoke test. |
| **3** | **Mock: Admin Handler + Super Admin Seed** | Create `admin.handlers.ts` mock (GET /admin/me/permissions, GET /admin/users stub, GET /admin/dashboard/stats stub). Extend `auth.handlers.ts` phone `500000000` to return `role: "super_admin"` + all permissions. Wire into `server.ts`. |
| **4** | **Admin Store Slice** | Create `src/modules/admin/store/adminSlice.ts` — move `adminStatus` out of `providersSlice`, add `usersPagination`, `usersSearch`. Update `AdminProvidersPage.tsx` to use new slice. Remove `setAdminStatus` from `providersSlice` (clean migration). |
| **5** | **Admin Layout Shell** | Create `AdminLayout.tsx` + `AdminSidebar.tsx` + `AdminBreadcrumb.tsx`. Install shadcn: `breadcrumb`, `separator`, `avatar`, `tooltip`. Switch `router.tsx` admin block from `AppLayout` to `AdminLayout`. Update `RoleGuard.defaultHomeFor("super_admin")` → `/admin/dashboard`. |
| **6** | **Dashboard Home Page (KPI Shell)** | Create `AdminDashboardPage.tsx` at `/admin/dashboard`. Install shadcn `alert`, `switch`. Display mock stat cards (total users, pending providers, open disputes, revenue). Protect with `PermissionGuard` (no specific perm — any admin role). |
| **7** | **i18n Expansion** | Add `superAdmin.*` keys to `i18n.ts` (ar + en) for all new pages: dashboard, users, roles, categories, finance, escrow. No UI change — prep for all future pages. |
| **8** | **Provider Verification Refactor** | Move `AdminProviderCard` + `RejectProviderDialog` to `components/verification/`. Wrap approve/reject buttons in `<Can permission="providers.approve">` / `<Can permission="providers.reject">`. Add breadcrumb to both pages. Install shadcn `sheet` (for detail slide-over pattern). |
| **9** | **Users List Page** | Create `AdminUsersPage.tsx` + `useUsersQueries.ts` + users mock handler. Render paginated `<Table>` with shadcn `pagination` + `avatar`. Install shadcn `pagination`. Guard with `<PermissionGuard permission="users.view">`. |
| **10** | **User Detail + Actions** | Create `AdminUserDetailsPage.tsx`. Show user info, role badge, suspend/restore actions behind `<Can permission="users.suspend">`. Add SuspendUserDialog (same pattern as RejectProviderDialog). |
| **11** | **Finance Page (Stub)** | Create `AdminFinancePage.tsx` + `useFinanceQueries.ts`. Render settlements table with status badges. Guard with `<PermissionGuard permission="finance.view">`. Install shadcn `scroll-area`. |
| **12** | **Escrow / Disputes Page (Stub)** | Create `AdminEscrowPage.tsx` + `useEscrowQueries.ts`. Table of open disputes with resolve/refund actions behind `<Can>`. Marks end of P0. |

---

## CONSOLIDATED SUMMARY

### ✅ Safe Deletes (none for now)
No files need to be deleted. All existing admin files are REFACTOR or REUSE. The only structural clean-up is:
- **Remove `adminStatus` from `providersSlice`** (Step 4) — after migrating to `adminSlice`.
- The `defaultHomeFor("admin")` hardcode in `RoleGuard` gets updated to also handle `"super_admin"`.

### 📍 Permission System Location
**`src/shared/auth/`** — new sub-folder of shared. Houses `permissions.ts`, `usePermissions.ts`, `Can.tsx`, `PermissionGuard.tsx`.

### 🔧 Recommended Mock Tool
**Existing custom axios adapter** (`src/shared/mocks/`) — add `admin.handlers.ts` + wire into `server.ts`. No new libraries needed.

### 📋 Ordered P0 Steps
1. Branch + Permission Types
2. Permission Hooks + `<Can>`
3. Admin Mock Handler + Super Admin Seed
4. Admin Store Slice (migrate `adminStatus`)
5. Admin Layout Shell
6. Dashboard Home Page (KPI shell)
7. i18n Expansion
8. Provider Verification Refactor (add `<Can>` guards)
9. Users List Page
10. User Detail + Actions
11. Finance Page (stub)
12. Escrow / Disputes Page (stub)

---

> **Awaiting your confirmation to proceed. No files were changed.**
