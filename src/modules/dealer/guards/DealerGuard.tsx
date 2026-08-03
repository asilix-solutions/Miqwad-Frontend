import { Navigate, Outlet } from "react-router-dom";
import { useMyProviderProfileQuery } from "@modules/providers/hooks/useProviderQueries";
import { Spinner } from "@shared/components/ui/spinner";
import { defaultHomeFor, isProviderApproved, resolveProviderType } from "@shared/guards/RoleGuard";
import { useAppSelector } from "@app/store";

export function DealerGuard() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: myProfile, isLoading } = useMyProviderProfileQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8 text-brand-orange" />
      </div>
    );
  }

  // If not a provider or not a dealer, fallback to the role's default home
  if (!user || user.role !== "provider" || resolveProviderType(user, myProfile?.type) !== "dealer") {
    return <Navigate to={defaultHomeFor(user?.role ?? "customer")} replace />;
  }

  // If dealer but not approved, send to pending
  if (!isProviderApproved(user)) {
    return <Navigate to="/provider/pending" replace />;
  }

  return <Outlet />;
}
