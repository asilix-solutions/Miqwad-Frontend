# Diagnostic Snapshot: p1-dashboard

## 1. GIT Status
**Branch**: `p1-dashboard` (Ahead of 'origin/p1-dashboard' by 1 commit)
**Status**: Clean working tree (`nothing to commit, working tree clean`)

**Recent Commits (top 15)**:
- `10381f7` feat: add TemplateFormDialog component for creating and updating notification templates
- `d8f519f` feat(admin): notifications hub (templates + sent history) + i18n/RTL fixes
- `7e82c0c` feat(admin): provider subscriptions monitoring + consolidate plans/subscriptions under one tabbed hub
- `6542cd6` feat(admin): services catalog + packages (live-savings builder) + subscription plans data layer
- `4fb66b4` feat(admin): services catalog + packages (live-savings builder) + subscription plans data layer
- `1b0796d` feat(admin): services catalog + packages section with live-savings builder (bilingual, flexible)
- `e8d1e82` feat(admin): global services catalog - CRUD + isActive toggle + filters (bilingual, flexible) as 4th reference tab
- `feadee3` feat(admin): global services catalog - CRUD + isActive toggle + filters (bilingual, flexible) as 4th reference tab
- `bf665c0` feat(admin): brands/models master-detail panel (bilingual, cascade-aware, Can-gated) as 3rd reference tab
- `1d82027` feat(vehicles): bilingual brand/model names (nameAr+nameEn, Arabic-first display, name kept for compat)
- `36561c7` feat(vehicles): bilingual brand/model names (nameAr+nameEn, Arabic-first display, name kept for compat)
- `e98a396` refactor(admin): consolidate reference data under one tabbed page, single sidebar item
- `7717598` feat(admin): cities CRUD - mirrors categories pattern (Can-gated, KSA_CITIES untouched)
- `1e805a6` refactor(admin): categories CRUD - reusable form dialog pattern + delete confirm (Can-gated, client-synced)
- `b2ba97e` perf(admin): shared cached formatDate + deferred dialog mounts + remove i18n leak

## 2. STRUCTURE
**Admin Module Tree (`src/modules/admin/`)**:
- `api/adminApi.ts`
- `components/`
  - `layout/` (`AdminBreadcrumb.tsx`, `AdminLayout.tsx`, `AdminSidebar.tsx`, `AdminTopbar.tsx`)
  - `ApproveProviderDialog.tsx`, `DocumentViewerDialog.tsx`, `RejectProviderDialog.tsx`
  - *Subdirectories*: `dashboard/`, `escrow/`, `notifications/`, `packages/`, `reference/`, `settlements/`, `shared/`, `subscriptions/`, `users/`
- `hooks/useAdminQueries.ts`
- `pages/`
  - `AdminCategoriesPage.tsx`, `AdminCitiesPage.tsx`, `AdminDashboardPage.tsx`, `AdminDisputeDetailsPage.tsx`, `AdminDisputesPage.tsx`, `AdminNotificationsHubPage.tsx`, `AdminPackageBuilderPage.tsx`, `AdminPackagesPage.tsx`, `AdminPlansPage.tsx`, `AdminProviderDetailsPage.tsx`, `AdminProvidersPage.tsx`, `AdminReferenceDataPage.tsx`, `AdminSettlementsPage.tsx`, `AdminSubscriptionsHubPage.tsx`, `AdminUserDetailsPage.tsx`, `AdminUsersPage.tsx`
- `schemas/admin.schemas.ts`
- `types.ts`

**Domain Exported Types**:
- **Services**: `ServiceCategory`, `ServiceSubcategory`, `Service`, `ServicePackage`
- **Subscriptions**: `BillingCycle`, `PlanFeature`, `SubscriptionPlan`, `SubscriptionStatus`, `ProviderSubscription`
- **Notifications**: `NotificationChannel`, `NotificationAudience`, `NotificationStatus`, `NotificationTemplate`, `SentNotification`
- **Vehicles**: `FuelType`, `Brand`, `VehicleModel`, `Vehicle`, `CreateVehicleRequest`, `UpdateVehicleRequest`, `MaintenanceRecord`, `AddMaintenanceRecordRequest`, `UpcomingService`, `MaintenanceHistoryQuery`
- **Providers**: `KycDocumentType`, `ProviderDocument`, `ProviderProfile`, `RegisterProviderRequest`, `ProviderService`, `CreateProviderServiceRequest`, `UpdateProviderServiceRequest`

## 3. PERMISSIONS (`src/shared/auth/permissions.ts`)
- **providers**: `view`, `approve`, `reject`, `suspend`, `restore`
- **users**: `view`, `create`, `edit`, `suspend`, `restore`, `delete`
- **roles**: `view`, `create`, `edit`, `delete`, `assign`
- **categories**: `view`, `create`, `edit`, `delete`
- **cities**: `view`, `create`, `edit`, `delete`
- **brands**: `view`, `create`, `edit`, `delete`
- **models**: `view`, `create`, `edit`, `delete`
- **services**: `view`, `create`, `edit`, `delete`
- **packages**: `view`, `create`, `edit`, `delete`
- **plans**: `view`, `create`, `edit`, `delete`
- **subscriptions**: `view`, `manage`
- **finance**: `view`, `settle`, `export`
- **escrow**: `view`, `resolve`, `refund`
- **bookings**: `view`, `cancel`, `export`
- **reviews**: `view`, `delete`, `flag`
- **analytics**: `view`, `export`
- **notifications**: `view`, `manage`, `send`, `delete`
- **settings**: `view`, `edit`
- **audit**: `view`, `export`

## 4. ROUTES (`router.tsx` - Admin Area)
All `/admin` routes require `role=["admin", "super_admin"]`.
- `/admin/dashboard` (No specific permission guard)
- `/admin/users` & `/admin/users/:id` -> `PermissionGuard(users.view)`
- `/admin/providers` & `/admin/providers/:id` -> `PermissionGuard(providers.view)`
- `/admin/finance` -> `PermissionGuard(finance.view)`
- `/admin/escrow` & `/admin/escrow/:id` -> `PermissionGuard(escrow.view)`
- `/admin/reference` -> `PermissionGuard(categories.view)`
- `/admin/packages`, `/admin/packages/builder`, `/admin/packages/builder/:id` -> `PermissionGuard(packages.view)`
- `/admin/subscriptions` -> `PermissionGuard(subscriptions.view)`
- `/admin/notifications` -> `PermissionGuard(notifications.view)`
- `/admin/plans` -> Redirect to `/admin/subscriptions?tab=plans` (legacy)
- `/admin/categories` -> Redirect to `/admin/reference?tab=categories` (legacy)
- `/admin/cities` -> Redirect to `/admin/reference?tab=cities` (legacy)
- `/admin/profile` -> `ProfilePage`

## 5. SIDEBAR (`AdminSidebar.tsx`)
1. Dashboard (`/admin/dashboard`)
2. Providers (`/admin/providers`)
3. Users (`/admin/users`)
4. Reference (`/admin/reference`)
5. Packages (`/admin/packages`)
6. Subscriptions (`/admin/subscriptions`)
7. Finance (`/admin/finance`)
8. Escrow (`/admin/escrow`)
9. Notifications (`/admin/notifications`)
10. Audit (`/admin/audit`)
11. Settings (`/admin/settings`)

## 6. ADMIN HOOKS (`useAdminQueries.ts`)
- **Dashboard/Users/Providers**: `useDashboardStatsQuery`, `useUsersQuery`, `useAdminProvidersQuery`, `useApproveProviderMutation`, `useRejectProviderMutation`, `useUserQuery`, `useSuspendUserMutation`, `useRestoreUserMutation`
- **Finance/Escrow**: `useSettlementsQuery`, `useApproveSettlementMutation`, `useRejectSettlementMutation`, `useDisputesQuery`, `useDisputeQuery`, `useResolveDisputeMutation`, `useEscrowQuery`
- **Categories/Services**: `useAdminCategoriesQuery`, `useCreateCategoryMutation`, `useUpdateCategoryMutation`, `useDeleteCategoryMutation`, `useAdminServicesQuery`, `useCreateServiceMutation`, `useUpdateServiceMutation`, `useDeleteServiceMutation`
- **Packages**: `useAdminPackagesQuery`, `usePackageQuery`, `useCreatePackageMutation`, `useUpdatePackageMutation`, `useDeletePackageMutation`
- **Plans/Subscriptions**: `useAdminPlansQuery`, `usePlanQuery`, `useCreatePlanMutation`, `useUpdatePlanMutation`, `useDeletePlanMutation`, `useSubscriptionsQuery`, `useCancelSubscriptionMutation`
- **Cities**: `useCitiesQuery`, `useCreateCityMutation`, `useUpdateCityMutation`, `useDeleteCityMutation`
- **Vehicles/Brands/Models**: `useAdminBrandsQuery`, `useCreateBrandMutation`, `useUpdateBrandMutation`, `useDeleteBrandMutation`, `useModelsForBrandQuery`, `useCreateModelMutation`, `useUpdateModelMutation`, `useDeleteModelMutation`
- **Notifications**: `useTemplatesQuery`, `useTemplateQuery`, `useCreateTemplateMutation`, `useUpdateTemplateMutation`, `useDeleteTemplateMutation`, `useSendNotificationMutation`, `useSentNotificationsQuery`

## 7. MOCK ENDPOINTS
- `GET /admin/me/permissions`
- `GET /admin/dashboard/stats`
- `GET /admin/users` (and `/:id`, `/:id/suspend`, `/:id/restore`)
- `GET /admin/providers?status=...` (and `/:id/approve`, `/:id/reject`)
- `GET /admin/settlements` (and `/:id/approve`, `/:id/reject`)
- `GET /admin/disputes` (and `/:id`, `/:id/resolve`)
- `GET /admin/escrow`
- **CRUD Operations (GET, POST, PUT, DELETE) for:**
  - `/admin/categories`
  - `/admin/cities`
  - `/admin/services`
  - `/admin/packages`
  - `/admin/plans`
  - `/admin/notification-templates`
- `GET /admin/subscriptions`, `POST /admin/subscriptions/:id/cancel`
- `POST /admin/notifications/send`, `GET /admin/notifications`

## 8. SHARED HELPERS
**`src/shared/lib/`**:
- `axios.ts`
- `formatCurrency.ts`
- `formatDate.ts`
- `queryClient.ts`
- `storage.ts`
- `utils.ts`

**`src/shared/auth/`**:
- `Can.tsx`
- `PermissionGuard.tsx`
- `permissions.ts`
- `usePermissions.ts`
