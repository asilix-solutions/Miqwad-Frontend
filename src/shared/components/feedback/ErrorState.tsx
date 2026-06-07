import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";

interface ErrorStateProps {
  className?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ className, title, description, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-danger-500/20 bg-danger-50 p-8 text-center",
        className,
      )}
      role="alert"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[var(--shadow-1)]">
        <AlertTriangle className="h-7 w-7 text-danger-500" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-semibold text-ink-900">
          {title ?? t("errors.networkTitle")}
        </h3>
        <p className="text-sm text-ink-500 max-w-sm">
          {description ?? t("errors.networkSubtitle")}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
