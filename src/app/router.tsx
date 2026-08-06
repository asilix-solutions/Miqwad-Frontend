/**
 * @file router.tsx
 *
 * Application route definitions with **route-level code splitting**.
 *
 * ## What changed
 * All page-level components are now loaded via `React.lazy()` instead of
 * eager top-level imports. This means Vite generates a separate chunk per
 * page, and the browser only downloads a page's code when the user navigates
 * to that route — dramatically reducing the initial bundle size.
 *
 * ## Suspense boundary strategy
 * Rather than a single top-level `<Suspense>`, boundaries are placed at the
 * **layout shell level** (guest routes, app/protected routes, provider routes,
 * admin routes). This ensures that when navigating between pages *within the
 * same layout*, only the page content area shows the loading spinner — the
 * layout chrome (sidebar, header, bottom nav) stays mounted and visible.
 *
 * Each `<Suspense>` is wrapped in an `<ErrorBoundary>` to catch chunk-load
 * failures (e.g. network errors during dynamic import) and render a
 * recoverable error UI instead of a white screen.
 *
 * ## What stays eagerly imported
 * - Layouts (`AppLayout`) — must render immediately as the shell
 * - Guards (`ProtectedRoute`, `GuestRoute`, `RoleGuard`) — must evaluate
 *   synchronously to redirect before any page renders
 * - `PageLoader` & `ErrorBoundary` — must be available immediately as
 *   fallback/catch UIs
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@shared/components/layout/AppLayout";
import { GuestRoute } from "@shared/guards/GuestRoute";
import { ProtectedRoute } from "@shared/guards/ProtectedRoute";
import { RoleGuard, defaultHomeFor } from "@shared/guards/RoleGuard";
import { PermissionGuard } from "@shared/auth/PermissionGuard";
import { PageLoader } from "@shared/components/feedback/PageLoader";
import { ErrorBoundary } from "@shared/components/error/ErrorBoundary";
import { useAppSelector } from "@app/store";

// ─── Auth Pages ───────────────────────────────────────────────────────────────
const LoginPage = lazy(() =>
  import("@modules/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const OtpPage = lazy(() =>
  import("@modules/auth/pages/OtpPage").then((m) => ({ default: m.OtpPage }))
);
const RegisterPage = lazy(() =>
  import("@modules/auth/pages/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  }))
);
const RegisterProviderPage = lazy(() =>
  import("@modules/auth/pages/RegisterProviderPage").then((m) => ({
    default: m.RegisterProviderPage,
  }))
);
const ForgotPasswordPage = lazy(() =>
  import("@modules/auth/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  }))
);
const ResetPasswordPage = lazy(() =>
  import("@modules/auth/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  }))
);
// ===== FROZEN: client/EndUser lazy imports — re-enable when client web app is needed =====
// const DashboardPlaceholderPage = lazy(() =>
//   import("@modules/auth/pages/DashboardPlaceholderPage").then((m) => ({
//     default: m.DashboardPlaceholderPage,
//   }))
// );
//
// // ─── Vehicle Pages ────────────────────────────────────────────────────────────
// const VehiclesListPage = lazy(() =>
//   import("@modules/vehicles/pages/VehiclesListPage").then((m) => ({
//     default: m.VehiclesListPage,
//   }))
// );
// const AddVehiclePage = lazy(() =>
//   import("@modules/vehicles/pages/AddVehiclePage").then((m) => ({
//     default: m.AddVehiclePage,
//   }))
// );
// const EditVehiclePage = lazy(() =>
//   import("@modules/vehicles/pages/EditVehiclePage").then((m) => ({
//     default: m.EditVehiclePage,
//   }))
// );
// const VehicleDetailsPage = lazy(() =>
//   import("@modules/vehicles/pages/VehicleDetailsPage").then((m) => ({
//     default: m.VehicleDetailsPage,
//   }))
// );
//
// // ─── Service Pages ────────────────────────────────────────────────────────────
// const CategoriesPage = lazy(() =>
//   import("@modules/services/pages/CategoriesPage").then((m) => ({
//     default: m.CategoriesPage,
//   }))
// );
//
// // ─── Discovery Pages ─────────────────────────────────────────────────────────
// const NearbyServicesPage = lazy(() =>
//   import("@modules/discovery/pages/NearbyServicesPage").then((m) => ({
//     default: m.NearbyServicesPage,
//   }))
// );
// const ProviderPublicDetailsPage = lazy(() =>
//   import("@modules/discovery/pages/ProviderPublicDetailsPage").then((m) => ({
//     default: m.ProviderPublicDetailsPage,
//   }))
// );
// const FavoritesPage = lazy(() =>
//   import("@modules/discovery/pages/FavoritesPage").then((m) => ({
//     default: m.FavoritesPage,
//   }))
// );
// ===== END FROZEN =====

// ─── Admin-Only Notice Page (shown to non-admin roles while client routes are frozen) ──
const AdminOnlyNoticePage = lazy(() =>
  import("@modules/auth/pages/AdminOnlyNoticePage").then((m) => ({
    default: m.AdminOnlyNoticePage,
  }))
);

// ─── Provider Pages ───────────────────────────────────────────────────────────
const ProviderRegisterPage = lazy(() =>
  import("@modules/providers/pages/ProviderRegisterPage").then((m) => ({
    default: m.ProviderRegisterPage,
  }))
);
const ProviderPendingPage = lazy(() =>
  import("@modules/providers/pages/ProviderPendingPage").then((m) => ({
    default: m.ProviderPendingPage,
  }))
);
const ProviderServicesPage = lazy(() =>
  import("@modules/providers/pages/ProviderServicesPage").then((m) => ({
    default: m.ProviderServicesPage,
  }))
);
const ProviderIndexRedirect = lazy(() =>
  import("@modules/providers/pages/ProviderIndexRedirect").then((m) => ({
    default: m.ProviderIndexRedirect,
  }))
);
const AddProviderServicePage = lazy(() =>
  import("@modules/providers/pages/AddProviderServicePage").then((m) => ({
    default: m.AddProviderServicePage,
  }))
);
const EditProviderServicePage = lazy(() =>
  import("@modules/providers/pages/EditProviderServicePage").then((m) => ({
    default: m.EditProviderServicePage,
  }))
);
const ProviderAccountPage = lazy(() =>
  import("@modules/profile/pages/ProviderAccountPage").then((m) => ({
    default: m.ProviderAccountPage,
  }))
);

// ─── Provider Onboarding Pages ────────────────────────────────────────────────
const OnboardingLoadingPage = lazy(() =>
  import("@modules/providers/onboarding/pages/OnboardingLoadingPage").then(
    (m) => ({ default: m.OnboardingLoadingPage }),
  )
);
const OnboardingAccountPage = lazy(() =>
  import("@modules/providers/onboarding/pages/OnboardingAccountPage").then(
    (m) => ({ default: m.OnboardingAccountPage }),
  )
);
const OnboardingServicesPage = lazy(() =>
  import("@modules/providers/onboarding/components/RegisterStepServices").then(
    (m) => ({ default: m.RegisterStepServices }),
  )
);
const OnboardingDocumentsPage = lazy(() =>
  import("@modules/providers/onboarding/pages/OnboardingDocumentsPage").then(
    (m) => ({ default: m.OnboardingDocumentsPage }),
  )
);
const OnboardingReviewPage = lazy(() =>
  import("@modules/providers/onboarding/pages/OnboardingReviewPage").then(
    (m) => ({ default: m.OnboardingReviewPage }),
  )
);

const AdminLayout = lazy(() =>
  import("@modules/admin/components/layout/AdminLayout").then((m) => ({
    default: m.AdminLayout,
  }))
);
const AdminDashboardPage = lazy(() =>
  import("@modules/admin/pages/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
const AdminProvidersPage = lazy(() =>
  import("@modules/admin/pages/AdminProvidersPage").then((m) => ({
    default: m.AdminProvidersPage,
  }))
);
const AdminProviderDetailsPage = lazy(() =>
  import("@modules/admin/pages/AdminProviderDetailsPage").then((m) => ({
    default: m.AdminProviderDetailsPage,
  }))
);
const AdminUsersPage = lazy(() =>
  import("@modules/admin/pages/AdminUsersPage").then((m) => ({
    default: m.AdminUsersPage,
  }))
);
const AdminUserDetailsPage = lazy(() =>
  import("@modules/admin/pages/AdminUserDetailsPage").then((m) => ({
    default: m.AdminUserDetailsPage,
  }))
);


const AdminReferenceDataPage = lazy(() =>
  import("@modules/admin/pages/AdminReferenceDataPage").then((m) => ({
    default: m.AdminReferenceDataPage,
  }))
);

const CategoriesServicesPage = lazy(() =>
  import("@modules/admin/pages/CategoriesServicesPage").then((m) => ({
    default: m.CategoriesServicesPage,
  }))
);

const AdminPlansPage = lazy(() =>
  import("@modules/admin/pages/AdminPlansPage").then((m) => ({
    default: m.AdminPlansPage,
  }))
);
const AdminSubscriptionsHubPage = lazy(() =>
  import("@modules/admin/pages/AdminSubscriptionsHubPage").then((m) => ({
    default: m.AdminSubscriptionsHubPage,
  }))
);
const AdminRevenuesPage = lazy(() =>
  import("@modules/admin/pages/AdminRevenuesPage").then((m) => ({
    default: m.AdminRevenuesPage,
  }))
);
const AdminNotificationsHubPage = lazy(() =>
  import("@modules/admin/pages/AdminNotificationsHubPage").then((m) => ({
    default: m.AdminNotificationsHubPage,
  }))
);
const AdminAdsHubPage = lazy(() =>
  import("@modules/admin/pages/AdminAdsHubPage").then((m) => ({
    default: m.AdminAdsHubPage,
  }))
);
const AdminCampaignBuilderPage = lazy(() =>
  import("@modules/admin/pages/AdminCampaignBuilderPage").then((m) => ({
    default: m.AdminCampaignBuilderPage,
  }))
);
const AdminSettingsHubPage = lazy(() =>
  import("@modules/admin/pages/AdminSettingsHubPage").then((m) => ({
    default: m.AdminSettingsHubPage,
  }))
);
const AdminAuditLogPage = lazy(() =>
  import("@modules/admin/pages/AdminAuditLogPage").then((m) => ({
    default: m.AdminAuditLogPage,
  }))
);
const AdminComplaintsPage = lazy(() =>
  import("@modules/admin/pages/AdminComplaintsPage").then((m) => ({
    default: m.AdminComplaintsPage,
  }))
);
const AdminProfilePage = lazy(() =>
  import("@modules/admin/pages/AdminProfilePage").then((m) => ({
    default: m.AdminProfilePage,
  }))
);

// ─── Reference Data Playground (temporary NHTSA verification page) ────────────
const ReferencePlaygroundPage = lazy(() =>
  import("@modules/reference/pages/ReferencePlaygroundPage").then((m) => ({
    default: m.ReferencePlaygroundPage,
  }))
);

// ─── Suspense wrapper helper ──────────────────────────────────────────────────

/**
 * Layout-level Suspense + ErrorBoundary wrapper used as a pathless route
 * element. Renders an `<Outlet />` wrapped in `<ErrorBoundary>` and
 * `<Suspense>` so that lazy-loaded child routes show a loading spinner
 * only in the content area, while the parent layout shell stays mounted.
 */
function SuspenseOutlet() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Role-aware root redirect.
 *
 * Reads the current user from the Redux store and redirects to the
 * correct home page via `defaultHomeFor()`.  For unauthenticated
 * visitors the fallback is `/login`.
 */
function RootRedirect() {
  const user = useAppSelector((s) => s.auth.user);
  const target = user ? defaultHomeFor(user.role) : "/login";
  return <Navigate to={target} replace />;
}

/**
 * App routes.
 *
 * Public (guest-only):
 *   /login              - phone entry
 *   /verify-otp         - 6-digit verification
 *   /register           - provider-type chooser
 *   /register/:type     - per-type provider signup (email/password)
 *
 * Authenticated:
 *   /app/*              - customer (or any logged-in user) area
 *     /app/dashboard
 *     /app/vehicles[...]
 *     /app/services        - read-only categories grid
 *     /app/profile
 *
 *   /provider/*         - provider area (role=provider)
 *     /provider/register
 *     /provider/pending
 *     /provider/services
 *     /provider/services/add
 *     /provider/services/:id/edit
 *
 *   /admin/*            - admin area (role=admin)
 *     /admin/providers
 *     /admin/providers/:id
 */
export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },

  // ── Guest routes (login / OTP) ──────────────────────────────────────────
  {
    element: <GuestRoute />,
    children: [
      {
        // Suspense boundary for guest/auth pages — covers login + OTP
        element: <SuspenseOutlet />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/verify-otp", element: <OtpPage /> },
          { path: "/register", element: <RegisterPage /> },
          { path: "/register/:type", element: <RegisterProviderPage /> },
          { path: "/forgot-password", element: <ForgotPasswordPage /> },
          { path: "/reset-password", element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  // ── Protected routes (authenticated users) ──────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      // ===== FROZEN: client/EndUser routes — re-enable when client web app is needed =====
      // Customer / general authenticated area
      // {
      //   path: "/app",
      //   element: <AppLayout />,
      //   children: [
      //     {
      //       // Suspense boundary for all /app/* pages — layout shell stays mounted
      //       element: <SuspenseOutlet />,
      //       children: [
      //         { index: true, element: <Navigate to="dashboard" replace /> },
      //         { path: "dashboard", element: <DashboardPlaceholderPage /> },
      //         { path: "profile", element: <ProfilePage /> },
      //         { path: "services", element: <CategoriesPage /> },
      //         { path: "vehicles", element: <VehiclesListPage /> },
      //         { path: "vehicles/add", element: <AddVehiclePage /> },
      //         { path: "vehicles/:id", element: <VehicleDetailsPage /> },
      //         { path: "vehicles/:id/edit", element: <EditVehiclePage /> },
      //         // Discovery (Sprint 4) — customer-only.
      //         {
      //           element: <RoleGuard allow={["customer", "driver"]} />,
      //           children: [
      //             { path: "services/nearby", element: <NearbyServicesPage /> },
      //             {
      //               path: "services/providers/:id",
      //               element: <ProviderPublicDetailsPage />,
      //             },
      //             { path: "favorites", element: <FavoritesPage /> },
      //           ],
      //         },
      //       ],
      //     },
      //   ],
      // },
      // ===== END FROZEN =====

      // Reference data playground — temporary verification page for NHTSA-backed data.
      {
        path: "/playground/reference",
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ReferencePlaygroundPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },

      // Admin-only notice page — non-admin roles land here while client routes are frozen
      {
        path: "/unavailable",
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AdminOnlyNoticePage />
            </Suspense>
          </ErrorBoundary>
        ),
      },

      // Provider onboarding — full-width layout, no AppLayout chrome
      {
        path: "/provider/onboarding",
        async lazy() {
          const { OnboardingLayout } = await import(
            "@modules/providers/onboarding/components/OnboardingLayout"
          );
          return { Component: OnboardingLayout };
        },
        children: [
          {
            element: <SuspenseOutlet />,
            children: [
              {
                index: true,
                element: <OnboardingLoadingPage />,
                handle: { onboardingStep: "loading" },
              },
              {
                path: "account",
                element: <OnboardingAccountPage />,
                handle: { onboardingStep: "account" },
              },
              {
                path: "services",
                element: <OnboardingServicesPage />,
                handle: { onboardingStep: "services" },
              },
              {
                path: "documents",
                element: <OnboardingDocumentsPage />,
                handle: { onboardingStep: "documents" },
              },
              {
                path: "review",
                element: <OnboardingReviewPage />,
                handle: { onboardingStep: "review" },
              },
            ],
          },
        ],
      },

      // Provider area — any authenticated user can hit /provider/register
      // to upgrade to a provider, but /provider/services etc require role=provider.
      {
        path: "/provider/dealer",
        async lazy() {
          const { DealerLayout } = await import(
            "@modules/dealer/components/layout/DealerLayout"
          );
          return { Component: DealerLayout };
        },
        children: [
          {
            element: <SuspenseOutlet />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              {
                element: <RoleGuard allow={["provider"]} />,
                children: [
                  {
                    async lazy() {
                      const { DealerGuard } = await import("@modules/dealer/guards/DealerGuard");
                      return { Component: DealerGuard };
                    },
                    children: [
                      {
                        path: "dashboard",
                        async lazy() {
                          const { DealerDashboardPage } = await import(
                            "@modules/dealer/pages/DealerDashboardPage"
                          );
                          return { Component: DealerDashboardPage };
                        },
                      },
                      {
                        path: "products",
                        async lazy() {
                          const { DealerProductsPage } = await import(
                            "@modules/dealer/pages/DealerProductsPage"
                          );
                          return { Component: DealerProductsPage };
                        },
                      },
                      {
                        path: "orders",
                        async lazy() {
                          const { DealerOrdersPage } = await import(
                            "@modules/dealer/pages/DealerOrdersPage"
                          );
                          return { Component: DealerOrdersPage };
                        },
                      },
                      {
                        path: "orders/:id",
                        async lazy() {
                          const { DealerOrderDetailPage } = await import(
                            "@modules/dealer/pages/DealerOrderDetailPage"
                          );
                          return { Component: DealerOrderDetailPage };
                        },
                      },
                      {
                        path: "shipments",
                        async lazy() {
                          const { DealerShipmentsPage } = await import(
                            "@modules/dealer/pages/DealerShipmentsPage"
                          );
                          return { Component: DealerShipmentsPage };
                        },
                      },
                      {
                        path: "dues",
                        async lazy() {
                          const { DealerDuesPage } = await import(
                            "@modules/dealer/pages/DealerDuesPage"
                          );
                          return { Component: DealerDuesPage };
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "/provider/workshop",
        async lazy() {
          const { WorkshopLayout } = await import(
            "@modules/workshop/components/layout/WorkshopLayout"
          );
          return { Component: WorkshopLayout };
        },
        children: [
          {
            element: <SuspenseOutlet />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              {
                element: <RoleGuard allow={["provider"]} />,
                children: [
                  {
                    async lazy() {
                      const { WorkshopGuard } = await import("@modules/workshop/guards/WorkshopGuard");
                      return { Component: WorkshopGuard };
                    },
                    children: [
                      {
                        path: "dashboard",
                        async lazy() {
                          const { WorkshopDashboardPage } = await import(
                            "@modules/workshop/pages/WorkshopDashboardPage"
                          );
                          return { Component: WorkshopDashboardPage };
                        },
                      },
                      {
                        path: "conversations",
                        async lazy() {
                          const { WorkshopConversationsPage } = await import(
                            "@modules/workshop/pages/WorkshopConversationsPage"
                          );
                          return { Component: WorkshopConversationsPage };
                        },
                      },
                      {
                        path: "subscription",
                        async lazy() {
                          const { WorkshopSubscriptionPage } = await import(
                            "@modules/workshop/pages/WorkshopSubscriptionPage"
                          );
                          return { Component: WorkshopSubscriptionPage };
                        },
                      },
                      {
                        path: "profile",
                        async lazy() {
                          const { WorkshopProfilePage } = await import(
                            "@modules/workshop/pages/WorkshopProfilePage"
                          );
                          return { Component: WorkshopProfilePage };
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "/provider/scrap",
        async lazy() {
          const { ScrapLayout } = await import(
            "@modules/scrap/components/layout/ScrapLayout"
          );
          return { Component: ScrapLayout };
        },
        children: [
          {
            element: <SuspenseOutlet />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              {
                element: <RoleGuard allow={["provider"]} />,
                children: [
                  {
                    async lazy() {
                      const { ScrapGuard } = await import("@modules/scrap/guards/ScrapGuard");
                      return { Component: ScrapGuard };
                    },
                    children: [
                      {
                        path: "dashboard",
                        async lazy() {
                          const { ScrapDashboardPage } = await import(
                            "@modules/scrap/pages/ScrapDashboardPage"
                          );
                          return { Component: ScrapDashboardPage };
                        },
                      },
                      {
                        path: "part-requests",
                        async lazy() {
                          const { ScrapPartRequestsPage } = await import(
                            "@modules/scrap/pages/ScrapPartRequestsPage"
                          );
                          return { Component: ScrapPartRequestsPage };
                        },
                      },
                      {
                        path: "part-requests/:id",
                        async lazy() {
                          const { ScrapPartRequestDetailPage } = await import(
                            "@modules/scrap/pages/ScrapPartRequestDetailPage"
                          );
                          return { Component: ScrapPartRequestDetailPage };
                        },
                      },
                      {
                        path: "my-offers",
                        async lazy() {
                          const { ScrapMyOffersPage } = await import(
                            "@modules/scrap/pages/ScrapMyOffersPage"
                          );
                          return { Component: ScrapMyOffersPage };
                        },
                      },
                      {
                        path: "conversations",
                        async lazy() {
                          const { ScrapConversationsPage } = await import(
                            "@modules/scrap/pages/ScrapConversationsPage"
                          );
                          return { Component: ScrapConversationsPage };
                        },
                      },
                      {
                        path: "subscription",
                        async lazy() {
                          const { ScrapSubscriptionPage } = await import(
                            "@modules/scrap/pages/ScrapSubscriptionPage"
                          );
                          return { Component: ScrapSubscriptionPage };
                        },
                      },
                      {
                        path: "profile",
                        async lazy() {
                          const { ScrapProfilePage } = await import(
                            "@modules/scrap/pages/ScrapProfilePage"
                          );
                          return { Component: ScrapProfilePage };
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "/provider",
        element: <AppLayout />,
        children: [
          {
            // Suspense boundary for all /provider/* pages
            element: <SuspenseOutlet />,
            children: [
              { index: true, element: <ProviderIndexRedirect /> },
              { path: "register", element: <ProviderRegisterPage /> },
              {
                element: <RoleGuard allow={["provider"]} />,
                children: [
                  { path: "pending", element: <ProviderPendingPage /> },
                  { path: "services", element: <ProviderServicesPage /> },
                  { path: "services/add", element: <AddProviderServicePage /> },
                  {
                    path: "services/:id/edit",
                    element: <EditProviderServicePage />,
                  },
                  { path: "account", element: <ProviderAccountPage /> },
                ],
              },
            ],
          },
        ],
      },

      // Admin area — locked to role=admin only.
      {
        path: "/admin",
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout />
            </Suspense>
          </ErrorBoundary>
        ),
        children: [
          {
            // Suspense boundary for all /admin/* pages
            element: <SuspenseOutlet />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              {
                element: <RoleGuard allow={["admin", "super_admin"]} />,
                children: [
                  { path: "dashboard", element: <AdminDashboardPage /> },
                  {
                    path: "users",
                    element: <PermissionGuard permission="users.view" />,
                    children: [
                      { index: true, element: <AdminUsersPage /> },
                      { path: ":id", element: <AdminUserDetailsPage /> },
                    ],
                  },
                  {
                    path: "providers",
                    element: <PermissionGuard permission="providers.view" />,
                    children: [
                      { index: true, element: <AdminProvidersPage /> },
                      { path: ":id", element: <AdminProviderDetailsPage /> },
                    ],
                  },


                  {
                    // Reference Data — consolidated container (categories + cities)
                    path: "reference",
                    element: <PermissionGuard permission="categories.view" />,
                    children: [
                      { index: true, element: <AdminReferenceDataPage /> },
                    ],
                  },

                  {
                    // Categories & Services — flat categories + category<->service assignment
                    path: "taxonomy",
                    element: <PermissionGuard permission="categories.view" />,
                    children: [
                      { index: true, element: <CategoriesServicesPage /> },
                    ],
                  },

                  {
                    // Subscriptions Hub — consolidated container (plans + provider subscriptions)
                    path: "subscriptions",
                    element: <PermissionGuard permission="subscriptions.view" />,
                    children: [
                      { index: true, element: <AdminSubscriptionsHubPage /> },
                    ],
                  },
                  {
                    path: "revenues",
                    element: <PermissionGuard permission="subscriptions.view" />,
                    children: [
                      { index: true, element: <AdminRevenuesPage /> },
                    ],
                  },
                  {
                    path: "notifications",
                    element: <PermissionGuard permission="notifications.view" />,
                    children: [
                      { index: true, element: <AdminNotificationsHubPage /> },
                    ],
                  },
                  {
                    path: "ads",
                    element: <PermissionGuard permission="ads.view" />,
                    children: [
                      { index: true, element: <AdminAdsHubPage /> },
                      { path: "campaigns/new", element: <AdminCampaignBuilderPage /> },
                      { path: "campaigns/:id", element: <AdminCampaignBuilderPage /> },
                    ],
                  },
                  {
                    path: "settings",
                    element: <PermissionGuard permission="settings.view" />,
                    children: [
                      { index: true, element: <AdminSettingsHubPage /> }
                    ],
                  },
                  {
                    path: "complaints",
                    element: <PermissionGuard permission="complaints.view" />,
                    children: [
                      { index: true, element: <AdminComplaintsPage /> }
                    ],
                  },
                  {
                    path: "audit",
                    element: <PermissionGuard permission="audit.view" />,
                    children: [
                      { index: true, element: <AdminAuditLogPage /> }
                    ],
                  },
                  {
                    // Legacy redirect: /admin/plans → /admin/subscriptions?tab=plans
                    path: "plans",
                    element: <AdminPlansPage />,
                  },
                  {
                    // Legacy redirect: /admin/categories → /admin/reference?tab=categories
                    path: "categories",
                    element: <Navigate to="/admin/reference?tab=categories" replace />,
                  },
                  {
                    // Legacy redirect: /admin/cities → /admin/reference?tab=cities
                    path: "cities",
                    element: <Navigate to="/admin/reference?tab=cities" replace />,
                  },
                  { path: "profile", element: <AdminProfilePage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
