/**
 * @file towTruckDate.ts
 * @description Centralized date and time formatting utilities for Tow Truck operations.
 * Strictly separates order creation timestamp (from backend) from queue refresh timestamp.
 * Provides localized absolute date/time and derived relative time.
 */
import { formatDate } from "@shared/lib/formatDate";
import { formatRelativeDate } from "@modules/orders/lib/formatRelativeDate";

export interface TowTruckDateInfo {
  valid: boolean;
  absolute: string;
  relative: string | null;
  iso: string | null;
}

/**
 * Format order creation date reliably with localized absolute and relative outputs.
 * Invalid or missing timestamps return valid: false and fallback to '—'.
 */
export function formatTowTruckOrderDate(
  isoString: string | null | undefined,
  locale: string,
): TowTruckDateInfo {
  if (!isoString || typeof isoString !== "string" || !isoString.trim()) {
    return { valid: false, absolute: "—", relative: null, iso: null };
  }
  const trimmed = isoString.trim();
  const time = Date.parse(trimmed);
  if (!Number.isFinite(time)) {
    return { valid: false, absolute: "—", relative: null, iso: null };
  }
  const date = new Date(time);
  if (isNaN(date.getTime())) {
    return { valid: false, absolute: "—", relative: null, iso: null };
  }

  const absolute = formatDate(trimmed, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const relative = formatRelativeDate(trimmed, locale);

  return {
    valid: true,
    absolute,
    relative,
    iso: date.toISOString(),
  };
}

/**
 * Formats client queue sync timestamp (dataUpdatedAt) as localized time (HH:mm).
 */
export function formatTowTruckSyncTime(
  timestamp: number | null | undefined,
  locale: string,
): string | null {
  if (!timestamp || !Number.isFinite(timestamp) || timestamp <= 0) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp);
  } catch {
    return null;
  }
}
