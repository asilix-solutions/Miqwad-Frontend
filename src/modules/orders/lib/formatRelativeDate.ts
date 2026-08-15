/**
 * @file formatRelativeDate.ts
 * @description Locale-aware relative time ("3 days ago" / "منذ 3 أيام") for
 * the orders list createdAt column, backed by `Intl.RelativeTimeFormat`.
 * Feature-scoped (orders only) — mirrors src/modules/addresses/lib/formatRelativeDate.ts.
 */

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

export function formatRelativeDate(isoString: string, locale: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  let duration = (date.getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return formatter.format(Math.round(duration), "years");
}
