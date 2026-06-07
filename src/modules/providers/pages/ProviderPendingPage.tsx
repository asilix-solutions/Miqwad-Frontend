import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@shared/components/ui/button";
import { ProviderStatusBanner } from "../components/ProviderStatusBanner";
import { useAppSelector } from "@app/store";

/**
 * /provider/pending — large status screen shown to providers whose
 * application is awaiting review or has been rejected.
 *
 * Approved providers don't belong here; we bounce them straight to
 * their services dashboard.
 */
export function ProviderPendingPage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);

  if (!user || user.role !== "provider") {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (user.providerStatus === "approved") {
    return <Navigate to="/provider/services" replace />;
  }

  const isRejected = user.providerStatus === "rejected";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
          {isRejected ? t("providers.rejectedTitle") : t("providers.pendingTitle")}
        </h1>
      </header>

      <ProviderStatusBanner
        status={user.providerStatus ?? "pending"}
        rejectionReason={user.providerRejectionReason}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline">
          <Link to="/app/dashboard">{t("providers.backToHome")}</Link>
        </Button>
        {isRejected && (
          <Button asChild>
            <Link to="/provider/register">{t("providers.resubmit")}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProviderPendingPage;
