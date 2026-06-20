import { useQuery } from "@tanstack/react-query";
import { providersApi } from "../api/providersApi";

/**
 * Read-side queries for the providers module.
 */
export const providersKeys = {
  all: ["providers"] as const,
  profile: (id: number) => [...providersKeys.all, "profile", id] as const,
  myProfile: () => [...providersKeys.all, "profile", "me"] as const,
  services: (id: number) => [...providersKeys.all, "services", id] as const,
};

export function useMyProviderProfileQuery() {
  return useQuery({
    queryKey: providersKeys.myProfile(),
    queryFn: () => providersApi.myProfile(),
    retry: false, // Don't loop if unauthenticated or not a provider
  });
}

export function useProviderProfileQuery(providerId: number | null) {
  return useQuery({
    queryKey: providerId
      ? providersKeys.profile(providerId)
      : ["providers", "profile", "noop"],
    queryFn: () => providersApi.profile(providerId!),
    enabled: providerId != null && providerId > 0,
  });
}

export function useProviderServicesQuery(providerId: number | null) {
  return useQuery({
    queryKey: providerId
      ? providersKeys.services(providerId)
      : ["providers", "services", "noop"],
    queryFn: () => providersApi.listServices(providerId!),
    enabled: providerId != null && providerId > 0,
  });
}
