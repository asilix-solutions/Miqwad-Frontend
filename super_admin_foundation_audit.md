# Super Admin Dashboard — Foundation Audit Report
**Branch:** `shadcn-integration`  
**Date:** 2026-06-10  
**Scope:** Read-only diagnostic — no files were changed.

---

## 1. EXISTING ADMIN MODULE

### File Inventory (`src/modules/admin/`)

| File | Summary |
|------|---------|
| [`api/adminApi.ts`](file:///d:/maqwad-frontend-project/src/modules/admin/api/adminApi.ts) | Axios transport for 3 admin endpoints: `GET /admin/providers`, `PATCH /admin/providers/{id}/approve`, `PATCH /admin/providers/{id}/reject`. Currently mocked. |
| [`hooks/useAdminQueries.ts`](file:///d:/maqwad-frontend-project/src/modules/admin/hooks/useAdminQueries.ts) | TanStack Query hooks: `useAdminProvidersQuery`, `useApproveProviderMutation`, `useRejectProviderMutation`, plus `adminKeys` cache-key factory. |
| [`pages/AdminProvidersPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/admin/pages/AdminProvidersPage.tsx) | Provider list page with 4 status-filter tabs (pending/approved/rejected/all), card grid, and inline reject dialog. |
| [`pages/AdminProviderDetailsPage.tsx`](file:///d:/maqwad-frontend-project/src/modules/admin/pages/AdminProviderDetailsPage.tsx) | Single-provider deep-review page: profile fields, KYC documents, approve/reject action buttons. |
| [`components/AdminProviderCard.tsx`](file:///d:/maqwad-frontend-project/src/modules/admin/components/AdminProviderCard.tsx) | Card component showing provider name, email, phone, city, status badge, and approve/reject/view-details buttons. |
| [`components/RejectProviderDialog.tsx`](file:///d:/maqwad-frontend-project/src/modules/admin/components/RejectProviderDialog.tsx) | shadcn Dialog + react-hook-form for capturing a rejection reason (validated by Zod, 3–500 chars). |
| [`schemas/admin.schemas.ts`](file:///d:/maqwad-frontend-project/src/modules/admin/schemas/admin.schemas.ts) | Zod schema `rejectProviderSchema` for the rejection reason field; exports `RejectProviderFormValues`. |
| [`types.ts`](file:///d:/maqwad-frontend-project/src/modules/admin/types.ts) | `AdminProviderStatus = "pending" \| "approved" \| "rejected" \| "all"`, `AdminProvider = ProviderProfile` (re-export), `RejectProviderRequest`. |

> **No store slice, no admin-specific store.** Admin filter state (`adminStatus`) is kept in `providersSlice`, not a dedicated admin slice.

---

### Admin Routes (from `src/app/router.tsx`)

```tsx
// Lines 357–381 of router.tsx
// Admin area — locked to role=admin only.
{
  path: "/admin",
  element: <AppLayout />,         // ← uses the SHARED layout, not a dedicated admin shell
  children: [
    {
      element: <SuspenseOutlet />,
      children: [
        { index: true, element: <Navigate to="providers" replace /> },
        {
          element: <RoleGuard allow={["admin"]} />,
          children: [
            { path: "providers", element: <AdminProvidersPage /> },
            { path: "providers/:id", element: <AdminProviderDetailsPage /> },
            { path: "profile", element: <ProfilePage /> },
          ],
        },
      ],
    },
  ],
},
```

**Routes registered:** `/admin` (→ redirect), `/admin/providers`, `/admin/providers/:id`, `/admin/profile`  
**Guard used:** `RoleGuard allow={["admin"]}` — single `admin` role, no super_admin.  
**Layout used:** `AppLayout` (same as customer and provider areas).

---

### Admin API Functions & Query Hooks

**`adminApi`** (`adminApi.ts`):
```ts
adminApi.listProviders(status?: AdminProviderStatus)  // GET /admin/providers?status=...
adminApi.approveProvider(providerId: number)           // PATCH /admin/providers/{id}/approve
adminApi.rejectProvider(providerId, reason)            // PATCH /admin/providers/{id}/reject
```

**`adminKeys`** + hooks (`useAdminQueries.ts`):
```ts
adminKeys = {
  all: ["admin"],
  providers: (status?) => ["admin", "providers", status ?? "all"]
}
useAdminProvidersQuery(status: AdminProviderStatus = "pending")
useApproveProviderMutation()
useRejectProviderMutation()
```

---

## 2. AUTH / ROLES / PERMISSIONS

### Role Type (from `src/modules/auth/types.ts`, line 6)
```ts
export type UserRole = "customer" | "provider" | "driver" | "admin";
```
**There are exactly 4 roles. No `super_admin` role exists.**

### ProviderStatus (line 13)
```ts
export type ProviderStatus = "pending" | "approved" | "rejected";
```

### User Shape (lines 15–28)
```ts
export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isProfileComplete: boolean;
  providerId?: number | null;       // only when role === "provider"
  providerStatus?: ProviderStatus | null;
  providerRejectionReason?: string | null;
}
```

### Auth State (from `src/modules/auth/store/authSlice.ts`, lines 5–16)
```ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingVerification: { verificationId: string; phoneNumber: string; resendAfter: number } | null;
  status: "idle" | "loading" | "authenticated" | "error";
}
```
Role is read from `s.auth.user.role` — no separate role selector or RBAC helper exists.

### Route Guards

**`ProtectedRoute`** (`src/shared/guards/ProtectedRoute.tsx`):  
Redirects unauthenticated users to `/login`. Also enforces profile completion.

**`RoleGuard`** (`src/shared/guards/RoleGuard.tsx`):
```tsx
interface RoleGuardProps {
  allow: ReadonlyArray<UserRole>;   // ← string union, no bitmask or permission set
}

function defaultHomeFor(role: UserRole): string {
  switch (role) {
    case "admin":    return "/admin/providers";
    case "provider": return "/provider/services";
    case "driver":
    case "customer":
    default:         return "/app/dashboard";
  }
}

export function RoleGuard({ allow }: RoleGuardProps) {
  const user = useAppSelector((s) => s.auth.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  // ... bounces to /login if no token, to defaultHomeFor(role) if role not in allow
}
```

### Super Admin vs Admin
> **No distinction exists.** There is a single `"admin"` role value. No concept of `"super_admin"`, no permission matrix, no capability flags. Any distinction would need to be added from scratch.

---

## 3. PROVIDER TYPES & DOMAIN

### Provider Status (re-exported from auth, used throughout)
```ts
// src/modules/auth/types.ts:13
export type ProviderStatus = "pending" | "approved" | "rejected";
```

### KYC Document Types (`src/modules/providers/types.ts`, line 14)
```ts
export type KycDocumentType = "commercial" | "tax" | "identity";
```

### ProviderProfile (lines 31–52 of providers/types.ts)
```ts
export interface ProviderProfile {
  id: number;
  userId: string;
  companyName: string;
  email: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  city: string | null;
  workingHours: string | null;
  rating: number;
  totalRatings: number;
  isVerified: boolean;
  status: ProviderStatus;           // "pending" | "approved" | "rejected"
  categoryIds: number[];
  documents: ProviderDocument[];
  rejectionReason: string | null;
  createdAt: string;
}
```

### Domain Entities an Admin Would Manage

| Entity | Where Defined | Current Admin Coverage |
|--------|--------------|----------------------|
| **Providers** | `src/modules/providers/types.ts` — `ProviderProfile` | ✅ Full CRUD (list, view, approve, reject) |
| **Provider Services** | `src/modules/providers/types.ts` — `ProviderService` | ❌ No admin API/UI |
| **Service Categories** | `src/modules/services/types.ts` — `ServiceCategory` | ❌ Read-only via `servicesApi.categories()`, no admin management |
| **Service Subcategories** | `src/modules/services/types.ts` — `ServiceSubcategory` | ❌ No admin management |
| **Vehicles** | `src/modules/vehicles/types.ts` — `Vehicle`, `MaintenanceRecord`, `UpcomingService` | ❌ No admin view |
| **Users** | `src/modules/auth/types.ts` — `User` | ❌ No admin user management (only `GET /users/me`) |
| **KYC Documents** | `src/modules/providers/types.ts` — `ProviderDocument` | 🟡 Displayed in detail view, no bulk management |
| **Nearby/Discovery** | `src/modules/discovery/types.ts` — `NearbyProvider`, `FavoriteEntry` | ❌ No admin view |

---

## 4. DATA LAYER READINESS

### Axios Instance (`src/shared/lib/axios.ts`)
```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
```
- Request interceptor: attaches `Authorization: Bearer <token>` + `Accept-Language` header.
- Response interceptor: handles 401 → refresh-token retry (single in-flight refresh coordinated via `refreshInflight` promise).
- All errors normalized to `AppError`.

### TanStack Query Config (`src/shared/lib/queryClient.ts`)
```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,           // 60s — data stays fresh for 1 minute
      gcTime: 5 * 60_000,          // 5min garbage collection
      retry: 1,
      refetchOnWindowFocus: false, // ← already dashboard-appropriate
    },
    mutations: { retry: 0 },
  },
});
```

### Existing API Modules

| Module | File | Endpoints |
|--------|------|-----------|
| **Auth** | `src/modules/auth/api/authApi.ts` | `POST /auth/register`, `POST /auth/verify-otp`, `POST /auth/refresh-token`, `POST /auth/logout`, `GET /users/me`, `PUT /users/me`, `POST /users/me/avatar` |
| **Vehicles** | `src/modules/vehicles/api/vehiclesApi.ts` | Full CRUD `/Vehicles`, maintenance history, upcoming services, lookups (brands/models/years) |
| **Providers** | `src/modules/providers/api/providersApi.ts` | `POST /ServiceProviders/register`, `GET /ServiceProviders/{id}/profile`, `POST /ServiceProviders/{id}/documents`, provider services CRUD |
| **Services Catalog** | `src/modules/services/api/servicesApi.ts` | `GET /Services/categories`, `GET /Services/categories/{id}/subcategories` |
| **Discovery** | `src/modules/discovery/api/discoveryApi.ts` | `GET /services/nearby`, provider profile/services/reviews, favorites CRUD |
| **Admin** | `src/modules/admin/api/adminApi.ts` | `GET /admin/providers`, `PATCH /admin/providers/{id}/approve`, `PATCH /admin/providers/{id}/reject` — **all mocked** |

---

## 5. SHADCN COMPONENT INVENTORY (`src/components/ui/`)

**Installed: 12 components total**

### ✅ Dashboard-Essential — EXIST
| Component | File |
|-----------|------|
| `table` | [`table.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/table.tsx) |
| `tabs` | [`tabs.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/tabs.tsx) |
| `dialog` | [`dialog.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/dialog.tsx) |
| `dropdown-menu` | [`dropdown-menu.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/dropdown-menu.tsx) |
| `badge` | [`badge.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/badge.tsx) |
| `card` | [`card.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/card.tsx) |
| `skeleton` | [`skeleton.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/skeleton.tsx) |
| `sonner` | [`sonner.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/sonner.tsx) |
| `select` | [`select.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/select.tsx) |
| `input` | [`input.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/input.tsx) |
| `label` | [`label.tsx`](file:///d:/maqwad-frontend-project/src/components/ui/label.tsx) |
| `button` | (in `@/components/ui/button.tsx`, exists — used throughout) |

### ❌ Dashboard-Common — MISSING
| Missing Component | Typical Use in Dashboard |
|-------------------|------------------------|
| `sheet` | Slide-over panels for filters, detail drawers |
| `sidebar` | A proper sidebar component (shadcn/ui v2 style) |
| `breadcrumb` | Navigation hierarchy in admin pages |
| `pagination` | Table pagination controls |
| `avatar` | User/provider avatar display |
| `tooltip` | Hover hints on icon buttons and truncated cells |
| `popover` | Date pickers, inline filters |
| `separator` | Visual section dividers |
| `scroll-area` | Scrollable content regions (e.g., long document lists) |
| `command` | Command palette / search combobox |
| `calendar` | Date-range filters for reports |
| `chart` | Recharts-based dashboard metrics charts |
| `progress` | Progress bars (e.g., KYC completion) |
| `alert` | Inline status/warning callouts |
| `accordion` | Collapsible sections |
| `switch` | Toggle for feature flags / settings |

> **Note on `button`:** button.tsx is under `src/components/ui/` but not listed in the dir output above — it's confirmed used via `import { Button } from "@/components/ui/button"` in multiple files.

---

## 6. i18n & LAYOUT

### i18n Structure (`src/app/i18n.ts`)

Single-file inline translations (no external JSON). All keys are flat nested within two language objects (`ar` and `en`).

```ts
// Top-level namespaces (object keys in ar/en):
common.*, auth.*, profile.*, vehicles.*, maintenance.*, upcoming.*,
errors.*, empty.*, providers.*, servicesCatalog.*, admin.*, discovery.*
```

**`admin.*` namespace exists** with the following keys (lines 358–379 of i18n.ts):
```ts
admin: {
  title: "لوحة المسؤول",              // "Admin Panel"
  providersTitle: "مراجعة مقدّمي الخدمة",
  providersSubtitle: "الموافقة أو الرفض للطلبات الواردة",
  statusAll, statusPending, statusApproved, statusRejected,
  viewDetails, approve, reject, rejectReason, rejectReasonPlaceholder,
  approveConfirm, rejectConfirm, approved, rejected, actionFailed,
  documents, emptyForStatus, providerDetailsTitle
}
```

**Gap:** No i18n keys for users management, analytics, system settings, categories CRUD, or any Super Admin-specific strings.

---

### Layout Shell

| Layout | File | Used for |
|--------|------|---------|
| `AppLayout` | [`src/shared/components/layout/AppLayout.tsx`](file:///d:/maqwad-frontend-project/src/shared/components/layout/AppLayout.tsx) | All authenticated areas (customer `/app/*`, provider `/provider/*`, **admin `/admin/*`**) |
| `AuthLayout` | [`src/shared/components/layout/AuthLayout.tsx`](file:///d:/maqwad-frontend-project/src/shared/components/layout/AuthLayout.tsx) | Login, OTP, register screens |

**`AppLayout` admin nav** (lines 181–193):
```tsx
case "admin":
  return [
    { to: "/admin/providers", labelKey: "admin.providersTitle", icon: <ShieldCheck /> },
    { to: "/admin/profile",   labelKey: "profile.title",         icon: <UserIcon /> },
  ];
```

**There is NO dedicated admin/dashboard layout shell.** The admin pages reuse `AppLayout`, which is styled for a customer/provider mobile-first sidebar. It has no:
- Breadcrumb area
- Page title bar
- Stats/KPI header zone
- Admin-specific color scheme or branding

---

## CONCLUSION

### Foundation Readiness for Super Admin Dashboard: **NEEDS PREP**

### Concrete Gaps to Fill

**🔴 Critical (blockers before coding starts):**
1. **Missing `super_admin` role** — `UserRole` is `"customer" | "provider" | "driver" | "admin"`. A `"super_admin"` variant (or a separate `permissions` field) must be defined in `auth/types.ts`, `RoleGuard`, `defaultHomeFor()`, and `AppLayout.navItemsForRole()`.
2. **No dedicated admin layout shell** — The dashboard needs its own layout (proper sidebar width, breadcrumbs, header with global search, stats zone) instead of inheriting `AppLayout`.
3. **Admin API endpoints are all mocked and incomplete** — Only 3 endpoints exist for providers. Zero endpoints for users, categories, analytics, or system settings.
4. **Missing shadcn components (16):** `sheet`, `sidebar`, `breadcrumb`, `pagination`, `avatar`, `tooltip`, `popover`, `separator`, `scroll-area`, `command`, `calendar`, `chart`, `progress`, `alert`, `accordion`, `switch`.

**🟡 Important (needed shortly after start):**
5. **No admin store slice** — `adminStatus` filter is buried in `providersSlice`. A dedicated `adminSlice` (or expansion) is needed for the dashboard's multi-entity filter/pagination state.
6. **Missing i18n keys** — `admin.*` namespace covers only provider-review strings; needs keys for: users, categories, analytics, dashboard stats, settings, breadcrumbs.
7. **No user management API** — `authApi` only exposes `/users/me`. A `GET /admin/users` (list all users) endpoint doesn't exist on the frontend.
8. **No categories admin API** — `servicesApi` only reads categories; no create/update/delete for admin.
9. **No analytics/reporting API** — Zero aggregate/stats endpoints exist.

**🟢 Already in place (reuse freely):**
- ✅ `apiClient` (axios) + refresh-token flow
- ✅ `queryClient` (TanStack Query, already `refetchOnWindowFocus: false`)
- ✅ 11 core shadcn components (table, tabs, dialog, dropdown-menu, badge, card, skeleton, select, input, label, button)
- ✅ `ProtectedRoute` + `RoleGuard` (just needs `super_admin` added to allow list)
- ✅ All existing `admin.*` i18n strings (ar + en)
- ✅ `AdminProvider` type = `ProviderProfile` (rich entity, ready to display)
- ✅ `adminKeys` cache factory + 3 working query/mutation hooks
- ✅ `RejectProviderDialog` (shadcn Dialog + Zod) — reusable pattern

---

**No files were changed.**
