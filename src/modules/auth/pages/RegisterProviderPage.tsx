/**
 * @file /register/{type} — resolves the provider type from the route via
 * resolveProviderType() (Layer 3) and renders the matching signup form
 * (Layer 1 engine + Layer 2 config).
 */

import { Navigate, useParams } from "react-router-dom";
import { RegisterProviderShell } from "../register/RegisterProviderShell";
import { providerRegisterConfigs } from "../register/config";
import { resolveProviderType } from "../register/resolveProviderType";

export function RegisterProviderPage() {
  const { type } = useParams<{ type: string }>();
  const providerType = resolveProviderType(type);

  if (!providerType) {
    return <Navigate to="/register" replace />;
  }

  return <RegisterProviderShell config={providerRegisterConfigs[providerType]} />;
}
