/**
 * @file ScrapGuard.tsx
 *
 * Route guard for the /provider/scrap/* subtree.
 * Renders children only when the current user is an approved scrap provider.
 * Non-scrap providers are redirected to their own home;
 * unapproved scrap providers land on /provider/pending.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useMyProviderProfileQuery } from "@modules/providers/hooks/useProviderQueries";
import { Spinner } from "@shared/components/ui/spinner";
import { defaultHomeFor, isProviderApproved, resolveProviderType } from "@shared/guards/RoleGuard";
import { useAppSelector } from "@app/store";

export function ScrapGuard() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: myProfile, isLoading } = useMyProviderProfileQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8 text-brand-orange" />
      </div>
    );
  }

  if (!user || user.role !== "provider" || resolveProviderType(user, myProfile?.type) !== "scrap") {
    return <Navigate to={defaultHomeFor(user?.role ?? "customer")} replace />;
  }

  if (!isProviderApproved(user)) {
    return <Navigate to="/provider/pending" replace />;
  }

  return <Outlet />;
}
