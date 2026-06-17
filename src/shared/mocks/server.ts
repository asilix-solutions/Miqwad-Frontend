import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
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

/**
 * Conditionally enable the in-process mock adapter.
 * Activated whenever VITE_USE_MOCKS=true (default in dev until the
 * .NET backend exposes /auth/*, /Vehicles/*, /Lookups/* endpoints
 * described in the MVP plan).
 *
 * The mock chain tries each handler in order; the first one to
 * return a non-null response wins. Anything unmatched falls through
 * to the real adapter, so a partially-implemented backend can be
 * wired in piecewise without removing the mocks.
 */

type Handler = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse | null>;

function createMockAdapter(realAdapter: AxiosAdapter, handlers: Handler[]): AxiosAdapter {
  return async (config) => {
    // Network latency simulation — keeps the UX honest during dev.
    await sleep(350);

    for (const handler of handlers) {
      const response = await handler(config);
      if (response) return response;
    }
    return realAdapter(config);
  };
}

export function installMocks(): void {
  if (!import.meta.env.VITE_USE_MOCKS || import.meta.env.VITE_USE_MOCKS === "false") {
    return;
  }
  const previous = apiClient.defaults.adapter as
    | import("axios").AxiosAdapter
    | undefined;
  if (!previous) {
    console.warn("[mocks] No previous adapter found; mocks disabled");
    return;
  }
  apiClient.defaults.adapter = createMockAdapter(previous, [
    tryAdminMock,
    tryAdminAuditMock,
    tryAdminComplaintsMock,
    tryAdminNotificationsMock,
    tryAdminAdsMock,
    tryAdminSettingsMock,
    tryAuthMock,
    tryVehiclesMock,
    tryProvidersMock,
    tryDiscoveryMock,
  ]);
  console.info("%c[maqwad] mock API enabled", "color:#F45E2B;font-weight:600");
}
