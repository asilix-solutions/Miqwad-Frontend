import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Spinner } from "@shared/components/ui/spinner";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { defaultHomeFor, isProviderApproved } from "@shared/guards/RoleGuard";
import { useAppSelector } from "@app/store";
import { useDealerDashboardQuery } from "../hooks/useDealerDashboardQuery";

/** Used only for older sessions that lack the provider subtype. */
function ResolveDealerContext() {
  const { t } = useTranslation();
  const query = useDealerDashboardQuery();
  if (query.isLoading) {
    return (
      <div
        className="flex min-h-[400px] items-center justify-center"
        role="status"
        aria-label={t("common.loading")}
      >
        <Spinner className="text-brand-orange h-8 w-8" />
      </div>
    );
  }
  if (!query.data || query.data.user.roleId !== 2) {
    return (
      <ErrorState
        title={t("dealer.dashboard.contextUnavailable")}
        description={t("dealer.dashboard.contextUnavailableHint")}
        onRetry={() => void query.refetch()}
      />
    );
  }
  return <Outlet />;
}

export function DealerGuard() {
  const user = useAppSelector((state) => state.auth.user);
  if (!user || user.role !== "provider") {
    return <Navigate to={defaultHomeFor(user?.role ?? "customer")} replace />;
  }
  if (user.providerType && user.providerType !== "dealer") {
    return <Navigate to={defaultHomeFor(user.role)} replace />;
  }
  if (!isProviderApproved(user)) {
    return <Navigate to="/provider/pending" replace />;
  }
  // The login session already resolves normal Dealer accounts. An optional,
  // obsolete /provider/me request must never hold their route behind a spinner.
  return user.providerType === "dealer" ? <Outlet /> : <ResolveDealerContext />;
}
