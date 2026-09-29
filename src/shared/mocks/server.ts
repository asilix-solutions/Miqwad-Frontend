import { mockModeEnabled } from "@shared/config/mockMode";
import axios, {
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { apiClient } from "@shared/lib/axios";
import { sleep } from "@shared/lib/utils";
import { tryAuthMock } from "./handlers/auth.handlers";
import { tryVehiclesMock } from "./handlers/vehicles.handlers";
import { tryProvidersMock } from "./handlers/providers.handlers";
import { tryDiscoveryMock } from "./handlers/discovery.handlers";
import { tryAdminMock } from "./handlers/admin.handlers";

import { tryAdminNotificationsMock } from "./handlers/admin.notifications.handlers";
import { tryAdminSettingsMock } from "./handlers/admin.settings.handlers";
import { tryAdminComplaintsMock } from "./handlers/admin.complaints.handlers";
import { tryDealerMock } from "./handlers/dealer.handlers";
import { tryWorkshopMock } from "./handlers/workshop.handlers";
import { tryScrapMock } from "./handlers/scrap.handlers";

/** Mock responses are opt-in in development, and impossible in production. */
type Handler = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse | null>;

const catalogHandlers: Handler[] = [
  tryAdminMock,
  tryAdminComplaintsMock,
  tryAdminNotificationsMock,
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

const CATALOG_PREFIXES = [
  "admin/",
  "services/categories",
  "lookups/brands",
  "workshop/",
  "scrap/",
  "dealer/",
];

function isCatalogRequest(config: InternalAxiosRequestConfig): boolean {
  const url = (config.url ?? "").replace(/^\/+/, "").toLowerCase();
  return CATALOG_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function createMockAdapter(realAdapter: AxiosAdapter): AxiosAdapter {
  return async (config) => {
    // Network latency simulation — keeps the UX honest during dev.
    await sleep(350);

    const handlers = isCatalogRequest(config) ? catalogHandlers : otherHandlers;
    for (const handler of handlers) {
      const response = await handler(config);
      if (response) return response;
    }
    return realAdapter(config);
  };
}

export function installMocks(): void {
  if (!mockModeEnabled) return;

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
  apiClient.defaults.adapter = createMockAdapter(realAdapter);
  console.info("[maqwad] development mock adapter enabled explicitly");
}
