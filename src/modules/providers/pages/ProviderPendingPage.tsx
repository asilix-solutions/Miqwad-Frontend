import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { defaultHomeFor, isProviderApproved, providerHomeFor, resolveProviderType } from "@shared/guards/RoleGuard";
import { Button } from "@/components/ui/button";
import { ProviderStatusBanner } from "../components/ProviderStatusBanner";
import { useAppSelector } from "@app/store";
import { useMyProviderProfileQuery } from "../hooks/useProviderQueries";
import { Spinner } from "@shared/components/ui/spinner";

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
  const { data: myProfile, isLoading } = useMyProviderProfileQuery();

  if (!user || user.role !== "provider") {
    return <Navigate to={defaultHomeFor(user?.role ?? "customer")} replace />;
  }

  // Still fetching profile to determine type
  if (isProviderApproved(user) && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8 text-brand-orange" />
      </div>
    );
  }

  if (isProviderApproved(user)) {
    return <Navigate to={providerHomeFor(resolveProviderType(user, myProfile?.type))} replace />;
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
          <Link to={defaultHomeFor(user?.role ?? "customer")}>{t("providers.backToHome")}</Link>
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
