/**
 * @file subscriptionDaysLeft.ts
 *
 * Shared helper for computing days remaining on a workshop subscription.
 * Used by WorkshopDashboardPage (KPI card) and WorkshopSubscriptionPage
 * (hero card + progress bar) to keep the number and tone logic consistent.
 */

import type { WorkshopSubscriptionStatus } from "../types";
import type { StatusPillTone } from "@shared/provider-ui";

/**
 * Returns the number of calendar days from now until `endDate` (may be negative
 * if expired). Uses ceiling so a subscription ending tonight still shows 1 day.
 */
export function computeSubscriptionDaysLeft(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

/**
 * Maps days-remaining + status → a StatusPillTone.
 * Thresholds: >7d → success, ≤7d → warning, expired/cancelled/≤0 → danger, pending → info.
 */
export function subscriptionTone(
  status: WorkshopSubscriptionStatus,
  daysLeft: number,
): StatusPillTone {
  if (status === "pending") return "info";
  if (status === "expired" || status === "cancelled" || daysLeft <= 0) return "danger";
  if (daysLeft <= 7) return "warning";
  return "success";
}

/**
 * Maps days-remaining + status → a CSS colour token string for the progress bar.
 */
export function subscriptionProgressColor(
  status: WorkshopSubscriptionStatus,
  daysLeft: number,
): string {
  const tone = subscriptionTone(status, daysLeft);
  if (tone === "success") return "var(--color-success-500)";
  if (tone === "warning") return "var(--color-warning-500)";
  return "var(--color-danger-500)";
}
