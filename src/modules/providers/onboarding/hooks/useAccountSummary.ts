/**
 * @file TanStack Query hook for the provider account summary.
 *
 * Wraps `getAccountSummary` from the onboarding API layer, providing
 * automatic caching, background refetching, and error/loading states.
 */

import { useQuery } from "@tanstack/react-query";
import { getAccountSummary } from "../api/onboarding.api";
import type { AccountSummary } from "../types";

/** Query-key factory for onboarding queries. */
export const onboardingKeys = {
  all: ["onboarding"] as const,
  accountSummary: () => [...onboardingKeys.all, "accountSummary"] as const,
  reviewStatus: () => [...onboardingKeys.all, "reviewStatus"] as const,
};

export function useAccountSummary() {
  return useQuery<AccountSummary>({
    queryKey: onboardingKeys.accountSummary(),
    queryFn: getAccountSummary,
  });
}
