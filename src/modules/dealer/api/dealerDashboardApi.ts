/** Read-only projection of the fields this dashboard actually consumes. */
import { z } from "zod";
import { apiClient } from "@shared/lib/axios";
import { AppError } from "@shared/types/api";

const dashboardSchema = z.object({
  user: z.object({
    userId: z.number().int().positive(),
    roleId: z.number().int(),
    fullName: z.string().nullable(),
  }),
  providerMetrics: z.object({ totalServices: z.number().int().nonnegative() }).nullable(),
});

const envelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
});

export type DealerDashboardSummary = z.infer<typeof dashboardSchema>;

export async function getDealerDashboardSummary(userId: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<unknown>("/Dashboard/me", { signal });
  const envelope = envelopeSchema.parse(data);
  if (!envelope.success) throw new AppError("Dashboard request failed");
  const summary = dashboardSchema.parse(envelope.data);
  // Never reuse another account's metrics or grant Dealer access from its result.
  if (String(summary.user.userId) !== userId) {
    throw new AppError("Dashboard identity mismatch");
  }
  return summary;
}
