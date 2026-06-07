import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { ProviderStatus } from "@modules/auth/types";
import { cn } from "@shared/lib/utils";

/**
 * Large alert shown on the "Provider Pending" screen and at the
 * top of the provider services page until the account is approved.
 */
interface Props {
  status: ProviderStatus;
  rejectionReason?: string | null;
  className?: string;
}

export function ProviderStatusBanner({ status, rejectionReason, className }: Props) {
  const { t } = useTranslation();

  if (status === "approved") {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] bg-success-50 border border-success-500/30 p-4 sm:p-5 flex items-start gap-3",
          className,
        )}
        role="status"
      >
        <CheckCircle2 className="h-5 w-5 text-success-500 mt-0.5 shrink-0" />
        <p className="text-sm text-ink-700">{t("providers.approvedBanner")}</p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] bg-danger-50 border border-danger-500/30 p-4 sm:p-5 flex items-start gap-3",
          className,
        )}
        role="alert"
      >
        <AlertCircle className="h-5 w-5 text-danger-500 mt-0.5 shrink-0" />
        <div className="space-y-1 min-w-0">
          <h3 className="font-display text-base font-semibold text-ink-900">
            {t("providers.rejectedTitle")}
          </h3>
          <p className="text-sm text-ink-700">{t("providers.rejectedMessage")}</p>
          {rejectionReason && (
            <p className="text-sm text-ink-700">
              <span className="font-semibold">{t("providers.rejectedReason")}: </span>
              {rejectionReason}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] bg-warning-50 border border-warning-500/30 p-4 sm:p-5 flex items-start gap-3",
        className,
      )}
      role="status"
    >
      <Clock className="h-5 w-5 text-warning-500 mt-0.5 shrink-0" />
      <div className="space-y-1 min-w-0">
        <h3 className="font-display text-base font-semibold text-ink-900">
          {t("providers.pendingTitle")}
        </h3>
        <p className="text-sm text-ink-700">{t("providers.pendingMessage")}</p>
      </div>
    </div>
  );
}
