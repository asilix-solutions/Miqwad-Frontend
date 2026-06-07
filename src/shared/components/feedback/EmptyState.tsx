import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";
import { cn } from "@shared/lib/utils";

interface EmptyStateProps {
  className?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ className, title, description, icon, action }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-ink-200 bg-white p-10 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100">
        {icon ?? <Inbox className="h-6 w-6 text-ink-500" aria-hidden />}
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-base font-semibold text-ink-900">
          {title ?? t("empty.noData")}
        </h3>
        {description && <p className="text-sm text-ink-500 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
