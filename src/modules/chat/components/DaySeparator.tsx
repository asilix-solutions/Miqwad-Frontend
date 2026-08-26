/**
 * @file DaySeparator.tsx
 *
 * Centered subtle date chip separating message groups by day.
 */

import { useTranslation } from "react-i18next";

export interface DaySeparatorProps {
  /** ISO date string (any timestamp within the day). */
  date: string;
}

export function DaySeparator({ date }: DaySeparatorProps) {
  const { t, i18n } = useTranslation();

  const label = formatDayLabel(date, i18n.language, t);

  return (
    <div className="flex items-center justify-center py-2">
      <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-2)] px-3 py-1 text-xs text-[var(--color-muted)]">
        {label}
      </span>
    </div>
  );
}

function formatDayLabel(
  date: string,
  language: string,
  t: (key: string) => string,
): string {
  const target = new Date(date);
  const now = new Date();

  const isSameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(target, now)) return t("chat.dayToday");

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(target, yesterday)) return t("chat.dayYesterday");

  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(target);
}
