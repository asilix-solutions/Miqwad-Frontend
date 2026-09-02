/**
 * @file formatOrderDate.ts
 *
 * One shared, null-safe date formatter for dealer orders (list + detail).
 *
 * The live `/api/Orders` `createdAt` is an ISO string with NO timezone
 * suffix (e.g. `2026-08-30T11:20:00`). `new Date("…no Z…")` already parses
 * that as LOCAL time in every browser, which is what we want — we must NOT
 * coerce it to UTC. Invalid / null / empty input renders as an em dash.
 */

/** Locale-aware absolute date+time, or "—" when the input is not parseable. */
export function formatOrderDate(
  value: string | null | undefined,
  lang: string,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
