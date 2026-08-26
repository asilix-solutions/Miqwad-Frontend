/**
 * @file formatRelativeTime.ts
 *
 * Locale-aware "x minutes ago" formatting via Intl.RelativeTimeFormat.
 * Companion to formatDate.ts for timestamps that read better relative to
 * now (notification rows, activity feeds) than as an absolute date.
 */

const formatters = new Map<string, Intl.RelativeTimeFormat>();

const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 31536000 },
  { unit: "month", seconds: 2592000 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
];

export function formatRelativeTime(isoString: string | null | undefined, locale: string): string {
  if (!isoString) return "—";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  if (!formatters.has(locale)) {
    formatters.set(locale, new Intl.RelativeTimeFormat(locale, { numeric: "auto" }));
  }
  const formatter = formatters.get(locale)!;

  const diffSeconds = (date.getTime() - Date.now()) / 1000;
  const absSeconds = Math.abs(diffSeconds);

  for (const { unit, seconds } of UNITS) {
    if (absSeconds >= seconds) {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return formatter.format(Math.round(diffSeconds), "second");
}
