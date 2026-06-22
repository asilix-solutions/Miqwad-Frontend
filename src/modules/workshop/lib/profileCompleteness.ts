/**
 * @file profileCompleteness.ts
 *
 * Pure helper to compute a 0–100 profile completeness integer for a
 * WorkshopProfile. Used by the dashboard KPI card.
 */

import type { DayOfWeek, WorkshopProfile } from "../types";

const ALL_DAYS: DayOfWeek[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

/**
 * Returns true when every day in WeeklyHours is either explicitly closed or
 * has both open and close times set.
 */
function isWeeklyHoursComplete(hours: WorkshopProfile["workingHours"]): boolean {
  return ALL_DAYS.every((day) => {
    const d = hours[day];
    return d.isClosed || (Boolean(d.open) && Boolean(d.close));
  });
}

/**
 * Compute a 0–100 profile completeness score from the structured fields of
 * WorkshopProfile. Six equal-weight checks:
 *
 *   1. bannerUrl present
 *   2. photos array has at least one entry
 *   3. every day in workingHours is isClosed or has open+close
 *   4. location has lat, lng, and address
 *   5. specializations has at least one serviceType or vehicleBrand
 *   6. contact.phone present
 */
export function computeProfileCompleteness(profile: WorkshopProfile | undefined): number {
  if (!profile) return 0;
  const checks = [
    Boolean(profile.bannerUrl),
    profile.photos.length >= 1,
    isWeeklyHoursComplete(profile.workingHours),
    Boolean(profile.location?.lat && profile.location?.lng && profile.location?.address),
    (profile.specializations.serviceTypes.length >= 1 ||
      profile.specializations.vehicleBrands.length >= 1),
    Boolean(profile.contact.phone),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
