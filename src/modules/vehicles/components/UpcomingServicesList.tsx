import { useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { cn } from "@shared/lib/utils";
import type { UpcomingService } from "../types";

interface Props {
  services: UpcomingService[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

const URGENCY_STYLES: Record<UpcomingService["urgency"], string> = {
  ok: "border-success-500/20 bg-success-50 text-success-500",
  soon: "border-warning-500/20 bg-warning-50 text-warning-500",
  overdue: "border-danger-500/20 bg-danger-50 text-danger-500",
};

const URGENCY_KEYS: Record<UpcomingService["urgency"], string> = {
  ok: "upcoming.urgencyOk",
  soon: "upcoming.urgencySoon",
  overdue: "upcoming.urgencyOverdue",
};

/**
 * Displays upcoming due-services for a vehicle, color-coded by urgency.
 */
export function UpcomingServicesList({ services, isLoading, isError, onRetry }: Props) {
  const { t } = useTranslation();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (!services || services.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock className="h-6 w-6 text-ink-500" />}
        title={t("upcoming.empty")}
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {services.map((s) => {
        const days = s.daysRemaining;
        let timing: string;
        if (days == null) timing = "—";
        else if (days === 0) timing = t("upcoming.dueToday");
        else if (days < 0) timing = t("upcoming.daysOverdue", { count: Math.abs(days) });
        else timing = t("upcoming.daysRemaining", { count: days });

        return (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-ink-200 bg-white p-4"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border",
                URGENCY_STYLES[s.urgency],
              )}
            >
              <CalendarClock className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink-900 truncate">{s.serviceName}</p>
              <p className="text-xs text-ink-500 mt-0.5 truncate">{timing}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                URGENCY_STYLES[s.urgency],
              )}
            >
              {t(URGENCY_KEYS[s.urgency])}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
