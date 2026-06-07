/**
 * Admin domain types.
 *
 * The MVP plan calls for an admin review surface, but the current
 * Swagger does not yet expose admin endpoints. We model the shapes
 * here so the FE can ship today and switch to the real backend by
 * flipping VITE_USE_MOCKS off once the API team publishes them.
 *
 * Expected endpoints (mocked today, real later):
 *   GET    /admin/providers?status=pending|approved|rejected
 *   PATCH  /admin/providers/{id}/approve
 *   PATCH  /admin/providers/{id}/reject  body: { reason: string }
 */

import type { ProviderProfile } from "@modules/providers/types";

export type AdminProviderStatus = "pending" | "approved" | "rejected" | "all";

/** Re-export so the admin module doesn't need a direct providers import. */
export type AdminProvider = ProviderProfile;

export interface RejectProviderRequest {
  reason: string;
}
