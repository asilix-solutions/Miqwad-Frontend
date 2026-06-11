# Routing + Freeze Diagnostic Report
**Branch:** `super-admin-dashboard`  
**Status:** Read-only — no files were changed.

---

## 1. FULL ROUTE MAP

> Source: [`src/app/router.tsx`](file:///d:/maqwad-frontend-project/src/app/router.tsx)

### Root redirect
| Path | Element | Layout | Guard |
|------|---------|--------|-------|
| `/` | `<Navigate to="/app/dashboard" replace />` | none | none |
| `*` (catch-all) | `<Navigate to="/login" replace />` | none | none |

---

### (a) AUTH routes — wrapped in `<GuestRoute />`

| Path | Component | Layout | Guard |
|------|-----------|--------|-------|
| `/login` | `LoginPage` | `AuthLayout` (inside page) | `GuestRoute` |
| `/verify-otp` | `OtpPage` | `AuthLayout` (inside page) | `GuestRoute` |
| `/register` | `RegisterPage` | `AuthLayout` (inside page) | `GuestRoute` |

> `GuestRoute` redirects authenticated + profile-complete users to `/app/dashboard` unconditionally.

Also auth-adjacent (inside `ProtectedRoute`, **no** `AppLayout`):

| Path | Component | Layout | Guard |
|------|-----------|--------|-------|
| `/complete-profile` | `CompleteProfilePage` | `AuthLayout` (inside page) | `ProtectedRoute` only |

---

### (b) CLIENT / EndUser routes — `/app/*` — `AppLayout` + `ProtectedRoute`

| Path | Component | RoleGuard |
|------|-----------|-----------|
| `/app` (index) | `<Navigate to="dashboard" replace />` | none |
| `/app/dashboard` | `DashboardPlaceholderPage` | none |
| `/app/profile` | `ProfilePage` | none |
| `/app/services` | `CategoriesPage` | none |
| `/app/vehicles` | `VehiclesListPage` | none |
| `/app/vehicles/add` | `AddVehiclePage` | none |
| `/app/vehicles/:id` | `VehicleDetailsPage` | none |
| `/app/vehicles/:id/edit` | `EditVehiclePage` | none |
| `/app/services/nearby` | `NearbyServicesPage` | `RoleGuard allow=["customer","driver"]` |
| `/app/services/providers/:id` | `ProviderPublicDetailsPage` | `RoleGuard allow=["customer","driver"]` |
| `/app/favorites` | `FavoritesPage` | `RoleGuard allow=["customer","driver"]` |

> **Key observation:** `/app/dashboard`, `/app/profile`, `/app/services`, `/app/vehicles` and all vehicle sub-routes have **no role guard** — any authenticated user reaches them, including `admin` and `super_admin`.

---

### (c) PROVIDER routes — `/provider/*` — `AppLayout` + `ProtectedRoute`

| Path | Component | RoleGuard |
|------|-----------|-----------|
| `/provider` (index) | `<Navigate to="services" replace />` | none |
| `/provider/register` | `ProviderRegisterPage` | none (any auth user) |
| `/provider/pending` | `ProviderPendingPage` | `RoleGuard allow=["provider"]` |
| `/provider/services` | `ProviderServicesPage` | `RoleGuard allow=["provider"]` |
| `/provider/services/add` | `AddProviderServicePage` | `RoleGuard allow=["provider"]` |
| `/provider/services/:id/edit` | `EditProviderServicePage` | `RoleGuard allow=["provider"]` |
| `/provider/profile` | `ProfilePage` | `RoleGuard allow=["provider"]` |

#### PROVIDER ONBOARDING — `/provider/onboarding/*` — `OnboardingLayout` (no `AppLayout`) + `ProtectedRoute`

| Path | Component | Guard |
|------|-----------|-------|
| `/provider/onboarding` (index) | `OnboardingLoadingPage` | `ProtectedRoute` only |
| `/provider/onboarding/account` | `OnboardingAccountPage` | `ProtectedRoute` only |
| `/provider/onboarding/documents` | `OnboardingDocumentsPage` | `ProtectedRoute` only |
| `/provider/onboarding/review` | `OnboardingReviewPage` | `ProtectedRoute` only |

---

### (d) ADMIN routes — `/admin/*` — `AppLayout` + `ProtectedRoute`

| Path | Component | RoleGuard |
|------|-----------|-----------|
| `/admin` (index) | `<Navigate to="providers" replace />` | none |
| `/admin/providers` | `AdminProvidersPage` | `RoleGuard allow=["admin"]` |
| `/admin/providers/:id` | `AdminProviderDetailsPage` | `RoleGuard allow=["admin"]` |
| `/admin/profile` | `ProfilePage` | `RoleGuard allow=["admin"]` |

> **Critical gap:** `RoleGuard allow=["admin"]` does NOT include `"super_admin"`. A `super_admin` is blocked from `/admin/*` and falls through to `defaultHomeFor("super_admin")` — which is the `default` branch → `/app/dashboard`.

---

## 2. LANDING LOGIC

### `defaultHomeFor()` — full quote
**File:** [`src/shared/guards/RoleGuard.tsx`](file:///d:/maqwad-frontend-project/src/shared/guards/RoleGuard.tsx) lines 25–36

```ts
/** Maps a role to its primary landing route. */
function defaultHomeFor(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/providers";
    case "provider":
      return "/provider/services";
    case "driver":
    case "customer":
    default:
      return "/app/dashboard";
  }
}
```

> **`super_admin` is not a case in this switch.** It falls into `default` and returns `"/app/dashboard"`.

### `GuestRoute` redirect — full quote
**File:** [`src/shared/guards/GuestRoute.tsx`](file:///d:/maqwad-frontend-project/src/shared/guards/GuestRoute.tsx) lines 11–13

```tsx
if (accessToken && user?.isProfileComplete) {
  return <Navigate to="/app/dashboard" replace />;
}
```

> Hardcoded to `/app/dashboard` for ALL roles — no role awareness.

### Post-login redirect — full quote
**File:** [`src/modules/auth/pages/OtpPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/auth/pages/OtpPage.tsx) lines 51–55

```ts
if (!res.user.isProfileComplete) {
  navigate("/complete-profile", { replace: true });
} else {
  navigate("/app/dashboard", { replace: true });
}
```

> Also hardcoded to `/app/dashboard` for ALL roles when `isProfileComplete` is true.

### Landing table per role

| Role | `isProfileComplete`=false | `isProfileComplete`=true (OtpPage) | RoleGuard redirect from wrong area | GuestRoute if already authed |
|------|--------------------------|-------------------------------------|------------------------------------|------------------------------|
| `customer` | → `/complete-profile` | → `/app/dashboard` ✅ | → `/app/dashboard` | → `/app/dashboard` |
| `driver` | → `/complete-profile` | → `/app/dashboard` ✅ | → `/app/dashboard` | → `/app/dashboard` |
| `provider` | → `/complete-profile` | → `/app/dashboard` then `RoleGuard` → `/provider/services` | → `/provider/services` | → `/app/dashboard` |
| `admin` | skipped (mock sets `isProfileComplete: true`) | → `/app/dashboard` ⚠️ | → `/admin/providers` | → `/app/dashboard` ⚠️ |
| `super_admin` | skipped (mock sets `isProfileComplete: true`) | → `/app/dashboard` ❌ | → `/app/dashboard` ❌ (default case) | → `/app/dashboard` ❌ |

### Why `super_admin` lands on the client home — root causes (3 separate bugs)

1. **`defaultHomeFor()` has no `super_admin` case** → falls through to `default: return "/app/dashboard"`. Any `RoleGuard` that blocks super_admin sends them to `/app/dashboard`.

2. **`OtpPage` always navigates to `/app/dashboard`** after successful login — no role branching.

3. **`GuestRoute` always redirects to `/app/dashboard`** — no role branching.

---

## 3. NAV SOURCE — `navItemsForRole()` Full Quote

**File:** [`src/shared/components/layout/AppLayout.tsx`](file:///d:/maqwad-frontend-project/src/shared/components/layout/AppLayout.tsx) lines 179–243

```tsx
function navItemsForRole(role: UserRole): NavItemSpec[] {
  switch (role) {
    case "admin":
      return [
        { to: "/admin/providers", labelKey: "admin.providersTitle", icon: <ShieldCheck /> },
        { to: "/admin/profile",   labelKey: "profile.title",        icon: <UserIcon /> },
      ];
    case "provider":
      return [
        { to: "/provider/services", labelKey: "providers.services.title", icon: <Wrench /> },
        { to: "/provider/profile",  labelKey: "profile.title",            icon: <UserIcon /> },
      ];
    case "driver":
    case "customer":
    default:                            // ← super_admin falls here
      return [
        { to: "/app/dashboard",        labelKey: "common.appName",          icon: <LayoutDashboard /> },
        { to: "/app/vehicles",         labelKey: "vehicles.title",          icon: <Car /> },
        { to: "/app/services/nearby",  labelKey: "discovery.nav",           icon: <MapPin /> },
        { to: "/app/services",         labelKey: "servicesCatalog.title",   icon: <LayoutGrid /> },
        { to: "/app/favorites",        labelKey: "discovery.favoritesNav",  icon: <Heart /> },
        { to: "/app/profile",          labelKey: "profile.title",           icon: <UserIcon /> },
      ];
  }
}
```

**And on line 63:**
```tsx
const role: UserRole = user?.role ?? "customer";
const navItems = navItemsForRole(role);
```

### Nav items per role

| Role | Nav items rendered |
|------|-------------------|
| `admin` | Providers review, Profile |
| `provider` | Services, Profile |
| `customer` | Dashboard, Vehicles, Nearby, Services Catalog, Favorites, Profile |
| `driver` | Same as `customer` (falls through) |
| **`super_admin`** | **Same as `customer`** ← CLIENT nav (confirmed bug — falls through `default`) |

> **Why super_admin gets the client nav:** `navItemsForRole()` has no `case "super_admin":`, so it falls through to `default` which returns all the customer `/app/*` links. This is the same `default` pattern as `defaultHomeFor()`.

---

## 4. CROSS-DEPENDENCIES (Critical for Safe Freeze)

### 4a. Are any client pages imported/reused by provider or admin areas?

**Verdict: ONE shared page — `ProfilePage`.**

`ProfilePage` (`@modules/auth/pages/ProfilePage`) is mounted on THREE separate route segments:
- `/app/profile` (client area — line 266 of router)
- `/provider/profile` (provider area — line 349 of router)
- `/admin/profile` (admin area — line 375 of router)

All three use the same lazy import on lines 57–61 of router.tsx:
```ts
const ProfilePage = lazy(() =>
  import("@modules/auth/pages/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  }))
);
```

**`ProfilePage` itself has no `/app/*` hard-links** (no `navigate` or `Navigate` calls found). It is safe to keep `ProfilePage` in provider and admin routes even if the client `/app/profile` route is frozen.

**All other client pages** (`VehiclesListPage`, `CategoriesPage`, `NearbyServicesPage`, `FavoritesPage`, `ProviderPublicDetailsPage`, `DashboardPlaceholderPage`, `AddVehiclePage`, `EditVehiclePage`, `VehicleDetailsPage`) are **only imported and used in the `/app/*` route block** — no cross-imports found in admin or provider modules.

---

### 4b. Does `defaultHomeFor()` or any redirect point a NON-client role to a client route?

| Location | Redirect target | Roles affected | Risk if `/app/*` frozen |
|----------|----------------|----------------|------------------------|
| `RoleGuard.defaultHomeFor()` — `default` case | `/app/dashboard` | `super_admin` + any unknown role | **BREAKS** — `super_admin` lands on frozen route |
| `GuestRoute` hardcoded redirect | `/app/dashboard` | **ALL roles** | **BREAKS** — `admin`, `super_admin` re-entering app get frozen route |
| `OtpPage.handleSubmit()` line 54 | `/app/dashboard` | **ALL roles** with `isProfileComplete=true` | **BREAKS** — `admin`, `super_admin` post-login go to frozen route |
| `ProviderServicesPage` line 50 | `/app/dashboard` | `non-provider` roles who somehow hit that page | Potentially breaks |
| `ProviderPendingPage` line 19 | `/app/dashboard` | `non-provider` roles | Potentially breaks |
| `ProviderPendingPage` line 42 (Link) | `/app/dashboard` | Any user on pending page | **BREAKS** — "Back to Home" link goes to frozen route |
| `ProviderRegisterPage` line 43 | `/app/dashboard` | Any user who already registered as provider | Potentially breaks |
| `AddProviderServicePage` line 25 | `/app/dashboard` | `non-provider` | Potentially breaks |
| `EditProviderServicePage` line 35 | `/app/dashboard` | `non-provider` | Potentially breaks |
| `OnboardingDocumentsPage` line 335 | `/app/dashboard` | Any user after onboarding | Potentially breaks |
| `OnboardingReviewPage` line 233 | `/app/dashboard` | Any user after onboarding | Potentially breaks |
| `OnboardingLayout` line 73 | `/app/dashboard` | Any user cancelling onboarding | Potentially breaks |
| `CompleteProfilePage` line 45 | `/app/dashboard` (non-provider) | `customer`, `driver` | Would break if frozen |
| Root `/` in router (line 221) | `/app/dashboard` | All users | **BREAKS** — root redirect lands on frozen route |

---

### 4c. Are any client routes the fallback/redirect target of a guard?

Yes — the `*` catch-all on line 384:
```tsx
{ path: "*", element: <Navigate to="/login" replace /> },
```
This redirects to `/login`, not a client route, so it is **safe**.

However, the root `/` redirect on line 221:
```tsx
{ path: "/", element: <Navigate to="/app/dashboard" replace /> },
```
This **directly targets a client route** and must change.

---

### 4d. Complete list of files that must update if client routes are frozen

| File | Line(s) | What to change |
|------|---------|----------------|
| [`src/app/router.tsx`](file:///d:/maqwad-frontend-project/src/app/router.tsx) | 221 | Root `/` redirect: change from `/app/dashboard` to role-aware or `/login` |
| [`src/shared/guards/RoleGuard.tsx`](file:///d:/maqwad-frontend-project/src/shared/guards/RoleGuard.tsx) | 26–35 | Add `case "super_admin": return "/super-admin/dashboard"` (or new landing); fix `default` to not point at `/app/*` |
| [`src/shared/guards/GuestRoute.tsx`](file:///d:/maqwad-frontend-project/src/shared/guards/GuestRoute.tsx) | 12 | Change hardcoded `/app/dashboard` to role-aware redirect |
| [`src/modules/auth/pages/OtpPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/auth/pages/OtpPage.tsx) | 54 | Change `navigate("/app/dashboard")` to role-aware redirect |
| [`src/modules/providers/pages/ProviderPendingPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/providers/pages/ProviderPendingPage.tsx) | 19, 42 | Replace `/app/dashboard` with appropriate provider/admin home |
| [`src/modules/providers/pages/ProviderServicesPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/providers/pages/ProviderServicesPage.tsx) | 50 | Replace `/app/dashboard` |
| [`src/modules/providers/pages/ProviderRegisterPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/providers/pages/ProviderRegisterPage.tsx) | 43 | Replace `/app/dashboard` |
| [`src/modules/providers/pages/AddProviderServicePage.tsx`](file:///d:/maqwad-frontend-project/src/modules/providers/pages/AddProviderServicePage.tsx) | 25 | Replace `/app/dashboard` |
| [`src/modules/providers/pages/EditProviderServicePage.tsx`](file:///d:/maqwad-frontend-project/src/modules/providers/pages/EditProviderServicePage.tsx) | 35 | Replace `/app/dashboard` |
| [`src/modules/providers/onboarding/pages/OnboardingDocumentsPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/providers/onboarding/pages/OnboardingDocumentsPage.tsx) | 335 | Replace `/app/dashboard` |
| [`src/modules/providers/onboarding/pages/OnboardingReviewPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/providers/onboarding/pages/OnboardingReviewPage.tsx) | 233 | Replace `/app/dashboard` |
| [`src/modules/providers/onboarding/components/OnboardingLayout.tsx`](file:///d:/maqwad-frontend-project/src/modules/providers/onboarding/components/OnboardingLayout.tsx) | 73 | Replace `/app/dashboard` |
| [`src/modules/auth/pages/CompleteProfilePage.tsx`](file:///d:/maqwad-frontend-project/src/modules/auth/pages/CompleteProfilePage.tsx) | 45 | Already safe for customer/provider flow — only customer goes to `/app/dashboard`, which is correct |
| [`src/shared/components/layout/AppLayout.tsx`](file:///d:/maqwad-frontend-project/src/shared/components/layout/AppLayout.tsx) | 209 (`default`) | Add `case "super_admin":` to `navItemsForRole()` |

---

## 5. FREEZE STRATEGY OPTIONS

### Option A — Comment-block freeze with `// FROZEN` markers *(Recommended)*

In `router.tsx`, wrap the entire `/app` route block in a clearly marked comment:

```tsx
// ╔══════════════════════════════════════════════════════════════════════╗
// ║  FROZEN: client (EndUser) routes — mobile app area.                 ║
// ║  Re-enable when mobile-web client development resumes.              ║
// ║  DO NOT delete — code is intentionally preserved.                   ║
// ╚══════════════════════════════════════════════════════════════════════╝
/*
{
  path: "/app",
  element: <AppLayout />,
  children: [ ... all /app/* routes ... ],
},
*/
```

**Pros:** Zero runtime cost, Git-diffable, immediately reversible (uncomment), zero dependencies on build config.  
**Cons:** TypeScript will flag unused lazy imports at the top of router.tsx (the `VehiclesListPage`, `NearbyServicesPage`, etc. constants). Those lazy imports must also be commented out.  
**Verdict: Cleanest for this codebase** — single file, no new abstractions.

---

### Option B — Feature flag via `import.meta.env`

Add a Vite env variable `VITE_ENABLE_CLIENT_ROUTES=true/false`. In router.tsx:

```tsx
const clientRoutes = import.meta.env.VITE_ENABLE_CLIENT_ROUTES === "true"
  ? [{ path: "/app", element: <AppLayout />, children: [...] }]
  : [];

export const router = createBrowserRouter([
  ...
  ...clientRoutes,
  ...
]);
```

**Pros:** Toggleable per environment (dev/staging/prod) without code changes, no commented code.  
**Cons:** Requires `.env` file management; lazy imports still exist and Vite will still bundle chunks even when the routes are empty (tree shaking won't remove them since they're still declared at module top level). More boilerplate.

---

### Option C — Move client routes to a separate router file

Extract `/app/*` into `clientRouter.tsx`, import conditionally:

```tsx
// router.tsx
import { clientRoutes } from "./clientRoutes"; // simply don't import to freeze
```

**Pros:** Very clean architectural separation.  
**Cons:** Highest refactor cost now; the freeze itself doesn't need this level of separation; better suited as a post-freeze cleanup step.

---

## RECOMMENDED FREEZE PLAN (Option A + required companion changes)

### Routes SAFE to freeze (comment out in `router.tsx`)
All routes under the `/app` path block:
- `/app/dashboard`
- `/app/profile`
- `/app/services`
- `/app/vehicles` + all sub-routes
- `/app/services/nearby`
- `/app/services/providers/:id`
- `/app/favorites`

Also comment out the **lazy import declarations** for: `DashboardPlaceholderPage`, `VehiclesListPage`, `AddVehiclePage`, `EditVehiclePage`, `VehicleDetailsPage`, `CategoriesPage`, `NearbyServicesPage`, `ProviderPublicDetailsPage`, `FavoritesPage`.

### Routes that MUST STAY (do not touch)
- `/login`, `/verify-otp`, `/register` — AUTH
- `/complete-profile` — AUTH onboarding
- `/provider/*` + `/provider/onboarding/*` — PROVIDER
- `/admin/*` — ADMIN
- `*` catch-all → `/login`

### Redirects/landings that MUST CHANGE before or alongside the freeze

| # | File | Change |
|---|------|--------|
| 1 | `router.tsx` line 221 | Root `/` → change to `/admin/dashboard` (or role-aware, or `/login`) |
| 2 | `RoleGuard.tsx` lines 26–35 | Add `case "super_admin": return "/super-admin/dashboard"` (or whatever the new SA landing is); remove `default:` fallback to `/app/dashboard` |
| 3 | `GuestRoute.tsx` line 12 | Role-aware redirect, at minimum: `super_admin` + `admin` → their respective home |
| 4 | `OtpPage.tsx` line 54 | Role-aware post-login redirect (use `defaultHomeFor(res.user.role)` from RoleGuard or a shared helper) |
| 5 | `ProviderPendingPage.tsx` lines 19 & 42 | Replace `/app/dashboard` with `/provider/services` or a neutral `/login` |
| 6 | `ProviderServicesPage.tsx` line 50 | Replace `/app/dashboard` |
| 7 | `ProviderRegisterPage.tsx` line 43 | Replace `/app/dashboard` |
| 8 | `AddProviderServicePage.tsx` line 25 | Replace `/app/dashboard` |
| 9 | `EditProviderServicePage.tsx` line 35 | Replace `/app/dashboard` |
| 10 | `OnboardingDocumentsPage.tsx` line 335 | Replace `/app/dashboard` |
| 11 | `OnboardingReviewPage.tsx` line 233 | Replace `/app/dashboard` |
| 12 | `OnboardingLayout.tsx` line 73 | Replace `/app/dashboard` |
| 13 | `AppLayout.tsx` — `navItemsForRole()` default | Add `case "super_admin":` returning super-admin nav items |

> **Changes 1–4 are BLOCKING** (without them, super_admin and admin will land on a frozen/404 route the moment they log in or visit the root).  
> **Changes 5–12** only trigger if a provider/onboarding user hits an edge case; they are lower priority but should be done for correctness.  
> **Change 13** is needed so super_admin doesn't see client nav inside `AppLayout`.

---

**No files were changed.**
