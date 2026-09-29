# Admin feature availability — 2026-09-28

## Evidence and scope

Baseline: `origin/main` `347e466368ddaea5284d792ecaf5a6487c72773b` (PR #76),
branch `fix/admin-production-feature-availability`. The coming-soon refinement
uses HEAD `f82a7b864e47e6a27b64bbf9fba8bdd901f95624` (PR #77), preserving
the existing uncommitted availability work. This is an uncommitted,
patch-only change. Earlier PROJECT_STATE references to pending Coupons work
are historical: Coupons and browser-tab branding are now in main.

Classification is based on current route → component → query → API → mock
handler tracing and the existing backend evidence record. Public Swagger was
fetched on 2026-09-28 from
`https://miqwad-test.runasp.net/swagger/v1/swagger.json`.
No authenticated endpoint, mutation or browser was exercised in this task.
LIVE means the existing integration uses a real contract, not that every
operation was reverified today. Swagger absence alone is not runtime proof
that an endpoint cannot exist.

Paths below are relative to `/api`. Mock files are under
`src/shared/mocks/handlers/`; Admin transport is `admin/api/adminApi.ts`
and its queries are `admin/hooks/useAdminQueries.ts` unless noted otherwise.

## Route and widget classification

| Route / feature / widget                                                                  | Source and endpoint                                                                                                                                                             | Mock dependency / classification                                                | Production action and rationale                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/admin`, `/admin/dashboard`                                                              | AdminDashboardPage                                                                                                                                                              | PARTIAL                                                                         | Keep header, live activity and supported quick actions.                                                                                                                                                                                                      |
| Total users, active providers, pending verification, monthly revenue and their trends     | `getDashboardStats`, `/admin/dashboard/stats`                                                                                                                                   | `admin.handlers.ts` seeded stats; MOCK_ONLY                                     | Hide and do not mount the statistics query. No invented aggregates from user-centric `/Dashboard/me`.                                                                                                                                                        |
| Revenue series, user growth series, provider status chart                                 | Same stats endpoint                                                                                                                                                             | Same seeded series; MOCK_ONLY                                                   | Hide charts and statistical subtitle.                                                                                                                                                                                                                        |
| Recent activity                                                                           | `useAuditLogsQuery`, `/auditlogs`                                                                                                                                               | Real audit adapter; LIVE                                                        | Keep under `audit.view`; loading, success-empty and widget error/retry are distinct. Use Arabic/English summaries.                                                                                                                                           |
| Pending providers widget                                                                  | `useAdminProvidersQuery`, `/admin/providers?status=pending`                                                                                                                     | `providers.handlers.ts`; MOCK_ONLY                                              | Hide and do not mount query.                                                                                                                                                                                                                                 |
| Quick actions                                                                             | QuickActions, navigation only                                                                                                                                                   | STATIC                                                                          | Retain only authorized actions with available destinations; no empty heading when none remain.                                                                                                                                                               |
| `/admin/providers` approvals/reviews                                                      | AdminProvidersPage, `/admin/providers`; approval/rejection/commission `/admin/providers/{id}/…`                                                                                 | `providers.handlers.ts`; MOCK_ONLY                                              | Keep authorized sidebar navigation; show neutral COMING_SOON before queries mount. Keep unsupported quick actions hidden. `/Users` does not supply this approval workflow.                                                                                   |
| `/admin/providers/:id` identity, documents, role-specific profile, approval controls      | AdminProviderDetailsPage, `/ServiceProviders/{id}/profile`, `/Services/categories`, `/admin/providers/{id}/…`                                                                   | Required identity/profile and workflow are mocked; MOCK_ONLY route prerequisite | Inherit Providers COMING_SOON for authorized users; no original detail/query tree mounts. Do not substitute a different identity contract.                                                                                                                   |
| Provider-detail subscription card                                                         | `useProviderSubscriptions`, `/ProviderSubscriptions`, client-side userId match                                                                                                  | LIVE leaf inside unavailable mock-identity detail                               | Current detail cannot render without the mock profile. Keep source intact; no independent supported route is removed. Unknown identity/link semantics need a separate audit before exposing this card standalone. Global live plan management stays visible. |
| `/admin/users`, `/admin/users/:id`                                                        | UsersPanel, details, `/Users`, `/Users/{id}`, activate/deactivate                                                                                                               | PARTIAL list; LIVE details/actions                                              | Keep real roles, filters, pagination, details and deactivate/reactivate.                                                                                                                                                                                     |
| Add ordinary user action/dialog                                                           | `/admin/users` POST                                                                                                                                                             | `admin.handlers.ts`; MOCK_ONLY                                                  | Hide trigger and prevent dialog mounting.                                                                                                                                                                                                                    |
| Add Admin action/dialog                                                                   | `/Users` POST                                                                                                                                                                   | LIVE                                                                            | Preserve existing Admin authorization. No live write probe in this task.                                                                                                                                                                                     |
| `/admin/addresses`                                                                        | AddressesPage, addresses API `/Addresses`; `/Users` name lookup                                                                                                                 | LIVE                                                                            | Keep list/cards/dialogs and real loading/error/empty behavior.                                                                                                                                                                                               |
| `/admin/orders`                                                                           | OrdersPage, orders API `/Orders` and detail                                                                                                                                     | LIVE                                                                            | Keep existing read contract and supported interactions unchanged.                                                                                                                                                                                            |
| `/admin/coupons`                                                                          | AdminCouponsPage, Coupons API `/Coupons`, detail/toggle-active                                                                                                                  | LIVE                                                                            | Preserve PR #76, permissions and existing contracts.                                                                                                                                                                                                         |
| `/admin/invoices`, `/admin/invoices/:id`                                                  | Invoice pages/API `/Invoices`, `/Invoices/{id}`                                                                                                                                 | LIVE                                                                            | Preserve rich read-only invoice contract and financial presentation.                                                                                                                                                                                         |
| `/admin/reference`                                                                        | AdminReferenceDataPage                                                                                                                                                          | PARTIAL                                                                         | Retain live categories and brands/models; unsupported tab deep links fall back to categories without mounting them.                                                                                                                                          |
| Reference category roots / CRUD                                                           | CategoryTree + parent category hooks, `/Categories`                                                                                                                             | LIVE portion                                                                    | Render real parents independently of mocked descendants; preserve add/edit/delete and real error/retry.                                                                                                                                                      |
| Reference legacy hierarchical descendants, provider scopes, child creation, activation    | `/Services/categories`, `/admin/categories`                                                                                                                                     | `providers.handlers.ts`; MOCK_ONLY                                              | Disable query, ignore cached mock rows, hide unsupported scope/actions. No live hierarchy is deleted: real service hierarchy remains in taxonomy.                                                                                                            |
| Reference cities                                                                          | CitiesPanel, `/admin/cities`                                                                                                                                                    | `providers.handlers.ts`; MOCK_ONLY                                              | Hide tab; `/admin/cities` legacy URL redirects safely. Static KSA lookup is not a city-management API.                                                                                                                                                       |
| Reference priced services                                                                 | ServicesPanel, `/admin/services`, legacy category lookup                                                                                                                        | `admin.handlers.ts` and providers handler; MOCK_ONLY                            | Hide tab. Real taxonomy Service and provider offering are different domains.                                                                                                                                                                                 |
| Reference brands/models                                                                   | BrandsModelsPanel, vehicles APIs `/Brands`, `/Models`, `/Brands/{id}/models`                                                                                                    | LIVE                                                                            | Keep current CRUD/relationships and permissions.                                                                                                                                                                                                             |
| `/admin/categories` legacy alias                                                          | Redirect to reference categories                                                                                                                                                | PARTIAL                                                                         | Retain alias to supported category roots.                                                                                                                                                                                                                    |
| `/admin/taxonomy` categories, assignments and service tree                                | CategoriesServicesPage, CategoryListPanel, CategoryServicesPanel, ServicesTreePanel; `/Categories`, `/Categories/{id}/services`, `/Services`, children/categories relationships | LIVE                                                                            | Keep real taxonomy and its CRUD; unchanged.                                                                                                                                                                                                                  |
| `/admin/attachments` list/cards/upload/replace/delete                                     | AttachmentsPage, attachments API `/attachments`                                                                                                                                 | LIVE                                                                            | Keep existing contract and distinct errors/empty state.                                                                                                                                                                                                      |
| `/admin/subscriptions` plan list/detail/CRUD/activate                                     | AdminSubscriptionsPage, subscription hooks, `/SubscriptionPlans`                                                                                                                | PARTIAL page; LIVE plans                                                        | Keep plans unchanged.                                                                                                                                                                                                                                        |
| Provider subscriptions tab placeholder                                                    | Explicit Stage-3 informational content, no business rows                                                                                                                        | STATIC                                                                          | Keep honest existing placeholder; no fake subscriptions or new integration.                                                                                                                                                                                  |
| `/admin/revenues` KPIs, source filters, table                                             | AdminRevenuesPage, `/admin/revenues`                                                                                                                                            | `admin.handlers.ts` seeded revenue; MOCK_ONLY                                   | Keep authorized navigation with COMING_SOON; no page/query mounts. `/transaction` is not automatically an equivalent revenue contract.                                                                                                                       |
| `/admin/notifications` templates, send, history                                           | `/admin/notification-templates`, `/admin/notifications/send`, `/admin/notifications`                                                                                            | `admin.notifications.handlers.ts`; MOCK_ONLY                                    | Keep authorized navigation with COMING_SOON; hide quick actions. Device-token and diagnostic broadcast endpoints do not implement this workflow.                                                                                                             |
| `/admin/ads`                                                                              | AdminAdsHubPage → AdminAdvertisementsPage; `/Advertisement`                                                                                                                     | LIVE                                                                            | Keep existing advertisements and quick action.                                                                                                                                                                                                               |
| `/admin/complaints` list/detail/status                                                    | `/admin/complaints` and status endpoint                                                                                                                                         | `admin.complaints.handlers.ts`; MOCK_ONLY                                       | Keep authorized navigation with COMING_SOON; preserve future components without mounting them.                                                                                                                                                               |
| `/admin/audit` filters/table/detail/CSV                                                   | AdminAuditLogPage, `/auditlogs`                                                                                                                                                 | LIVE; CSV derived from loaded records                                           | Keep real request failures visible. Existing filtering is page-local where documented.                                                                                                                                                                       |
| `/admin/settings` general/contact/flags                                                   | `/admin/settings` and section writes                                                                                                                                            | `admin.settings.handlers.ts`; MOCK_ONLY                                         | Keep authorized navigation with COMING_SOON; hide quick actions. The current form contract is not wired to `/system-settings`.                                                                                                                               |
| `/admin/profile` account/image/password/phone actions                                     | AdminProfilePage; `/profile`, `/profile/image`, reset-password and phone verification                                                                                           | LIVE                                                                            | Keep existing account behavior and topbar profile/logout; no change.                                                                                                                                                                                         |
| Candidate aggregate Dashboard, system-settings replacement, provider approval replacement | Swagger `/Dashboard/me`, `/system-settings`; alternative approval contract not established                                                                                      | UNKNOWN for these UI mappings                                                   | No speculative replacement integrations. Audit domain semantics and runtime responses separately.                                                                                                                                                            |

## Availability, permissions and environments

`admin/config/featureCapabilities.ts` is the typed source of availability;
`adminRoutes` connects sidebar/direct URLs to capabilities and existing route
permissions. LIVE, PARTIAL and intentional STATIC content remain available.
MOCK_ONLY implementations still require explicit development mocks. Route
presentation is independent: Providers, Revenues, Notifications, Complaints and
Settings use COMING_SOON only in production when unavailable, so their authorized sidebar entries
remain clickable in their original order. Other unavailable routes default to
HIDDEN in production. UNKNOWN fails closed pending audit. Local development
passes known routes through to their original pages and normal RBAC, never
substituting AdminFeatureUnavailablePage. Sidebar route visibility is separate
from widget/action availability: local route access does not enable mocks or
restore gated partial-page widgets. No status depends on network failures or query results.

`shared/config/mockMode.ts` resolves
`DEV && (VITE_ENABLE_MOCKS ?? VITE_USE_MOCKS) === "true"`.
The new flag takes precedence, even when false. The old flag is a compatible
alias only when the new flag is absent. Missing flags mean mocks OFF.
Production is always OFF, even with a true flag. Restart Vite after changing
flags. No environment files are changed by this patch.

The old development adapter unconditionally intercepted admin/catalog/provider
prefixes even when mocks were disabled. That bypass is removed. Explicitly
enabled development retains the same handler routing; disabled development
now uses real transport without simulated latency. This shared flag also
controls provider mock handlers, but no Dealer/Scrap code or live contracts
are changed. Mock components/handlers remain available for development.

RBAC is independent: existing RoleGuard/PermissionGuard stay in place. Sidebar
uses `isAdminRouteVisible` AND the existing route permission. Quick actions
and widgets still use `isAdminFeatureAvailable`, never route visibility.
The five selected routes remain MOCK_ONLY, not STATIC or LIVE.

AdminFeatureGuard sits above the existing role/permission tree. For production COMING_SOON
it checks authenticated Admin/super_admin identity and the route permission
before returning the neutral page. Unauthorized visitors continue into the
existing guards for login, wrong-role redirect or permission-denied handling;
the original feature page remains protected. Authorized visitors receive the
fallback without mounting children, including `/admin/providers/:id`.
Other unavailable routes in production still redirect to `/admin/dashboard` with replace.

The unavailable page uses neutral tokens, a static Lucide icon, a Coming soon
badge and three Arabic/English i18n keys. It has no retry, loading animation,
fake data or technical mock/backend language. No sidebar badge was added.
Partial-page gates, LIVE errors/retry, live category roots and cached mock-row
exclusion are unchanged. No new API request or dependency was introduced.

## Original availability validation (before this refinement)

- `npm run typecheck`: PASS.
- Focused ESLint: FAIL with 43 existing `react-refresh/only-export-components`
  errors in `src/app/router.tsx`. Rule/message sets exactly match this file at
  the base SHA. All other changed source files pass; no new lint findings.
- Focused Prettier: PASS. Formatting is confined to changed files.
- `npm run build`: PASS. Warnings: npm environment `http-proxy` setting and
  a bundle chunk larger than 500 kB. No dependency changes were made.
- `git diff --check`: PASS.
- Nine temporary offline check groups pass: 24 environment combinations,
  status rules, deep links, redirect guard, Dashboard query ownership and
  error/empty/RBAC rendering, quick actions, unsupported reference tabs,
  live category roots with stale/failed mock cache, and mock transport opt-in
  with real-request fallthrough. These are isolated checks with test doubles,
  not browser or authenticated backend validation. No test script exists in
  package.json; no test framework was added.

## Coming-soon refinement validation

- Production-only matrix: isolated rendering checks pass for DEV mocks ON,
  DEV mocks OFF, and production with either flag value, including nested
  provider detail, original-page mount prevention in production, unchanged
  widget gates, unknown/HIDDEN routes, and existing role/permission guards.
  Browser/preview visual and network-panel QA remains a user gate.

- Typecheck, production build, focused ESLint/Prettier on this refinement's
  source files and `git diff --check`: PASS.
- Build retains the npm `http-proxy` environment warning and >500 kB chunk
  warning. No packages or lint configuration changed.
- Isolated React server-render checks passed for route visibility versus
  availability, five main routes and provider detail, mock-on passthrough,
  prevention of original page mounting, actual RoleGuard/PermissionGuard
  composition, denied permission and unauthenticated/wrong-role cases,
  retained live routes, all 17 sidebar items with permissions, and neutral UI.
  These used test doubles and are not browser or live API verification.
- Earlier implementation outside the seven refinement files and the original
  safety patch were verified unchanged. No new commit or push was made.

## Manual QA — coming-soon refinement (user required)

1. Run `npm run build` then `npm run preview` and sign in as Admin. Mocks are
   always disabled in this production build. Subject to RBAC,
   all 17 original top-level entries remain: Dashboard, Providers, Users,
   Addresses, Orders, Coupons, Invoices, Reference, Taxonomy, Attachments,
   Subscriptions, Revenues, Notifications, Ads, Complaints, Audit and Settings.
2. Open `/admin/providers`, `/admin/revenues`, `/admin/notifications`,
   `/admin/complaints`, `/admin/settings` and `/admin/providers/123`.
   Each displays neutral Coming soon content, no red error, Retry, original
   page or mock-only network request. Test restricted permissions and wrong
   roles too: existing authorization responses must still apply.
3. Dashboard: mock statistics, charts, pending providers and unsupported quick
   actions remain absent. Live recent activity stays. Simulate a real audit
   failure: widget error and Retry must remain, not Coming soon or empty data.
4. Verify `/admin/users`, `/admin/addresses`, `/admin/orders`, `/admin/coupons`,
   `/admin/invoices`, `/admin/ads`, `/admin/audit` continue normally, including
   real empty and real error states. Ordinary mock Add User remains hidden;
   live Add Admin and deactivate/reactivate keep their existing permissions.
5. Reference cities/services tab deep links fall back to Categories; live
   categories/brands remain and legacy tree actions stay hidden. `/admin/cities`
   still redirects safely. Live taxonomy services remain available.
6. With `VITE_ENABLE_MOCKS=true` and `npm run dev`, the five original mock
   pages mount normally and Coming soon is absent. Repeat with the flag false:
   original pages still mount, but requests use real transport, so unsupported
   endpoints may produce normal request errors. This dev-only mode is not a
   promise of a working backend. Partial-page gates remain unchanged. No mocks
   are implicitly enabled. Explicit false overrides the legacy true flag;
   production always disables mocks regardless of flags.
7. Check Arabic RTL and English LTR, keyboard navigation and narrow layouts.
   The fixed 260px Admin sidebar is an existing limitation, not redesigned.

## Limits

This audit does not establish replacement contracts for approvals, platform
aggregates or settings. Their Swagger candidates require a separate live
contract task. No new API integration, live write, browser automation,
dependency, commit, push or merge is included. User visual QA remains required.
