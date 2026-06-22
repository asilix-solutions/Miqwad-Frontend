/**
 * @file profileCompleteness.ts
 *
 * Pure helper to compute a 0–100 profile completeness integer for a
 * WorkshopProfile. Used by the dashboard KPI card.
 */

import type { WorkshopProfile } from "../types";

/**
 * Compute a 0–100 profile completeness score from filled WorkshopProfile
 * fields. Six checks of equal weight (mapped from spec to actual fields):
 *
 *   phone          → contact.phone present
 *   email          → email present
 *   address        → location/address present
 *   city           → city present
 *   workingHours   → working hours configured
 *   specialization → specialization filled
 */
export function computeProfileCompleteness(profile: WorkshopProfile | undefined): number {
  if (!profile) return 0;
  const checks = [
    Boolean(profile.phone),
    Boolean(profile.email),
    Boolean(profile.address),
    Boolean(profile.city),
    Boolean(profile.workingHours),
    Boolean(profile.specialization),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
