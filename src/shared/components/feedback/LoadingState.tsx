import { useTranslation } from "react-i18next";
import { Spinner } from "@shared/components/ui/spinner";
import { cn } from "@shared/lib/utils";

interface LoadingStateProps {
  className?: string;
  message?: string;
  fullScreen?: boolean;
}

/**
 * Standardised loading state — keeps every page consistent
 * with the Frontend DoD entry "يوجد loading state".
 */
export function LoadingState({ className, message, fullScreen }: LoadingStateProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-ink-500",
        fullScreen ? "min-h-screen" : "py-12",
        className,
      )}
    >
      <Spinner size="lg" />
      <p className="text-sm">{message ?? t("common.loading")}</p>
    </div>
  );
}
