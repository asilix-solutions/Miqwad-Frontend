/**
 * @file TanStack Query hook for the onboarding review status timeline.
 *
 * Wraps `getReviewStatus` from the onboarding API layer. Refetches
 * periodically while the review is still in progress.
 */

import { useQuery } from "@tanstack/react-query";
import { getReviewStatus } from "../api/onboarding.api";
import type { ReviewTimelineItem } from "../types";
import { onboardingKeys } from "./useAccountSummary";

export function useReviewStatus(enabled = true) {
  return useQuery<ReviewTimelineItem[]>({
    queryKey: onboardingKeys.reviewStatus(),
    queryFn: getReviewStatus,
    enabled,
    /** Poll every 30 s while the user is on the review screen. */
    refetchInterval: 30_000,
  });
}
