/**
 * @file Onboarding API layer (mock).
 *
 * Provides simulated async functions for the provider onboarding flow.
 * Each function uses `sleep()` from the shared utils to simulate network
 * latency and returns hard-coded data until the backend endpoints exist.
 */

import { sleep } from "@shared/lib/utils";
import type { AccountSummary, ReviewTimelineItem } from "../types";
import type { ProviderType } from "@modules/providers/types";

interface StoredUser {
  fullName?: string;
  email?: string | null;
  phoneNumber?: string;
  providerId?: number | null;
}

interface StoredProvidersDb {
  providers?: Record<string, { type?: ProviderType }>;
}

// TODO: wire to backend — GET /onboarding/account-summary
export async function getAccountSummary(): Promise<AccountSummary> {
  await sleep(800);

  let user: StoredUser | null;
  try {
    const raw = localStorage.getItem("maqwad.user");
    user = raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    user = null;
  }

  let providerType: ProviderType | null = null;
  if (user?.providerId != null) {
    try {
      const raw = localStorage.getItem("maqwad.mockProvidersDb");
      const db = raw ? (JSON.parse(raw) as StoredProvidersDb) : null;
      providerType = db?.providers?.[String(user.providerId)]?.type ?? null;
    } catch {
      providerType = null;
    }
  }

  return {
    accountType: "provider",
    ownerName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phoneNumber ?? "",
    providerType,
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
