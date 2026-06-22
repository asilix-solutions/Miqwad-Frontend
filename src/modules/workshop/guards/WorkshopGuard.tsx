/**
 * @file WorkshopGuard.tsx
 *
 * Route guard for the /provider/workshop/* subtree.
 * Renders children only when the current user is an approved workshop provider.
 * Non-workshop providers are sent to their own default home;
 * unapproved workshop providers land on /provider/pending.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useMyProviderProfileQuery } from "@modules/providers/hooks/useProviderQueries";
import { Spinner } from "@shared/components/ui/spinner";
import { defaultHomeFor } from "@shared/guards/RoleGuard";
import { useAppSelector } from "@app/store";

export function WorkshopGuard() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: myProfile, isLoading } = useMyProviderProfileQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8 text-brand-orange" />
      </div>
    );
  }

  if (!user || user.role !== "provider" || myProfile?.type !== "workshop") {
    return <Navigate to={defaultHomeFor(user?.role ?? "customer")} replace />;
  }

  if (user.providerStatus !== "approved") {
    return <Navigate to="/provider/pending" replace />;
  }

  return <Outlet />;
}
