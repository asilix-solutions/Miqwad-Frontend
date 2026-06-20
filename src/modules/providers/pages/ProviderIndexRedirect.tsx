import { Navigate } from "react-router-dom";
import { useMyProviderProfileQuery } from "../hooks/useProviderQueries";
import { PageLoader } from "@shared/components/feedback/PageLoader";

/**
 * Handles routing for the provider index `/provider` by directing them
 * to the correct dashboard based on their profile `type`.
 *
 * This serves as the single source of truth for post-login type-aware routing
 * when `defaultHomeFor` resolves to `/provider`.
 */
export function ProviderIndexRedirect() {
  const { data: myProfile, isLoading } = useMyProviderProfileQuery();

  if (isLoading) {
    return <PageLoader />;
  }

  if (myProfile?.type === "dealer") {
    return <Navigate to="/provider/dealer" replace />;
  }

  return <Navigate to="/provider/services" replace />;
}
