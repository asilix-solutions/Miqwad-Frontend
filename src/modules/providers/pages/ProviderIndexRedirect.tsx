import { Navigate } from "react-router-dom";
import { useMyProviderProfileQuery } from "../hooks/useProviderQueries";
import { PageLoader } from "@shared/components/feedback/PageLoader";
import { providerHomeFor, resolveProviderType } from "@shared/guards/RoleGuard";
import { useAppSelector } from "@app/store";

/**
 * Handles routing for the provider index `/provider` by directing them
 * to the correct dashboard based on their profile `type`.
 *
 * Delegates to providerHomeFor() as the single source of truth for type-aware routing.
 */
export function ProviderIndexRedirect() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: myProfile, isLoading } = useMyProviderProfileQuery();

  if (isLoading) {
    return <PageLoader />;
  }

  const home = providerHomeFor(user ? resolveProviderType(user, myProfile?.type) : myProfile?.type);
  return <Navigate to={home} replace />;
}
