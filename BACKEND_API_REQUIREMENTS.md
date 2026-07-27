# Maqwad — Backend API Requirements (Provider & Admin Dashboards)

> **Derived from:** `src/modules/*/api/*.ts`, `src/modules/*/types.ts`, `src/shared/mocks/handlers/*.ts`
> **Date:** 2026-06-28 | **Frontend stack:** React 19 + TypeScript (strict) | **Target backend:** .NET (Miqwad API)
> **Rule:** Every field name, type, and path in this document is quoted directly from the frontend source — nothing is invented.

---

## 1. Executive Summary

The existing .NET backend (`miquad-api`) is **customer-facing**. It covers the consumer app (Vehicles, Lookups, Orders, Products/storefront, Appointments, TowTrips, Reviews, Conversations) and a minimal provider-approval surface (approve/reject/suspend). The provider dashboards (Dealer, Workshop, Scrap) and the full Admin panel are built on the frontend but have **zero backend support** today.

| Area | Total Endpoints Needed | Currently EXISTS | Missing / Partial |
|------|----------------------|-----------------|-------------------|
| Auth & Users | 10 | 7 (EXISTS) | 3 MISSING |
| Provider Onboarding | 8 | 4 PARTIAL | 4 MISSING |
| Dealer Dashboard | 14 | 0 | 14 MISSING |
| Workshop Dashboard | 4 | 0 | 4 MISSING |
| Scrap Dashboard | 10 | 0 | 10 MISSING |
| Admin Panel | 51 | 3 PARTIAL | 48 MISSING |
| Discovery (customer) | 5 | 0 | 5 MISSING |
| Services / Lookups | 5 | 3 EXISTS | 2 MISSING |
| **TOTAL** | **107** | **~17 (16%)** | **~90 (84%)** |

**Core gap:** The backend is customer-facing. The 84% of missing endpoints are entirely provider- and admin-domain. The three provider types (dealer/workshop/scrap) each need their own namespaced endpoint family. The Scrap module introduces a net-new **Escrow** domain that does not exist anywhere in the current backend. The Admin panel requires ~49 endpoints spanning users, providers, subscriptions, revenues, ads, audit logs, complaints, notifications, and system settings.

---

## 2. Global / Cross-Cutting Requirements

### 2.1 Response Envelope

The frontend expects:

```typescript
// List endpoints
interface PaginatedResponse<T> {
  items: T[];
  page: number;        // 1-based
  pageSize: number;
  total: number;       // total record count
  totalPages: number;  // Math.ceil(total / pageSize)
}

// Single resource endpoints — return the object directly (no wrapper)
// e.g. GET /dealer/products/{id} → Product (not { data: Product })

// Error envelope
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;     // stable machine-readable code e.g. "NOT_FOUND"
    message: string;  // human-readable
    fields?: Record<string, string[]>; // validation errors per field
  };
}
```

> **Decision needed:** The frontend currently expects either a bare `T` or `PaginatedResponse<T>`. If the backend wraps responses in `{ success: true, data: T }`, a response-interceptor adapter is required in `src/shared/lib/axios.ts`. **Recommended:** backend emits bare responses and uses HTTP status codes for error signalling.

### 2.2 Field Casing

- **Frontend:** camelCase fields + camelCase string enum values (`"active"`, `"dealer"`, `"monthly"`)
- **Current backend:** likely PascalCase (`"Active"`, `"Dealer"`, `"Monthly"`)

**Options (DECISION NEEDED):**
1. Backend emits camelCase JSON (via `JsonNamingPolicy.CamelCase` in .NET) — **recommended, no FE change needed**
2. Frontend adds a global Axios response interceptor to convert PascalCase → camelCase — adds maintenance burden

### 2.3 ID Strategy

- Frontend types use `id: string` (UUID) for all new domain entities (products, orders, subscriptions, etc.)
- Legacy provider IDs (`providerId`, `workshopId`, `scrapId`, `dealerId`) are `number` — this mirrors the existing Swagger where `ServiceProviders/{id}` uses an integer PK
- **Backend owns ID generation** — the frontend never mints IDs for persisted entities
- Mock-invented IDs to replace with real UUIDs: `"prod_001"`, `"ord_001"`, `"shp_001"`, `"sub_ws_001"`, `"pr_001"`, `"esc_001"`, `"cmp_001"`

### 2.4 Money

All monetary amounts are `number` (SAR). Currency is implicit (platform is SAR-only). No `currency` field is stored per record — the response contract assumes SAR.

### 2.5 Dates

All date/datetime fields are ISO-8601 strings (e.g., `"2026-06-28T14:30:00Z"`). Date-only fields (e.g., `registrationDate`) use `"YYYY-MM-DD"`.

### 2.6 Auth — OTP vs Password (CRITICAL RECONCILIATION NEEDED)

The frontend uses a **phone + OTP** flow with no password:

```
POST /auth/register   { phoneNumber: string }  → { verificationId, resendAfter }
POST /auth/verify-otp { verificationId, code } → { accessToken, refreshToken, user }
```

The existing backend login reportedly uses `emailOrPhone + password`. This is a **hard incompatibility**:

> **Question for backend team:** Is OTP login already implemented on `/auth/register` + `/auth/verify-otp`? If not, this is the single highest-priority auth change. The provider/admin dashboards are entirely OTP-gated; there is no password field in any frontend form or type.

All protected endpoints require `Authorization: Bearer <accessToken>`. Role enforcement:
- `customer` — can access Discovery, Vehicles, Favorites
- `provider` + `providerStatus: "approved"` — can access their type-specific provider dashboard
- `admin` / `super_admin` — can access `/admin/*`

### 2.7 Provider Type Enum Mapping

The frontend's `ProviderType = "dealer" | "workshop" | "scrap"` must map to backend enum names:

| Frontend value | Suggested backend enum | Notes |
|---------------|----------------------|-------|
| `"dealer"` | `PartsVendor` (existing?) or `Dealer` | Confirm with backend team |
| `"workshop"` | `Workshop` | Likely exists |
| `"scrap"` | `ScrapYard` or `Scrap` | Likely new |

The `User.role` values `"customer" | "provider" | "driver" | "admin" | "super_admin"` must map to backend roles accordingly.

### 2.8 `WorkshopStats` — Note

The workshop dashboard (`WorkshopStats`) has only two KPIs today (`rating`, `activeServicesCount`) — conversations KPI is deferred. No dedicated stats endpoint was added to `workshopApi.ts` yet; the dashboard reads these from the profile. **However**, the scrap module has a dedicated `GET /scrap/stats` returning `ScrapStats`. The dealer module currently has no stats endpoint (the dashboard uses product/order counts from paginated responses). This is consistent with each module's current implementation.

### 2.9 CORS — Missing (blocks all real-backend calls from the browser)

CORS is not enabled on the backend. `OPTIONS /api/auth/login` returns `405 Method Not Allowed` with `Allow: POST` and no `Access-Control-Allow-Origin` header, so the browser blocks the preflight before the real request is ever sent. This affects every real (non-mocked) endpoint called from the dev origin (`http://localhost:5173`), not just login.

**Backend fix needed (ASP.NET Core):** register a CORS policy allowing the dev origin with `AllowAnyHeader().AllowAnyMethod()`, and place `app.UseCors(...)` **before** `UseAuthorization()` / `MapControllers()` in the middleware pipeline.

**Frontend workaround (temporary, dev-only):** a Vite dev-server proxy (`vite.config.ts` → `server.proxy["/api"]`) forwards `/api/*` to the backend server-side, so the browser only talks to `localhost:5173` (same-origin, no preflight) and Vite relays server-to-server (no CORS involved). This is opted into locally via `.env` (`VITE_API_BASE_URL=/api`) and **will not help in production** — it only works because the Vite dev server sits in between. Remove the proxy and revert `.env` once the backend enables CORS.

---

## 3. Per-Module Endpoint Tables

### 3.1 Auth & Users

| # | Method | Path | Purpose | Request (key fields) | Response (key fields) | Screen | Status |
|---|--------|------|---------|--------------------|--------------------|--------|--------|
| A1 | POST | `/auth/register` | Send OTP to phone | `phoneNumber: string` | `{ verificationId: string, resendAfter: number }` | Login / Register | **EXISTS** |
| A2 | POST | `/auth/verify-otp` | Verify OTP, issue tokens | `{ verificationId, code }` | `{ accessToken, refreshToken, user: User }` | OTP Entry | **EXISTS** |
| A3 | POST | `/auth/refresh-token` | Renew access token | `{ refreshToken }` (body or cookie) | `{ accessToken, refreshToken }` | Axios interceptor (silent) | **EXISTS** |
| A4 | POST | `/auth/logout` | Invalidate session | — | `{ success: true }` | Any screen | **EXISTS** |
| A5 | GET | `/users/me` | Get current user profile | — | `User` | App bootstrap / Nav | **EXISTS** |
| A6 | PUT | `/users/me` | Update name / email / role | `{ fullName, email?, role }` | `User` | Profile complete step | **EXISTS** |
| A7 | POST | `/users/me/avatar` | Upload avatar image | `FormData: file` (multipart) | `User` (with updated `avatarUrl`) | Profile settings | **EXISTS** |
| A8 | GET | `/onboarding/account-summary` | Get post-registration account info | — | `{ accountType, ownerName, email, phone }` | Onboarding step 1 | **MISSING** |
| A9 | POST | `/onboarding/documents` | Upload KYC docs during onboarding | `FormData: file` + doc kind | `{ fileId: string, fileName: string }` | Onboarding step 2 | **MISSING** |
| A10 | POST | `/onboarding/submit-review` | Submit provider application for admin review | — | `{ submittedAt: string }` | Onboarding step 3 | **MISSING** |
| A11 | GET | `/onboarding/review-status` | Poll application review state | — | `ReviewTimelineItem[]` (array of `{ id, state: "done"\|"active"\|"pending" }`) | Pending approval page | **MISSING** |

**`User` type** (all fields the frontend reads from this endpoint):
```typescript
{
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: "customer" | "provider" | "driver" | "admin" | "super_admin";
  avatarUrl: string | null;
  isProfileComplete: boolean;
  providerId?: number | null;        // set when role === "provider"
  providerStatus?: "pending" | "approved" | "rejected" | null;
  providerRejectionReason?: string | null;
  permissions?: string[];            // RBAC codes; super_admin gets ["*"]
}
```

---

### 3.2 Providers / Onboarding

| # | Method | Path | Purpose | Request (key fields) | Response (key fields) | Screen | Status |
|---|--------|------|---------|--------------------|--------------------|--------|--------|
| P1 | POST | `/ServiceProviders/register` | Register new provider | `RegisterProviderRequest` (see below) | `ProviderProfile` | Provider onboarding wizard | **EXISTS** |
| P2 | GET | `/ServiceProviders/{id}/profile` | Get provider profile by numeric ID | — | `ProviderProfile` | Admin review drawer; customer discovery | **EXISTS** |
| P3 | POST | `/ServiceProviders/{id}/documents` | Attach KYC documents to existing provider | `{ documents: ProviderDocument[] }` | `ProviderProfile` | Onboarding doc upload | **PARTIAL** (not confirmed in Swagger) |
| P4 | GET | `/provider/me` | Get the calling provider's own profile (no ID needed — derived from JWT) | — | `ProviderProfile` | Provider dashboard bootstrap | **MISSING** |
| P5 | GET | `/providers/{id}/services` | List services offered by provider | — | `ProviderService[]` | Provider profile; customer discovery | **EXISTS** |
| P6 | POST | `/providers/{id}/services` | Add a service | `CreateProviderServiceRequest` | `ProviderService` | Provider service management | **PARTIAL** (mocked) |
| P7 | PUT | `/providers/{id}/services/{serviceId}` | Update a service | `UpdateProviderServiceRequest` | `ProviderService` | Provider service management | **PARTIAL** (mocked) |
| P8 | DELETE | `/providers/{id}/services/{serviceId}` | Remove a service | — | `void` | Provider service management | **PARTIAL** (mocked) |

**`RegisterProviderRequest`:**
```typescript
{
  companyName: string;
  email: string;
  phone: string;
  password: string;      // ⚠ Only field requiring reconciliation vs OTP flow
  lat?: number | null;
  lng?: number | null;
  address?: string;
  city?: string;
  workingHours?: string;
  categoryIds?: number[];
  documents?: Array<{ type: "commercial"|"tax"|"identity", fileName: string, fileSize: number }>;
}
```

**`ProviderProfile`** (all fields read by admin review and provider pages):
```typescript
{
  id: number;
  type: "dealer" | "workshop" | "scrap";
  userId: string;
  companyName: string; email: string; phone: string;
  lat: number | null; lng: number | null; address: string | null; city: string | null;
  workingHours: string | null;
  rating: number; totalRatings: number; isVerified: boolean;
  status: "pending" | "approved" | "rejected";
  categoryIds: number[];
  documents: ProviderDocument[];      // KYC docs
  rejectionReason: string | null;
  createdAt: string;
  commissionRate?: number;
  photos?: string[];
  specialization?: string;
  brandSpecialization?: string[];
  monthlySales?: number;
  productCategories?: string[];
  productsCount?: number;
  inventoryCount?: number;
}
```

---

### 3.3 Dealer Dashboard

All endpoints are **MISSING**. Auth requirement: `provider` role + `providerStatus: "approved"` + provider type `"dealer"`. The `dealerId` is derived from the JWT (no need for the client to send it in the path for self-owned resources).

| # | Method | Path | Purpose | Request (key fields) | Response (key fields) | Screen | Status |
|---|--------|------|---------|--------------------|--------------------|--------|--------|
| D1 | GET | `/dealer/products` | List dealer's products (paginated) | `?page, pageSize, status?, search?, categoryId?` | `PaginatedResponse<Product>` | قائمة المنتجات (Products list) | **MISSING** |
| D2 | GET | `/dealer/products/{id}` | Get single product | — | `Product` | Product detail drawer | **MISSING** |
| D3 | POST | `/dealer/products` | Create product | `Product` (omit `id`, `dealerId`, `createdAt`, `updatedAt`) | `Product` | Add product dialog | **MISSING** |
| D4 | PATCH | `/dealer/products/{id}` | Update product fields | `Partial<Product>` | `Product` | Edit product dialog | **MISSING** |
| D5 | DELETE | `/dealer/products/{id}` | Delete product | — | `void` | Product list | **MISSING** |
| D6 | PATCH | `/dealer/products/{id}/status` | Change product status | `{ status: ProductStatus }` | `Product` | Status toggle in table | **MISSING** |
| D7 | GET | `/dealer/orders` | List dealer's orders (paginated) | `?page, pageSize, status?, search?` | `PaginatedResponse<Order>` | الطلبات (Orders page) | **MISSING** |
| D8 | GET | `/dealer/orders/{id}` | Get single order with items | — | `Order` | Order detail drawer | **MISSING** |
| D9 | PATCH | `/dealer/orders/{id}/status` | Update order status | `{ status: OrderStatus }` | `Order` | Order status flow | **MISSING** |
| D10 | POST | `/dealer/orders/{id}/ship` | Mark order as shipped, attach tracking | `{ carrier?: string, trackingNumber?: string }` | `Order` | Ship action in order list | **MISSING** |
| D11 | POST | `/dealer/orders/{id}/cancel` | Cancel an order | `{ reason?: string }` | `Order` | Cancel action | **MISSING** |
| D12 | GET | `/dealer/shipments` | List shipments (paginated) | `?page, pageSize, status?` | `PaginatedResponse<Shipment>` | الشحنات (Shipments page) | **MISSING** |
| D13 | PATCH | `/dealer/shipments/{id}/status` | Update shipment status | `{ status: ShipmentStatus }` | `Shipment` | Shipment management | **MISSING** |
| D14 | GET | `/dealer/dues` | Get dealer financial summary | — | `DealerDues` | المستحقات (Dues page) | **MISSING** |

**Domain types:**

```typescript
type ProductCondition = "new";
type ProductStatus = "active" | "draft" | "out_of_stock" | "archived";

interface Product {
  id: string; dealerId: string;
  nameAr: string; nameEn: string;
  sku: string; categoryId: string;
  price: number;              // SAR
  condition: ProductCondition;
  status: ProductStatus;
  stockQty: number;
  images?: string[];
  descriptionAr?: string; descriptionEn?: string;
  createdAt: string; updatedAt: string;
}

type OrderStatus = "new" | "preparing" | "shipped" | "delivered" | "cancelled";

interface OrderItem {
  productId: string; nameAr: string; nameEn: string;
  sku: string; unitPrice: number; qty: number; lineTotal: number;
}

interface Order {
  id: string; dealerId: string;
  customerName: string; customerPhone?: string;
  items: OrderItem[];
  subtotal: number; commissionRate: number; commissionAmount: number; netToDealer: number;
  status: OrderStatus;
  shipmentId?: string;
  createdAt: string; updatedAt: string;
}

type ShipmentStatus = "pending" | "in_transit" | "delivered" | "returned";

interface Shipment {
  id: string; orderId: string; dealerId: string;
  carrier?: string; trackingNumber?: string;
  status: ShipmentStatus;
  shippedAt?: string; deliveredAt?: string;
  createdAt: string; updatedAt: string;
}

interface DealerDues {
  dealerId: string;
  commissionRate: number;    // current % set by admin (read-only to dealer)
  grossSales: number;        // SAR total of delivered orders
  totalCommission: number;   // SAR owed to platform
  netEarnings: number;       // SAR = gross - commission
  outstandingDebt: number;   // SAR current balance
  debtAlert: boolean;        // true if outstandingDebt > 500
  updatedAt: string;
}
```

---

### 3.4 Workshop Dashboard

All endpoints are **MISSING**. Auth: `provider` role + approved + type `"workshop"`. Caller identity derived from JWT (`workshopId` extracted server-side).

| # | Method | Path | Purpose | Request (key fields) | Response (key fields) | Screen | Status |
|---|--------|------|---------|--------------------|--------------------|--------|--------|
| W1 | GET | `/workshop/profile` | Get workshop's own profile | — | `WorkshopProfile` | الملف الشخصي (Profile page) + Dashboard hero | **MISSING** |
| W2 | PUT | `/workshop/profile` | Update workshop profile | `Partial<WorkshopProfile>` (see below) | `WorkshopProfile` | Edit profile form | **MISSING** |
| W3 | GET | `/workshop/subscription` | Get current subscription | — | `WorkshopSubscription` | الاشتراك (Subscription page) | **MISSING** |
| W4 | POST | `/workshop/subscription/renew` | Renew subscription (extends `endDate` by billing cycle) | — | `WorkshopSubscription` | Renew button on Subscription page | **MISSING** |

**Domain types:**

```typescript
type DayOfWeek = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
interface DayHours { isClosed: boolean; open?: string; close?: string; } // "HH:mm"
type WeeklyHours = Record<DayOfWeek, DayHours>;

type WorkshopServiceType = "mechanical" | "bodywork" | "electrical" | "tires" | "periodicMaintenance";
type WorkshopVehicleBrand = "toyota" | "hyundai" | "mercedes" | "ford" | "chevrolet" | "nissan" | "bmw" | "other";

interface WorkshopSpecializations {
  serviceTypes: WorkshopServiceType[];
  vehicleBrands: WorkshopVehicleBrand[];
}

interface WorkshopProfile {
  workshopId: number;
  companyName: string; email: string;
  phone: string; address: string | null; city: string | null;
  workingHoursLabel?: string | null;   // display string (legacy, keep for compat)
  specializationLabel?: string | null; // display string (legacy)
  bannerUrl?: string;
  photos: string[];                    // gallery URLs
  location?: { lat: number; lng: number; address: string; city: string };
  workingHours: WeeklyHours;           // structured schedule
  specializations: WorkshopSpecializations;
  contact: { phone: string; whatsapp?: string };
  rating: number; totalRatings: number; isVerified: boolean;
  updatedAt: string;
}

type WorkshopSubscriptionStatus = "active" | "pending" | "expired" | "cancelled";
type WorkshopBillingCycle = "monthly" | "yearly";

interface WorkshopSubscription {
  id: string; workshopId: number;
  planName: string; price: number; billingCycle: WorkshopBillingCycle;
  status: WorkshopSubscriptionStatus;
  startDate: string; endDate: string;
  privileges: { topListing: boolean; freeInspectionOffers: boolean };
  renewedAt?: string;
}
```

---

### 3.5 Scrap Dashboard

All endpoints are **MISSING**. Auth: `provider` role + approved + type `"scrap"`. `scrapId` derived from JWT.

> **⚠ ESCROW DOMAIN:** This is entirely new. The backend has no Escrow entity. See Section 6 for the full domain model design requirements.

| # | Method | Path | Purpose | Request (key fields) | Response (key fields) | Screen | Status |
|---|--------|------|---------|--------------------|--------------------|--------|--------|
| S1 | GET | `/scrap/profile` | Get scrap provider's own profile | — | `ScrapProfile` | الملف الشخصي (Profile page) | **MISSING** |
| S2 | PUT | `/scrap/profile` | Update profile | `Partial<ScrapProfile>` | `ScrapProfile` | Edit profile form | **MISSING** |
| S3 | GET | `/scrap/subscription` | Get current subscription | — | `ScrapSubscription` | الاشتراك (Subscription page) | **MISSING** |
| S4 | POST | `/scrap/subscription/renew` | Renew subscription | — | `ScrapSubscription` | Renew button | **MISSING** |
| S5 | GET | `/scrap/stats` | Dashboard KPI summary | — | `ScrapStats` | لوحة التحكم (Dashboard hero cards) | **MISSING** |
| S6 | GET | `/scrap/part-requests` | List part requests visible to this scrap provider | `?page, pageSize, status?, search?` | `PaginatedResponse<PartRequest>` | طلبات القطع (Part Requests page) | **MISSING** |
| S7 | GET | `/scrap/part-requests/{id}` | Get single part request detail | — | `PartRequest` | Request detail drawer | **MISSING** |
| S8 | POST | `/scrap/part-requests/{id}/offer` | Submit a price offer on a request | `{ price: number, note?: string, photos?: string[] }` | `PartRequest` (updated) | Submit offer dialog | **MISSING** |
| S9 | PATCH | `/scrap/part-requests/{id}/status` | Update part request status (e.g. mark shipped) | `{ status: PartRequestStatus }` | `PartRequest` | Status action in detail | **MISSING** |
| S10 | GET | `/scrap/escrow/{partRequestId}` | Get escrow record for a part request | — | `Escrow` | Escrow status in request detail | **MISSING** |

**Domain types:**

```typescript
type ScrapVehicleBrand = "toyota" | "hyundai" | "mercedes" | "ford" | "chevrolet" | "nissan" | "bmw" | "gmc" | "kia" | "other";

interface ScrapProfile {
  scrapId: number; companyName: string; email: string;
  bannerUrl?: string; photos: string[];
  specializations: { vehicleBrands: ScrapVehicleBrand[] };
  location?: { lat: number; lng: number; address: string; city: string };
  contact: { phone: string; whatsapp?: string };
  rating: number; totalRatings: number; isVerified: boolean;
  workingHoursLabel?: string | null;
  updatedAt: string;
}

type ScrapSubscriptionStatus = "active" | "pending" | "expired" | "cancelled";
type ScrapBillingCycle = "monthly" | "yearly";

interface ScrapSubscription {
  id: string; scrapId: number;
  planName: string; price: number; billingCycle: ScrapBillingCycle;
  status: ScrapSubscriptionStatus;
  startDate: string; endDate: string;
  privileges: { priorityListing: boolean; verifiedBadge: boolean };
  renewedAt?: string;
}

type PartRequestStatus = "new" | "quoted" | "accepted" | "shipped" | "completed" | "cancelled";

interface PartRequest {
  id: string; requestNumber: string;
  customerName: string;
  customerPhoneMasked: string;    // e.g. "05XXXXX004" — masked by backend
  vehicle: { brand: ScrapVehicleBrand; model: string; year: number };
  partName: string; description?: string; photos: string[];
  status: PartRequestStatus;
  createdAt: string;
  escrowId?: string;
  offerPrice?: number;            // denormalized from submitted offer
  offeredAt?: string;
}

interface ScrapStats {
  openRequestsCount: number;
  escrowHeldAmount: number;       // SAR currently held in escrow
  completedDealsCount: number;
}

type EscrowStatus = "pending" | "held" | "released" | "disputed" | "refunded";

interface Escrow {
  id: string; partRequestId: string;
  amount: number;                 // SAR
  status: EscrowStatus;
  heldAt?: string; releasedAt?: string; disputedAt?: string; refundedAt?: string;
}
```

**Status transition flow (for backend state machine):**
```
new → quoted (scrap submits offer)
quoted → accepted (customer accepts, escrow created/held)
accepted → shipped (scrap marks shipped)
shipped → completed (customer confirms receipt, escrow released to scrap)
any → cancelled (either party; escrow refunded if held)
```

---

### 3.6 Admin Panel

Auth: `admin` or `super_admin` role required for all `/admin/*` endpoints. PARTIAL endpoints are the 3 provider approval actions that already exist.

#### 3.6.1 Dashboard

| # | Method | Path | Purpose | Request | Response (key fields) | Screen | Status |
|---|--------|------|---------|---------|---------------------|--------|--------|
| AD1 | GET | `/admin/dashboard/stats` | Platform KPI overview | — | `DashboardStats` | لوحة التحكم الرئيسية | **MISSING** |
| AD2 | GET | `/admin/revenues` | Revenue records & summary | `?source?: "commission"\|"subscription"` | `RevenueSummary` | الإيرادات (Revenues page) | **MISSING** |

```typescript
interface DashboardStats {
  totalUsers: number; activeProviders: number; pendingVerifications: number;
  monthlyRevenue: number;
  trends?: { totalUsers: number; activeProviders: number; pendingVerifications: number; monthlyRevenue: number };
  revenueSeries?: { month: string; value: number }[];   // last 12 months
  usersSeries?: { month: string; value: number }[];
  providerStatusBreakdown?: { status: string; count: number }[];
}

type RevenueSource = "commission" | "subscription";
interface RevenueRecord {
  id: string; source: RevenueSource;
  providerId: number; providerName: string; providerType: "dealer"|"workshop"|"scrap";
  amount: number; detail?: string; periodMonth?: string;
}
interface RevenueSummary {
  totalMonthly: number; commissionTotal: number; subscriptionTotal: number;
  records: RevenueRecord[];
}
```

#### 3.6.2 Users

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| AU1 | GET | `/admin/users` | List all users (paginated) | `?page, pageSize` | `PaginatedResponse<AdminUserRow>` | إدارة المستخدمين | **MISSING** |
| AU2 | GET | `/admin/users/{id}` | Get user detail | — | `AdminUserDetail` | User detail drawer | **MISSING** |
| AU3 | POST | `/admin/users/{id}/suspend` | Suspend a user account | `{ reason: string }` | `AdminUserRow` | User actions | **MISSING** |
| AU4 | POST | `/admin/users/{id}/restore` | Restore a suspended user | — | `AdminUserRow` | User actions | **MISSING** |

```typescript
interface AdminUserRow {
  id: string; name: string; phone: string; email?: string | null;
  createdAt?: string;
  role: "customer"|"provider"|"driver"|"admin"|"super_admin";
  status: "active"|"suspended"|"pending";
}
interface AdminUserDetail extends AdminUserRow {
  createdAt: string; lastActiveAt: string | null;
  ordersCount?: number;
}
```

#### 3.6.3 Providers (Admin view)

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| AP1 | GET | `/admin/providers` | List providers with optional filters | `?status?: "pending"\|"approved"\|"rejected", type?: "dealer"\|"workshop"\|"scrap"` | `AdminProvider[]` (= `ProviderProfile[]`) | إدارة مقدمي الخدمة | **PARTIAL** (approval only confirmed) |
| AP2 | PATCH | `/admin/providers/{id}/approve` | Approve provider KYC | — | `AdminProvider` | Provider review | **EXISTS** |
| AP3 | PATCH | `/admin/providers/{id}/reject` | Reject with reason | `{ reason: string }` | `AdminProvider` | Provider review | **EXISTS** |
| AP4 | PATCH | `/admin/providers/{id}/commission` | Set commission rate | `{ commissionRate: number }` | `AdminProvider` | Provider detail | **EXISTS** (per CLAUDE.md) |

#### 3.6.4 Services & Categories

> **⚠ CATEGORY HIERARCHY:** Categories are now a 3-level tree (L1 Parent → L2 Child → L3 Sub-child), provider-type scoped, with `isActive` / `sortOrder` and guarded deletes. See **Section 8** for the complete data model, validation rules, 409 contract, and migration notes. The endpoints below supersede the original flat category spec.

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| AS1 | GET | `/admin/categories` | List all categories (flat, all fields); client builds tree via `getCategoryTree` | `?providerType?, parentId?, level?, isActive?` | `ServiceCategory[]` | Admin tree UI; CategoryCascader; provider onboarding; discovery L1→L2 filter | **MISSING** |
| AS2 | GET | `/admin/categories/{id}` | Get single category | — | `ServiceCategory` | Edit category dialog | **MISSING** |
| AS3 | POST | `/admin/categories` | Create L1/L2/L3 category | `{ parentId: number\|null, nameAr, nameEn, colorHint?, iconUrl?, providerTypeScope?, sortOrder? }` | `ServiceCategory` | Add category form | **MISSING** |
| AS4 | PUT | `/admin/categories/{id}` | Update name / colorHint / iconUrl / sortOrder / isActive (node re-parenting out of scope v1) | `{ nameAr?, nameEn?, colorHint?, iconUrl?, sortOrder?, isActive? }` | `ServiceCategory` | Edit category form | **MISSING** |
| AS5 | PATCH | `/admin/categories/{id}/active` | Toggle `isActive`; always permitted — safe alternative to delete | `{ isActive: boolean }` | `ServiceCategory` | Deactivate button in tree | **MISSING** |
| AS6 | DELETE | `/admin/categories/{id}` | Delete leaf category — **must return 409** `{ error: "in_use", childCount, referenceCount, message }` if node has children or is referenced (see Section 8) | — | `void` or `409 ConflictResponse` | Delete action in tree | **MISSING** |
| AS7 | GET | `/admin/services` | List services | `?categoryId?, isActive?` | `Service[]` | Service list | **MISSING** |
| AS8 | POST | `/admin/services` | Create service; `categoryId` **must reference a level-3 leaf** | `{ nameAr, nameEn, categoryId, basePrice, estimatedDuration?, isActive, descriptionAr?, descriptionEn?, sortOrder? }` | `Service` | Add service | **MISSING** |
| AS9 | PUT | `/admin/services/{id}` | Update service | `Partial<Service>` | `Service` | Edit service | **MISSING** |
| AS10 | DELETE | `/admin/services/{id}` | Delete service | — | `void` | Service list | **MISSING** |

#### 3.6.5 Subscription Plans & Provider Subscriptions

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| APL1 | GET | `/admin/plans` | List subscription plans | `?isActive?` | `SubscriptionPlan[]` | إدارة الباقات | **MISSING** |
| APL2 | GET | `/admin/plans/{id}` | Get plan detail | — | `SubscriptionPlan` | Plan detail | **MISSING** |
| APL3 | POST | `/admin/plans` | Create plan | `Omit<SubscriptionPlan, "id">` | `SubscriptionPlan` | Add plan | **MISSING** |
| APL4 | PUT | `/admin/plans/{id}` | Update plan | `Partial<SubscriptionPlan>` | `SubscriptionPlan` | Edit plan | **MISSING** |
| APL5 | DELETE | `/admin/plans/{id}` | Delete plan | — | `void` | Plan list | **MISSING** |
| APL6 | GET | `/admin/subscriptions` | List active provider subscriptions | `?page, pageSize, status?, type?: "workshop"\|"scrap"` | `PaginatedResponse<ProviderSubscription>` | الاشتراكات | **MISSING** |
| APL7 | POST | `/admin/subscriptions/{id}/cancel` | Cancel provider subscription | — | `ProviderSubscription` | Subscription management | **MISSING** |

```typescript
interface SubscriptionPlan {
  id: number; nameAr: string; nameEn: string;
  descriptionAr?: string | null; descriptionEn?: string | null;
  price: number; billingCycle: "monthly"|"yearly";
  features: { id: string; labelAr: string; labelEn: string }[];
  isActive: boolean; sortOrder?: number | null;
}
interface ProviderSubscription {
  id: number; providerId: number; providerName: string; providerType: "workshop"|"scrap";
  planId: number; planName: string; price: number; billingCycle: "monthly"|"yearly";
  status: "active"|"expired"|"cancelled"|"pending";
  startDate: string; endDate: string; createdAt: string;
}
```

#### 3.6.6 Lookups — Cities, Brands, Models (Admin CRUD)

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| ALK1 | GET | `/admin/cities` | List cities | — | `City[]` | إعدادات — المدن | **MISSING** |
| ALK2 | POST | `/admin/cities` | Create city | `{ nameAr, nameEn }` | `City` | Add city | **MISSING** |
| ALK3 | PUT | `/admin/cities/{id}` | Update city | `Partial<City>` | `City` | Edit city | **MISSING** |
| ALK4 | DELETE | `/admin/cities/{id}` | Delete city | — | `void` | City list | **MISSING** |
| ALK5 | POST | `/admin/brands` | Create vehicle brand | `{ nameAr, nameEn }` | `Brand` | إدارة الماركات | **MISSING** |
| ALK6 | PUT | `/admin/brands/{id}` | Update brand | `{ nameAr?, nameEn? }` | `Brand` | Edit brand | **MISSING** |
| ALK7 | DELETE | `/admin/brands/{id}` | Delete brand | — | `void` | Brand list | **MISSING** |
| ALK8 | POST | `/admin/brands/{id}/models` | Add model under brand | `{ nameAr, nameEn }` | `VehicleModel` | Model management | **MISSING** |
| ALK9 | PUT | `/admin/brands/{id}/models/{modelId}` | Update model | `{ nameAr?, nameEn? }` | `VehicleModel` | Edit model | **MISSING** |
| ALK10 | DELETE | `/admin/brands/{id}/models/{modelId}` | Delete model | — | `void` | Model list | **MISSING** |

> Note: `GET /Lookups/brands`, `GET /Lookups/brands/{id}/models`, `GET /Lookups/brands/{id}/models/{modelId}/years` already **EXIST** for reads. Admin CRUD is separate.

#### 3.6.7 Notifications

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| AN1 | GET | `/admin/notification-templates` | List templates | `?isActive?` | `NotificationTemplate[]` | قوالب الإشعارات | **MISSING** |
| AN2 | GET | `/admin/notification-templates/{id}` | Get template | — | `NotificationTemplate` | Template detail | **MISSING** |
| AN3 | POST | `/admin/notification-templates` | Create template | `Omit<NotificationTemplate, "id">` | `NotificationTemplate` | Add template | **MISSING** |
| AN4 | PUT | `/admin/notification-templates/{id}` | Update template | `Partial<NotificationTemplate>` | `NotificationTemplate` | Edit template | **MISSING** |
| AN5 | DELETE | `/admin/notification-templates/{id}` | Delete template | — | `void` | Template list | **MISSING** |
| AN6 | POST | `/admin/notifications/send` | Send a notification to audience | `{ templateId?, titleAr, titleEn, bodyAr, bodyEn, audience, channel }` | `SentNotification` | إرسال إشعار | **MISSING** |
| AN7 | GET | `/admin/notifications` | List sent notifications | `?page, pageSize, status?` | `PaginatedResponse<SentNotification>` | سجل الإشعارات | **MISSING** |

```typescript
type NotificationChannel = "in_app" | "push" | "email" | "sms";
type NotificationAudience = "all" | "customers" | "providers";
type NotificationStatus = "pending" | "sent" | "failed";

interface NotificationTemplate {
  id: string; nameAr: string; nameEn: string;
  titleAr: string; titleEn: string; bodyAr: string; bodyEn: string;
  variables: string[];  // template variable names e.g. ["customerName"]
  channel: NotificationChannel; isActive: boolean;
}
interface SentNotification {
  id: string; templateId?: string | null;
  titleAr: string; titleEn: string; bodyAr: string; bodyEn: string;
  audience: NotificationAudience; channel: NotificationChannel;
  status: NotificationStatus; sentAt: string; recipientsCount: number;
}
```

#### 3.6.8 Ads (Campaigns & Placements)

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| AAD1 | GET | `/admin/ad-placements` | List ad placements/slots | `?isActive?` | `AdPlacement[]` | إدارة الإعلانات | **MISSING** |
| AAD2 | POST | `/admin/ad-placements` | Create placement | `Omit<AdPlacement, "id">` | `AdPlacement` | Add placement | **MISSING** |
| AAD3 | PUT | `/admin/ad-placements/{id}` | Update placement | `Partial<Omit<AdPlacement, "id">>` | `AdPlacement` | Edit placement | **MISSING** |
| AAD4 | DELETE | `/admin/ad-placements/{id}` | Delete placement | — | `void` | Placement list | **MISSING** |
| AAD5 | GET | `/admin/ad-campaigns` | List campaigns (paginated) | `?page, pageSize, status?, placementId?` | `PaginatedResponse<AdCampaign>` | الحملات الإعلانية | **MISSING** |
| AAD6 | GET | `/admin/ad-campaigns/{id}` | Get campaign detail | — | `AdCampaign` | Campaign detail | **MISSING** |
| AAD7 | POST | `/admin/ad-campaigns` | Create campaign | `Omit<AdCampaign, "id"|"createdAt">` | `AdCampaign` | Add campaign | **MISSING** |
| AAD8 | PUT | `/admin/ad-campaigns/{id}` | Update campaign | `Partial<Omit<AdCampaign, "id"|"createdAt">>` | `AdCampaign` | Edit campaign | **MISSING** |
| AAD9 | DELETE | `/admin/ad-campaigns/{id}` | Delete campaign | — | `void` | Campaign list | **MISSING** |

```typescript
type AdCampaignStatus = "draft" | "scheduled" | "active" | "paused" | "ended";

interface AdPlacement {
  id: number; code: string;
  nameAr: string; nameEn: string;
  descriptionAr?: string; descriptionEn?: string;
  isActive: boolean;
}
interface AdCampaign {
  id: number; titleAr: string; titleEn: string;
  descriptionAr?: string; descriptionEn?: string;
  imageUrl?: string; targetUrl?: string;
  placementId: number; startsAt: string; endsAt: string;
  status: AdCampaignStatus; priority?: number; createdAt: string;
}
```

#### 3.6.9 System Settings

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| AST1 | GET | `/admin/settings` | Get all system settings | — | `SystemSettings` | إعدادات النظام | **MISSING** |
| AST2 | PUT | `/admin/settings/general` | Update general settings | `GeneralSettings` | `SystemSettings` | General tab | **MISSING** |
| AST3 | PUT | `/admin/settings/contact` | Update contact/legal URLs | `ContactSettings` | `SystemSettings` | Contact tab | **MISSING** |
| AST4 | PUT | `/admin/settings/featureFlags` | Update feature flags | `FeatureFlag[]` | `SystemSettings` | Feature flags tab | **MISSING** |

```typescript
interface SystemSettings {
  general: {
    platformNameAr: string; platformNameEn: string;
    logoUrl?: string; supportEmail: string; supportPhone: string;
    defaultCurrency: string; defaultLanguage: "ar"|"en"; timezone: string;
  };
  contact: {
    termsUrlAr?: string; termsUrlEn?: string;
    privacyUrlAr?: string; privacyUrlEn?: string;
    twitterUrl?: string; instagramUrl?: string; whatsappNumber?: string;
  };
  featureFlags: { key: string; labelAr: string; labelEn: string; descriptionAr?: string; descriptionEn?: string; enabled: boolean }[];
}
```

#### 3.6.10 Audit Logs

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| AAL1 | GET | `/admin/audit-logs` | Query audit log (paginated) | `?page, pageSize, module?, action?, actorId?, dateFrom?, dateTo?, search?` | `PaginatedResponse<AuditLogEntry>` | سجل التدقيق | **MISSING** |
| AAL2 | GET | `/admin/audit-logs/export` | Export audit log as file | `?module?, action?, actorId?, dateFrom?, dateTo?, search?` | `Blob` (CSV or Excel) | Export button | **MISSING** |

```typescript
type AuditAction = "create"|"update"|"delete"|"approve"|"reject"|"suspend"|"restore"|"send"|"cancel"|"login";
type AuditModule = "users"|"providers"|"services"|"plans"|"subscriptions"|"notifications"|"ads"|"settings"|"auth";

interface AuditLogEntry {
  id: number; actorId: string; actorName: string; actorRole: string;
  action: AuditAction; module: AuditModule;
  entityType?: string; entityId?: string;
  summaryAr: string; summaryEn: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string; createdAt: string;
}
```

#### 3.6.11 Complaints

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| ACM1 | GET | `/admin/complaints` | List complaints (paginated) | `?page, pageSize, status?, search?` | `PaginatedResponse<Complaint>` | الشكاوى | **MISSING** |
| ACM2 | PATCH | `/admin/complaints/{id}/status` | Update complaint status | `{ status: ComplaintStatus }` | `Complaint` | Complaint detail | **MISSING** |

```typescript
type ComplaintStatus = "new" | "under_review" | "resolved";

interface Complaint {
  id: string; customerName: string;
  title: string; body: string;
  status: ComplaintStatus; createdAt: string;
}
```

---

### 3.7 Discovery (Customer-Facing — currently unimplemented)

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| DC1 | GET | `/services/nearby` | Search providers by location + filters | `?lat, lng, radiusKm, categoryId?, minRating?, priceBand?, openNowOnly?, q?` | `NearbyProvider[]` | بحث عن مزودي الخدمة | **MISSING** |
| DC2 | GET | `/ServiceProviders/{id}/reviews` | Get provider reviews | `?limit?, offset?` | `{ total, averageRating, items: ProviderReview[] }` | Provider profile page | **MISSING** |
| DC3 | GET | `/favorites` | List current user's favorites | — | `{ providerId: number, createdAt: string }[]` | المفضلة | **MISSING** |
| DC4 | POST | `/favorites/{providerId}` | Add to favorites | — | `{ providerId, createdAt }` | Provider card / profile | **MISSING** |
| DC5 | DELETE | `/favorites/{providerId}` | Remove from favorites | — | `{ success: true }` | Provider card / profile | **MISSING** |

`priceBand` values: `"lte_100" | "100_300" | "300_700" | "gt_700"`

---

### 3.8 Services / Lookups (Customer-Facing Reads)

| # | Method | Path | Purpose | Request | Response | Screen | Status |
|---|--------|------|---------|---------|---------|--------|--------|
| SL1 | GET | `/Services/categories` | List service categories | — | `ServiceCategory[]` | Service picker; discovery filters | **PARTIAL** (check Swagger) |
| SL2 | GET | `/Services/categories/{id}/subcategories` | List subcategories | — | `ServiceSubcategory[]` | Service picker | **PARTIAL** |
| SL3 | GET | `/Lookups/brands` | List vehicle brands | — | `Brand[]` | Vehicle add/edit form | **EXISTS** |
| SL4 | GET | `/Lookups/brands/{id}/models` | List models for brand | — | `VehicleModel[]` | Vehicle form | **EXISTS** |
| SL5 | GET | `/Lookups/brands/{id}/models/{modelId}/years` | List years for model | — | `number[]` | Vehicle form | **EXISTS** |

---

## 4. Missing-Endpoint Checklist

Copy this into your task tracker. Each line is one backend endpoint to build.

### AUTH / ONBOARDING
- [ ] `GET  /onboarding/account-summary` — return summary of newly-registered account for onboarding wizard
- [ ] `POST /onboarding/documents` — upload a single KYC doc during onboarding; return `{ fileId, fileName }`
- [ ] `POST /onboarding/submit-review` — submit provider application for admin review; return `{ submittedAt }`
- [ ] `GET  /onboarding/review-status` — poll review progress; return timeline items with states

### PROVIDER
- [ ] `GET  /provider/me` — return the calling provider's own `ProviderProfile` (derived from JWT, no ID in path)

### DEALER DASHBOARD
- [ ] `GET    /dealer/products` — paginated product list (`?page, pageSize, status?, search?, categoryId?`)
- [ ] `GET    /dealer/products/{id}` — get single product
- [ ] `POST   /dealer/products` — create product
- [ ] `PATCH  /dealer/products/{id}` — update product fields
- [ ] `DELETE /dealer/products/{id}` — delete product
- [ ] `PATCH  /dealer/products/{id}/status` — change product status only; body `{ status }`
- [ ] `GET    /dealer/orders` — paginated order list (`?page, pageSize, status?, search?`)
- [ ] `GET    /dealer/orders/{id}` — get single order with `items[]`
- [ ] `PATCH  /dealer/orders/{id}/status` — update order status; body `{ status }`
- [ ] `POST   /dealer/orders/{id}/ship` — mark shipped + attach carrier/tracking; body `{ carrier?, trackingNumber? }`
- [ ] `POST   /dealer/orders/{id}/cancel` — cancel order; body `{ reason? }`
- [ ] `GET    /dealer/shipments` — paginated shipment list (`?page, pageSize, status?`)
- [ ] `PATCH  /dealer/shipments/{id}/status` — update shipment status; body `{ status }`
- [ ] `GET    /dealer/dues` — dealer financial summary (commissions, net earnings, debt alert)

### WORKSHOP DASHBOARD
- [ ] `GET  /workshop/profile` — get workshop's own profile
- [ ] `PUT  /workshop/profile` — update profile (banner, photos, location, hours, specializations, contact)
- [ ] `GET  /workshop/subscription` — get current subscription with privileges
- [ ] `POST /workshop/subscription/renew` — extend subscription by one billing cycle

### SCRAP DASHBOARD
- [ ] `GET   /scrap/profile` — get scrap provider's own profile
- [ ] `PUT   /scrap/profile` — update profile
- [ ] `GET   /scrap/subscription` — get current subscription
- [ ] `POST  /scrap/subscription/renew` — renew subscription
- [ ] `GET   /scrap/stats` — dashboard KPIs: `{ openRequestsCount, escrowHeldAmount, completedDealsCount }`
- [ ] `GET   /scrap/part-requests` — paginated part request list (`?page, pageSize, status?, search?`)
- [ ] `GET   /scrap/part-requests/{id}` — single part request detail
- [ ] `POST  /scrap/part-requests/{id}/offer` — submit offer; body `{ price, note?, photos? }`
- [ ] `PATCH /scrap/part-requests/{id}/status` — update status; body `{ status }`
- [ ] `GET   /scrap/escrow/{partRequestId}` — get escrow state for a part request

### ADMIN — DASHBOARD & REVENUES
- [ ] `GET /admin/dashboard/stats` — platform KPIs with trend deltas and chart series
- [ ] `GET /admin/revenues` — revenue records summary (`?source?: "commission"|"subscription"`)

### ADMIN — USERS
- [ ] `GET  /admin/users` — paginated user list (`?page, pageSize`)
- [ ] `GET  /admin/users/{id}` — user detail with activity stats
- [ ] `POST /admin/users/{id}/suspend` — suspend user; body `{ reason }`
- [ ] `POST /admin/users/{id}/restore` — restore suspended user

### ADMIN — PROVIDERS
- [ ] `GET /admin/providers` — list providers with optional filters (`?status?, type?`)
- [ ] `PATCH /admin/providers/{id}/commission` — set commission rate; body `{ commissionRate }`

### ADMIN — SERVICES & CATEGORIES (Hierarchical — see Section 8)
- [ ] `GET    /admin/categories` — list categories flat (all levels); params: `?providerType?, parentId?, level?, isActive?`; client calls `getCategoryTree` to build tree
- [ ] `GET    /admin/categories/{id}` — get single category *(new — required by hierarchy)*
- [ ] `POST   /admin/categories` — create L1/L2/L3 node; body: `{ parentId: number|null, nameAr, nameEn, colorHint?, iconUrl?, providerTypeScope?, sortOrder? }`; server derives `level = parent.level + 1` (reject `level > 3`)
- [ ] `PUT    /admin/categories/{id}` — update `nameAr / nameEn / colorHint / iconUrl / sortOrder / isActive`; node re-parenting out of scope v1
- [ ] `PATCH  /admin/categories/{id}/active` — toggle `isActive`; always permitted; the safe deactivation path *(new)*
- [ ] `DELETE /admin/categories/{id}` — guarded delete; **must return 409** `{ error: "in_use", childCount: number, referenceCount: number, message: string }` if node has children OR is referenced by any provider-service / product / provider-profile *(new guard contract — see Section 8)*
- [ ] `GET    /admin/services` — list services (`?categoryId?, isActive?`)
- [ ] `POST   /admin/services` — create service; `categoryId` **must be a level-3 leaf** (backend should validate)
- [ ] `PUT    /admin/services/{id}` — update service
- [ ] `DELETE /admin/services/{id}` — delete service

### ADMIN — SUBSCRIPTION PLANS
- [ ] `GET    /admin/plans` — list subscription plans (`?isActive?`)
- [ ] `GET    /admin/plans/{id}` — get single plan
- [ ] `POST   /admin/plans` — create plan
- [ ] `PUT    /admin/plans/{id}` — update plan
- [ ] `DELETE /admin/plans/{id}` — delete plan
- [ ] `GET    /admin/subscriptions` — list provider subscriptions (`?page, pageSize, status?, type?`)
- [ ] `POST   /admin/subscriptions/{id}/cancel` — cancel a provider subscription

### ADMIN — LOOKUPS (CRUD)
- [ ] `GET    /admin/cities` — list cities
- [ ] `POST   /admin/cities` — create city
- [ ] `PUT    /admin/cities/{id}` — update city
- [ ] `DELETE /admin/cities/{id}` — delete city
- [ ] `POST   /admin/brands` — create vehicle brand
- [ ] `PUT    /admin/brands/{id}` — update brand
- [ ] `DELETE /admin/brands/{id}` — delete brand
- [ ] `POST   /admin/brands/{id}/models` — add model under brand
- [ ] `PUT    /admin/brands/{id}/models/{modelId}` — update model
- [ ] `DELETE /admin/brands/{id}/models/{modelId}` — delete model

### ADMIN — NOTIFICATIONS
- [ ] `GET    /admin/notification-templates` — list templates (`?isActive?`)
- [ ] `GET    /admin/notification-templates/{id}` — get template
- [ ] `POST   /admin/notification-templates` — create template
- [ ] `PUT    /admin/notification-templates/{id}` — update template
- [ ] `DELETE /admin/notification-templates/{id}` — delete template
- [ ] `POST   /admin/notifications/send` — send a notification broadcast
- [ ] `GET    /admin/notifications` — list sent notifications (`?page, pageSize, status?`)

### ADMIN — ADS
- [ ] `GET    /admin/ad-placements` — list ad slots (`?isActive?`)
- [ ] `POST   /admin/ad-placements` — create placement
- [ ] `PUT    /admin/ad-placements/{id}` — update placement
- [ ] `DELETE /admin/ad-placements/{id}` — delete placement
- [ ] `GET    /admin/ad-campaigns` — paginated campaigns (`?page, pageSize, status?, placementId?`)
- [ ] `GET    /admin/ad-campaigns/{id}` — get campaign
- [ ] `POST   /admin/ad-campaigns` — create campaign
- [ ] `PUT    /admin/ad-campaigns/{id}` — update campaign
- [ ] `DELETE /admin/ad-campaigns/{id}` — delete campaign

### ADMIN — SETTINGS
- [ ] `GET /admin/settings` — get all system settings
- [ ] `PUT /admin/settings/general` — update general settings section
- [ ] `PUT /admin/settings/contact` — update contact/legal URLs section
- [ ] `PUT /admin/settings/featureFlags` — update feature flags section

### ADMIN — AUDIT LOGS
- [ ] `GET /admin/audit-logs` — paginated audit log (`?page, pageSize, module?, action?, actorId?, dateFrom?, dateTo?, search?`)
- [ ] `GET /admin/audit-logs/export` — export filtered log as file (CSV / Excel)

### ADMIN — COMPLAINTS
- [ ] `GET   /admin/complaints` — paginated complaints (`?page, pageSize, status?, search?`)
- [ ] `PATCH /admin/complaints/{id}/status` — update status; body `{ status }`

### DISCOVERY (Customer)
- [ ] `GET    /services/nearby` — nearby provider search (`?lat, lng, radiusKm, categoryId?, minRating?, priceBand?, openNowOnly?, q?`)
- [ ] `GET    /ServiceProviders/{id}/reviews` — provider reviews (`?limit?, offset?`)
- [ ] `GET    /favorites` — current user's favorite providers
- [ ] `POST   /favorites/{providerId}` — add to favorites
- [ ] `DELETE /favorites/{providerId}` — remove from favorites

### SERVICES / LOOKUPS (if not already present)
- [ ] `GET /Services/categories` — list service categories (verify in Swagger)
- [ ] `GET /Services/categories/{id}/subcategories` — list subcategories

---

## 5. Domain Models To Design (Net-New Backend Entities)

The following entities are assumed by the frontend but do not exist in the current backend. The backend team must design storage, migrations, and business logic for each.

### 5.1 PartRequest
Customer-submitted request for a scrap/salvage part. Visible to all scrap providers in their region.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | PK |
| `requestNumber` | `string` | Human-readable reference e.g. "PR-2026-001" |
| `customerName` | `string` | |
| `customerPhoneMasked` | `string` | Masked by backend e.g. "05XXXXX004" |
| `vehicle.brand` | `string` enum | e.g. `"toyota"` |
| `vehicle.model` | `string` | |
| `vehicle.year` | `number` | |
| `partName` | `string` | |
| `description` | `string?` | |
| `photos` | `string[]` | URLs |
| `status` | `"new"\|"quoted"\|"accepted"\|"shipped"\|"completed"\|"cancelled"` | State machine |
| `createdAt` | `string` | ISO-8601 |
| `escrowId` | `string?` | FK to Escrow — set when status moves to "accepted" |
| `offerPrice` | `number?` | Denormalized from the scrap provider's offer |
| `offeredAt` | `string?` | ISO-8601 |

### 5.2 Escrow
Payment held by the platform between a customer's acceptance and delivery confirmation. **This is a new financial domain — no existing backend analogue.**

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | PK |
| `partRequestId` | `string` | FK to PartRequest |
| `amount` | `number` | SAR — matches the accepted offer price |
| `status` | `"pending"\|"held"\|"released"\|"disputed"\|"refunded"` | |
| `heldAt` | `string?` | ISO when payment was captured |
| `releasedAt` | `string?` | ISO when released to scrap provider |
| `disputedAt` | `string?` | ISO when dispute was opened |
| `refundedAt` | `string?` | ISO when refunded to customer |

**Business rule:** Escrow transitions are buyer-driven (customer confirms receipt → released) or admin-arbitrated (dispute). The scrap provider cannot release their own escrow.

### 5.3 Product (Dealer)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | PK |
| `dealerId` | `string` | FK to Provider (type=dealer) |
| `nameAr` / `nameEn` | `string` | Bilingual |
| `sku` | `string` | Provider-assigned |
| `categoryId` | `string` | FK to service/product category |
| `price` | `number` | SAR |
| `condition` | `"new"` | Extensible |
| `status` | `"active"\|"draft"\|"out_of_stock"\|"archived"` | |
| `stockQty` | `number` | Denormalized; source of truth = Inventory |
| `images` | `string[]` | URLs |
| `descriptionAr` / `descriptionEn` | `string?` | |
| `createdAt` / `updatedAt` | `string` | ISO-8601 |

### 5.4 Inventory (Dealer)

| Field | Type | Notes |
|-------|------|-------|
| `productId` | `string` | FK to Product |
| `dealerId` | `string` | FK to Provider |
| `onHand` | `number` | Current physical stock |
| `reserved` | `number` | Reserved by open orders |
| `updatedAt` | `string` | ISO-8601 |

### 5.5 Order (Dealer)

Full structure documented in Section 3.3. Key design notes:
- `commissionRate` is a **snapshot** taken at order creation time — immutable thereafter
- `commissionAmount = subtotal * commissionRate / 100`
- `netToDealer = subtotal - commissionAmount`
- `customerPhone` is displayed to dealer but may warrant masking policy

### 5.6 Shipment (Dealer)

Full structure in Section 3.3. Linked 1-to-1 with an Order via `orderId`. Created when `POST /dealer/orders/{id}/ship` is called.

### 5.7 DealerDues

Aggregated financial view — not a stored record but a computed response:
- `grossSales` = sum of `subtotal` for all orders with `status: "delivered"`
- `totalCommission` = sum of `commissionAmount` for delivered orders
- `netEarnings = grossSales - totalCommission`
- `outstandingDebt` = running balance of unpaid commission (business rule TBD — monthly settlement?)
- `debtAlert = outstandingDebt > 500`

### 5.8 ProviderSubscription (Workshop & Scrap)

Both workshop and scrap have their own subscription shape (see Sections 3.4 and 3.5). The admin-facing `ProviderSubscription` (Section 3.6.5) is the unified admin view. The provider-facing schemas differ in `privileges` field:
- Workshop: `{ topListing: boolean, freeInspectionOffers: boolean }`
- Scrap: `{ priorityListing: boolean, verifiedBadge: boolean }`

These can either be stored as a JSON column or normalized into a `SubscriptionPrivilege` table.

### 5.9 RevenueRecord (Admin)

Computed from orders (commission) and subscription payments. The backend needs logic to aggregate monthly:
- Commission revenue = sum of `commissionAmount` per `dealerId` per month
- Subscription revenue = subscription `price` per active `ProviderSubscription` per month

### 5.10 AdPlacement + AdCampaign

New tables; no existing backend analogue. `AdPlacement` defines display slots (e.g., "home-banner", "search-sidebar"). `AdCampaign` links content + schedule to a placement.

### 5.11 AuditLog

System-generated on every mutating admin action. The backend must emit an audit entry on every write to: users, providers, services, plans, subscriptions, notifications, ads, settings. Fields: `actorId`, `action`, `module`, `entityType`, `entityId`, `summaryAr`, `summaryEn`, `metadata`, `ipAddress`.

### 5.12 Complaint

Customer-submitted complaint visible in admin panel. Source of submission not specified in frontend (likely a customer-facing form endpoint separate from this dashboard spec).

### 5.13 NotificationTemplate + SentNotification

Template defines bilingual content + channel + variable placeholders. SentNotification records a broadcast event with delivery status and recipient count.

### 5.15 ServiceCategory (Hierarchical)

Three-level classification tree scoped per provider type. Previously a flat list; now carries a parent/child relationship with a maximum depth of 3. Full specification in **Section 8**.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` (mock) → `string` (UUID, backend) | See OQ11 — id type to be confirmed |
| `parentId` | `number\|null` | `null` = L1 root node |
| `level` | `1\|2\|3` | Derivable from parent chain; backend may store or compute |
| `nameAr` | `string` | Arabic display name |
| `nameEn` | `string` | English display name |
| `colorHint` | `"blue"\|"green"\|"orange"\|"purple"\|"red"\|"navy"\|undefined` | Optional UI tint |
| `iconUrl` | `string\|null` | Optional icon URL |
| `providerTypeScope` | `"dealer"\|"workshop"\|"scrap"\|null` | `null` = visible to all provider types; maps to backend `ProviderType` enum |
| `isActive` | `boolean` | Soft-disable; inherited by children at render time (frontend responsibility) |
| `sortOrder` | `number` | Display order within same parent |

**Key rule:** Services and products must reference a **level-3 leaf** `categoryId`. Provider onboarding stores `categoryIds[]` which may include L2 or L3 nodes (multi-specialization).

---

### 5.14 WorkshopProfile & ScrapProfile

Both are **extended provider profiles** layered on top of the base `ProviderProfile`. Design choices:
1. **Polymorphic (recommended):** Store all fields on the `ServiceProvider` table with nullable columns per type, plus a JSONB column for structured data (`workingHours`, `specializations`, `contact`, `location`)
2. **Separate tables:** `WorkshopProfile`, `ScrapProfile` each with FK to `ServiceProvider.id` — cleaner normalization but requires joins

---

## 6. Wiring Priority

### Tier 1 — Auth & Identity (unblocks everything)
1. OTP-based auth (`/auth/register`, `/auth/verify-otp`) — reconcile with existing backend
2. `/users/me` GET/PUT + avatar upload
3. `/provider/me` — provider dashboard bootstrap
4. `/onboarding/*` — 4 endpoints

### Tier 2 — Admin Panel (parallel-buildable with Tier 3)
5. `/admin/dashboard/stats` — unlocks admin home page
6. `/admin/providers` list + commission PATCH
7. `/admin/users` CRUD (4 endpoints)
8. `/admin/plans` CRUD (5 endpoints) — needed before workshop/scrap subscriptions
9. `/admin/subscriptions` (2 endpoints)
10. `/admin/revenues` (1 endpoint)
11. `/admin/categories` + `/admin/services` CRUD (8 endpoints)
12. `/admin/cities` CRUD + `/admin/brands` + `/admin/brands/{id}/models` CRUD (10 endpoints)
13. `/admin/notification-templates` CRUD + `/admin/notifications/send` + `/admin/notifications` (7 endpoints)
14. `/admin/ad-placements` + `/admin/ad-campaigns` CRUD (9 endpoints)
15. `/admin/settings` GET/PUT (4 endpoints)
16. `/admin/audit-logs` + export (2 endpoints)
17. `/admin/complaints` (2 endpoints)

### Tier 3 — Provider Dashboards
18. Dealer: `/dealer/products` CRUD (6) → `/dealer/orders` + status actions (5) → `/dealer/shipments` (2) → `/dealer/dues` (1)
19. Workshop: `/workshop/profile` GET/PUT + `/workshop/subscription` GET/renew (4 endpoints)
20. Scrap: `/scrap/profile` GET/PUT + `/scrap/subscription` GET/renew + `/scrap/stats` (5 endpoints) → `/scrap/part-requests` CRUD + offer + status (5 endpoints) → `/scrap/escrow` (1 endpoint) — **design Escrow domain first**

### Tier 4 — Discovery (Customer App)
21. `/services/nearby` + `/ServiceProviders/{id}/reviews` + `/favorites` CRUD (5 endpoints)

---

## 7. Open Questions for Backend Team

| # | Question | Why it blocks |
|---|----------|--------------|
| OQ1 | **OTP vs Password:** Does the current backend support OTP login (`/auth/register` + `/auth/verify-otp`)? If only password login exists, this must be added before any provider/admin frontend can be wired. | All authenticated dashboards |
| OQ2 | **Response envelope:** Does the backend emit bare responses or `{ success, data }` wrapped? The frontend currently consumes bare `T` for single resources and `PaginatedResponse<T>` for lists. If the backend wraps, an Axios interceptor must be added. | All endpoints |
| OQ3 | **Field casing:** Will the backend emit camelCase JSON (`JsonNamingPolicy.CamelCase`)? If PascalCase, a transform layer is needed on the frontend. | All endpoints |
| OQ4 | **Provider type namespaces vs polymorphic:** Should dealer/workshop/scrap use separate endpoint prefixes (`/dealer/*`, `/workshop/*`, `/scrap/*`) as the frontend expects, or a single polymorphic `/provider/*` with type discrimination? Frontend strongly expects separate namespaces. | Dealer, Workshop, Scrap dashboards |
| OQ5 | **Escrow ownership:** Who holds escrow funds — a platform wallet, a third-party payment gateway, or a ledger entry? The frontend assumes release is triggered by customer confirmation; does the backend have a payment gateway integration that supports holds? | Scrap Escrow domain (S10) |
| OQ6 | **`providerId` type:** The frontend uses `id: number` for providers (matching the existing `ServiceProviders/{id}` integer PK) but `id: string` (UUID) for new entities (products, orders). Is the backend migrating provider IDs to UUIDs or keeping integers? | All provider-scoped endpoints |
| OQ7 | **Admin `GET /admin/providers` — is this the same as the existing approval endpoint?** The frontend calls this with optional `status` and `type` filters to list all providers, not just pending ones. Confirm whether the existing approval endpoint can be extended or a new one is needed. | Admin provider list |
| OQ8 | **Dealer `commissionRate` at order time:** The frontend snapshots `commissionRate` into each `Order` at creation. Does the backend store this on the order row, or compute it dynamically? The `DealerDues` computation depends on this snapshot being immutable. | Dealer orders and dues |
| OQ9 | **`customerPhoneMasked` in PartRequest:** The backend must mask the customer phone before returning it to the scrap provider. What is the masking format — `05XXXXX004` (last 3 digits visible)? Is this a backend-computed field or a frontend concern? | Scrap part requests |
| OQ10 | **OutstandingDebt settlement cycle in `DealerDues`:** What business rule defines when `outstandingDebt` resets — monthly invoice cycle, per-order settlement, or manual admin clearing? The `debtAlert` threshold (500 SAR) is defined in the SRS (FR-MKT-07). | Dealer dues endpoint |
| OQ11 | **`ServiceCategory.id` type — `int` or `uuid`?** The frontend mock uses `number`; new domain entities use `string` (UUID). If the backend uses UUID PKs for categories, the `parentId` and `categoryId` FKs in products/services must also become `string`. The parent/child relationship and all FK references must remain consistent regardless of chosen type. | All category endpoints; `Product.categoryId`; `ProviderProfile.categoryIds` |
| OQ12 | **Does the backend store `level` or derive it from the `parentId` chain?** Storing it (denormalized) simplifies queries; deriving it at read time keeps the schema cleaner. Either is acceptable — the frontend only reads `level` and does not write it. The backend must enforce `max level = 3` on writes regardless of approach. | `POST /admin/categories` validation |
| OQ13 | **Is `providerTypeScope` on `ServiceCategory` the same enum as `ProviderType`?** The frontend maps `"dealer" \| "workshop" \| "scrap"` (Section 2.7). If the backend stores `ProviderType` as `PartsVendor / Workshop / ScrapYard`, the category scope field must use the same enum and be serialized to camelCase strings matching the frontend values, or an explicit mapping contract is needed. | `GET /admin/categories?providerType=` filter; cascader scope filtering |
| OQ14 | **Leaf-only enforcement for service/product classification — backend or frontend?** The frontend already restricts the `CategoryCascader` to require a level-3 selection before enabling submit. Should the backend also validate that `ProviderService.categoryId` and `Product.categoryId` point to a `level = 3` node and reject `level < 3` with a 422? Recommended: backend validates to enforce the constraint at the API layer regardless of client. | `POST /admin/services`; `POST /dealer/products`; onboarding `categoryIds[]` (multi-select — may include L2 or L3) |

---

## 8. Hierarchical Categories (Reference Data)

> **Context:** The frontend migrated from a flat `ServiceCategory` list to a 3-level tree in Phase 2 of the category hierarchy feature. This section is the authoritative contract for everything the backend must implement to support that tree.

### 8.1 Data Model — `ServiceCategory` Entity

Sourced from `src/modules/services/types.ts` (quoted verbatim):

```typescript
export interface ServiceCategory {
  id: number;                  // Mock uses number; backend will likely use UUID (see OQ11)
  nameAr: string;
  nameEn: string;
  iconUrl: string | null;      // Backend-issued URL or null
  colorHint?: "blue" | "green" | "orange" | "purple" | "red" | "navy";
  parentId: number | null;     // null = L1 root node
  level: 1 | 2 | 3;           // 1 = parent, 2 = child, 3 = sub-child (max depth)
  providerTypeScope: ProviderType | null;  // "dealer" | "workshop" | "scrap" | null
  isActive: boolean;
  sortOrder: number;
}
```

**Field notes:**

| Field | Backend mapping |
|-------|----------------|
| `parentId` | FK to `ServiceCategory.id`; `null` = root L1 node |
| `level` | Backend may store (denormalized for query performance) or compute from parent chain. Either is acceptable — see OQ12. Max depth = 3; `POST` with a level-3 parent must be rejected with `422`. |
| `providerTypeScope` | Maps to backend `ProviderType` enum. Frontend values: `"dealer"` → `PartsVendor` (or `Dealer`), `"workshop"` → `Workshop`, `"scrap"` → `ScrapYard`. See Section 2.7 and OQ13. `null` = category visible to all provider types. |
| `id` type | Frontend mock uses `number`; backend will likely use UUID (`string`). The `parentId`, `Product.categoryId`, `ProviderService.categoryId`, and `ProviderProfile.categoryIds[]` FKs must use the same type. See OQ11. |

**Helper used by frontend** (client-side only — no backend endpoint needed):

```typescript
// Builds CategoryTreeNode[] from the flat ServiceCategory[] returned by GET /admin/categories
getCategoryTree(flat: ServiceCategory[]): CategoryTreeNode[]
```

---

### 8.2 Endpoints

#### `GET /admin/categories`

List all categories as a flat array; the frontend assembles the tree.

| | |
|--|--|
| **Auth** | `admin` or `super_admin` |
| **Query params** | `providerType?: "dealer"\|"workshop"\|"scrap"` — filter by scope (returns matching + global `null` records); `parentId?: number\|string` — return only direct children of a node; `level?: 1\|2\|3` — filter by depth; `isActive?: boolean` — omit to return all |
| **Response** | `ServiceCategory[]` (all fields) |
| **Consumed by** | Admin category tree UI; `CategoryCascader` (services tab, dealer products); provider onboarding multi-select tree; discovery L1→L2 filter |

> **Note:** The frontend fetches the full list once and builds the tree client-side via `getCategoryTree`. No nested/recursive endpoint is needed.

---

#### `GET /admin/categories/{id}`

| | |
|--|--|
| **Auth** | `admin` or `super_admin` |
| **Response** | `ServiceCategory` |
| **Used by** | Edit category dialog (pre-fill form) |

---

#### `POST /admin/categories`

Create a new category node at any level.

| | |
|--|--|
| **Auth** | `admin` or `super_admin` |
| **Request body** | See below |
| **Response** | `ServiceCategory` (full, server-populated) |
| **Used by** | Add category form (admin tree UI, all three levels) |

```typescript
interface CreateCategoryRequest {
  parentId: number | null;      // null = create L1 root
  nameAr: string;
  nameEn: string;
  colorHint?: "blue" | "green" | "orange" | "purple" | "red" | "navy";
  iconUrl?: string | null;
  providerTypeScope?: "dealer" | "workshop" | "scrap" | null;  // null = global
  sortOrder?: number;           // defaults to next available
}
```

**Server-side derivation:**
- `level = (parentId === null) ? 1 : parent.level + 1`
- **Reject with `422`** if `parent.level >= 3` (would create a level-4 node)
- **Reject with `404`** if `parentId` is provided but does not exist
- `providerTypeScope` inheritance: if omitted and `parentId` is set, inherit from parent's scope. If `parentId` is null (L1), scope defaults to `null` (global) unless explicitly set.

---

#### `PUT /admin/categories/{id}`

Update mutable fields. **Node re-parenting (changing `parentId`) is out of scope for v1** — return `422` if `parentId` is included in the body.

| | |
|--|--|
| **Auth** | `admin` or `super_admin` |
| **Request body** | `{ nameAr?, nameEn?, colorHint?, iconUrl?, sortOrder?, isActive? }` |
| **Response** | `ServiceCategory` (updated) |
| **Used by** | Edit category dialog |

---

#### `PATCH /admin/categories/{id}/active`

Toggle `isActive`. This is **always permitted** — it is the safe alternative to delete when a category is in use or has children.

| | |
|--|--|
| **Auth** | `admin` or `super_admin` |
| **Request body** | `{ isActive: boolean }` |
| **Response** | `ServiceCategory` (updated) |
| **Used by** | Deactivate / Reactivate button in admin category tree |

> **Note:** The frontend renders inactive categories as dimmed but still shows them in the tree for admin management. Active/inactive filtering on `GET /admin/categories?isActive=true` is used by consumer-facing screens (cascader, onboarding) to hide inactive nodes.

---

#### `DELETE /admin/categories/{id}`

Permanently delete a category node. **Must be guarded.** Only leaf nodes that are not referenced anywhere may be deleted.

| | |
|--|--|
| **Auth** | `admin` or `super_admin` |
| **Response (success)** | `204 No Content` |
| **Response (blocked)** | `409 Conflict` (see contract below) |
| **Used by** | Delete action in admin category tree |

**409 Conflict contract** — return this body whenever deletion is blocked:

```typescript
interface CategoryDeleteConflictResponse {
  error: "in_use";
  childCount: number;       // number of direct children; > 0 means node is not a leaf
  referenceCount: number;   // total references across provider-services + products + provider-profiles
  message: string;          // human-readable; e.g. "Cannot delete: 3 children and 12 references exist"
}
```

**Guard conditions (ANY is sufficient to block deletion):**
1. `childCount > 0` — node has child categories (L1 with L2 children, or L2 with L3 children)
2. `referenceCount > 0` — category `id` appears in any of:
   - `ProviderService.categoryId`
   - `Product.categoryId` (dealer products)
   - `ProviderProfile.categoryIds[]` (onboarding specializations)

The admin UI surfaces the 409 body to the operator and offers "Deactivate instead" (`PATCH /active`) as an alternative.

---

### 8.3 Validation Rules

| Rule | Detail |
|------|--------|
| **Max depth = 3** | `level > 3` is always rejected. Enforced on `POST` by checking `parent.level`. |
| **Parent must exist** | `parentId` pointing to a non-existent category → `404`. |
| **Scope inheritance** | If `providerTypeScope` is omitted on create and a parent exists, the child inherits the parent's scope. L1 nodes default to `null` (global) unless explicitly scoped. |
| **Leaf-only classification (services/products)** | `ProviderService.categoryId` and `Product.categoryId` must reference a `level = 3` leaf. Backend should validate on create/update and return `422` with a clear message if a non-leaf is supplied. (See OQ14.) |
| **Onboarding `categoryIds[]`** | Provider onboarding stores an array of category IDs representing the provider's specializations. These may be L2 **or** L3 nodes (the admin multi-select tree allows selecting at any level). Backend should **not** enforce leaf-only here. |

---

### 8.4 Migration Note — Flat → Hierarchical

The existing Swagger assumes a **flat** `ServiceCategory` with a single `categoryId` field:

```
// BEFORE (flat, Swagger assumption)
CreateProviderServiceDto { categoryId: uuid }   // any category, no depth constraint

// BEFORE (flat, ProviderProfile onboarding)
RegisterProviderRequest { categoryIds: number[] }  // arbitrary flat category ids
```

**After this change:**

| Usage | New rule |
|-------|----------|
| `CreateProviderServiceDto.categoryId` | Must reference a **level-3 leaf** `ServiceCategory.id` |
| `Product.categoryId` (dealer) | Must reference a **level-3 leaf** `ServiceCategory.id` |
| `ProviderProfile.categoryIds[]` (onboarding) | May reference L2 or L3 nodes (provider specialization multi-select; no leaf restriction) |

**Recommended migration path for backend:**
1. Add `parent_id`, `level`, `provider_type_scope`, `is_active`, `sort_order` columns to the `ServiceCategories` table (or equivalent).
2. Backfill existing flat categories as L1 roots (`parentId = null`, `level = 1`).
3. Create L2 and L3 seed data to match the frontend mock tree (`src/shared/mocks/handlers/services.ts` — the 3-level mock tree is the reference).
4. Add a DB constraint or application-layer check: `ProviderService.categoryId` must point to `level = 3`.
5. Update `GET /admin/categories` (and `GET /Services/categories` if it exists) to return the new fields.

---

### 8.5 Frontend Consumption Map

| Frontend screen | Endpoint called | How it uses categories |
|----------------|----------------|----------------------|
| Admin category tree (services tab) | `GET /admin/categories` (no filter) | Full tree for CRUD management |
| `CategoryCascader` — admin services tab | `GET /admin/categories?providerType=workshop` (or relevant type) | 3-step L1→L2→L3 picker; requires L3 leaf selection |
| `CategoryCascader` — dealer product form | `GET /admin/categories?providerType=dealer` | Same cascader; L3 leaf required for `Product.categoryId` |
| Provider onboarding multi-select | `GET /admin/categories?providerType=<type>` | Tree rendered as checkbox tree; L2 or L3 selections allowed; stored as `categoryIds[]` |
| Discovery filter (customer) | `GET /admin/categories?isActive=true&level=1` then `?parentId=<l1Id>` | L1 tabs → L2 filter chips; descendant-aware matching on backend search |
