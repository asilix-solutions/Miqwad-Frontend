/**
 * @file Onboarding API layer (mock).
 *
 * Provides simulated async functions for the provider onboarding flow.
 * Each function uses `sleep()` from the shared utils to simulate network
 * latency and returns hard-coded data until the backend endpoints exist.
 */

import { sleep } from "@shared/lib/utils";
import type { AccountSummary, ReviewTimelineItem } from "../types";

// TODO: wire to backend — GET /onboarding/account-summary
export async function getAccountSummary(): Promise<AccountSummary> {
  await sleep(800);
  return {
    accountType: "provider",
    ownerName: "خالد الدوسري",
    email: "khalid@example.com",
    phone: "512345678",
    // TODO: derive from registration payload once backend exposes it
    providerType: "workshop",
  };
}

// TODO: wire to backend — POST /onboarding/documents
export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ fileId: string; fileName: string }> {
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    await sleep(300);
    onProgress?.(Math.round((i / steps) * 100));
  }
  return {
    fileId: crypto.randomUUID(),
    fileName: file.name,
  };
}

// TODO: wire to backend — POST /onboarding/submit-review
export async function submitForReview(): Promise<{ submittedAt: string }> {
  await sleep(1000);
  return { submittedAt: new Date().toISOString() };
}

// TODO: wire to backend — GET /onboarding/review-status
export async function getReviewStatus(): Promise<ReviewTimelineItem[]> {
  await sleep(600);
  return [
    {
      id: "received",
      titleKey: "providers.onboarding.review.received",
      subtitleKey: "",
      state: "done",
    },
    {
      id: "checking",
      titleKey: "providers.onboarding.review.checking",
      subtitleKey: "",
      state: "active",
    },
    {
      id: "notify",
      titleKey: "providers.onboarding.review.notify",
      subtitleKey: "providers.onboarding.review.notifyChannels",
      state: "pending",
    },
  ];
}
