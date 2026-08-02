import axios, { type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@shared/lib/axios";
import { sleep } from "@shared/lib/utils";
import { tryAuthMock } from "./handlers/auth.handlers";
import { tryVehiclesMock } from "./handlers/vehicles.handlers";
import { tryProvidersMock } from "./handlers/providers.handlers";
import { tryDiscoveryMock } from "./handlers/discovery.handlers";
import { tryAdminMock } from "./handlers/admin.handlers";

import { tryAdminNotificationsMock } from "./handlers/admin.notifications.handlers";
import { tryAdminAdsMock } from "./handlers/admin.ads.handlers";
import { tryAdminSettingsMock } from "./handlers/admin.settings.handlers";
import { tryAdminAuditMock } from "./handlers/admin.audit.handlers";
import { tryAdminComplaintsMock } from "./handlers/admin.complaints.handlers";
import { tryDealerMock } from "./handlers/dealer.handlers";
import { tryWorkshopMock } from "./handlers/workshop.handlers";
import { tryScrapMock } from "./handlers/scrap.handlers";

/**
 * Enable the in-process mock adapter.
 *
 * TEMPORARY BRIDGE (Phase 1 of the mock/backend split): the real .NET
 * backend now serves /auth/* directly (see auth.handlers.ts's peeled
 * `/auth/login`), but none of the admin-owned Super Admin endpoints exist
 * on it yet. Rather than gate mocking on one all-or-nothing VITE_USE_MOCKS
 * flag, requests are routed by path prefix:
 *   - admin-owned prefixes → ALWAYS served by the always-mocked handlers,
 *                       no matter what VITE_USE_MOCKS is set to. As each
 *                       real admin endpoint ships, its handler should
 *                       return null so that route falls through to the
 *                       real backend — this bridge shrinks one endpoint at
 *                       a time until it can be deleted entirely.
 *   - everything else → mocked only when VITE_USE_MOCKS=true (unchanged
 *                       behavior), otherwise goes straight to the real
 *                       backend. This is how /auth/* stays real today.
 *
 * Admin-owned prefixes (checked case-insensitively against the URL with
 * leading slashes stripped):
 *   - `admin/`               → Super Admin CRUD: users, providers,
 *                               categories, services, plans, subscriptions,
 *                               cities, brands, models, notifications, ads,
 *                               settings, audit logs, complaints, revenues.
 *   - `services/categories`  → GET Services/categories(/:.../subcategories)
 *                               — the services catalog admin manages,
 *                               also consumed by the provider/customer side.
 *   - `lookups/brands`       → GET Lookups/brands(/:id/models(/:id/years))
 *                               — the vehicle brand/model reference data
 *                               admin manages via `admin/brands` mutations.
 * These three prefixes are handled by tryAdminMock/tryAdminAuditMock/
 * tryAdminComplaintsMock/tryAdminNotificationsMock/tryAdminAdsMock/
 * tryAdminSettingsMock/tryProvidersMock/tryVehiclesMock. tryProvidersMock
 * and tryVehiclesMock also implement non-admin-owned paths (e.g.
 * /ServiceProviders/register, /Vehicles CRUD) — those stay gated by
 * VITE_USE_MOCKS via `otherHandlers`, unaffected by this list.
 *
 * Provider-area prefixes (same always-mocked mechanism, same rationale —
 * these areas have no real backend controllers at all yet):
 *   - `workshop/`  → workshop profile, subscription.
 *   - `scrap/`     → scrap profile, subscription, stats, part-requests,
 *                     escrow.
 *   - `dealer/`    → dealer products, orders, shipments, dues (profile to
 *                     follow). Covers banner/photos/rating/hours/
 *                     specializations/location once those ship per area.
 * As with admin/, this is a TEMPORARY bridge: as each real provider
 * endpoint ships, its handler should return null so that route falls
 * through to the real backend, shrinking this list one endpoint at a time.
 *
 * The mock chain tries each handler in order; the first one to
 * return a non-null response wins. Anything unmatched falls through
 * to the real adapter, so a partially-implemented backend can be
 * wired in piecewise without removing the mocks.
 */

type Handler = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse | null>;

const alwaysMockHandlers: Handler[] = [
  tryAdminMock,
  tryAdminAuditMock,
  tryAdminComplaintsMock,
  tryAdminNotificationsMock,
  tryAdminAdsMock,
  tryAdminSettingsMock,
  tryProvidersMock,
  tryVehiclesMock,
  tryDealerMock,
  tryWorkshopMock,
  tryScrapMock,
];

const otherHandlers: Handler[] = [
  tryAuthMock,
  tryVehiclesMock,
  tryProvidersMock,
  tryDealerMock,
  tryWorkshopMock,
  tryScrapMock,
  tryDiscoveryMock,
];

const ALWAYS_MOCKED_PREFIXES = [
  "admin/",
  "services/categories",
  "lookups/brands",
  "workshop/",
  "scrap/",
  "dealer/",
];

function isAlwaysMockedRequest(config: InternalAxiosRequestConfig): boolean {
  const url = (config.url ?? "").replace(/^\/+/, "").toLowerCase();
  return ALWAYS_MOCKED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function createMockAdapter(realAdapter: AxiosAdapter, mocksEnabled: boolean): AxiosAdapter {
  return async (config) => {
    // Network latency simulation — keeps the UX honest during dev.
    await sleep(350);

    const handlers = isAlwaysMockedRequest(config)
      ? alwaysMockHandlers
      : mocksEnabled
        ? otherHandlers
        : [];
    for (const handler of handlers) {
      const response = await handler(config);
      if (response) return response;
    }
    return realAdapter(config);
  };
}

export function installMocks(): void {
  // Production-safety gate: mocks must NEVER run in a production build, no
  // matter what VITE_USE_MOCKS or ALWAYS_MOCKED_PREFIXES say — those only
  // control behavior *within* dev. import.meta.env.DEV is set by Vite based
  // on the build command (`vite` vs `vite build`), not by any .env file, so
  // it can't be misconfigured. To re-enable mocks in production, remove this
  // guard — nothing else needs to change (all handlers/prefixes stay intact).
  if (!import.meta.env.DEV) return;

  const previous = apiClient.defaults.adapter;
  if (!previous) {
    console.warn("[mocks] No previous adapter found; mocks disabled");
    return;
  }
  // axios.defaults.adapter is a name/array of names (e.g. "xhr" or
  // ["xhr","http","fetch"]) in axios v1, not necessarily a callable
  // function — resolve it once via axios's own adapter registry so the
  // fallthrough call below always has a real AxiosAdapter to invoke.
  let realAdapter: AxiosAdapter;
  try {
    realAdapter = axios.getAdapter(previous);
  } catch (error) {
    console.error("[maqwad] mock: could not resolve real axios adapter for fallthrough", error);
    return;
  }
  const mocksEnabled = Boolean(import.meta.env.VITE_USE_MOCKS) && import.meta.env.VITE_USE_MOCKS !== "false";
  apiClient.defaults.adapter = createMockAdapter(realAdapter, mocksEnabled);
  console.info(
    "%c[maqwad] mock bridge installed — admin/*, services/categories, lookups/brands, workshop/*, scrap/*, dealer/* mocked always, rest mocked=%s",
    "color:#F45E2B;font-weight:600",
    mocksEnabled,
  );
}
