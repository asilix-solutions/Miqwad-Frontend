/**
 * @file Onboarding flow domain types.
 *
 * Defines the step keys, account summary shape, document upload state,
 * and review-timeline item model used by the provider onboarding module.
 */

// ---------------------------------------------------------------------------
// Step keys
// ---------------------------------------------------------------------------

/** Discriminated step identifier for the onboarding wizard. */
export type OnboardingStepKey = "loading" | "account" | "documents" | "review";

// ---------------------------------------------------------------------------
// Account summary (returned after initial registration)
// ---------------------------------------------------------------------------

export interface AccountSummary {
  accountType: "provider";
  ownerName: string;
  email: string;
  phone: string;
}

// ---------------------------------------------------------------------------
// Document upload
// ---------------------------------------------------------------------------

/** Lifecycle status of a single document upload slot. */
export type DocStatus = "idle" | "uploading" | "done" | "error";

/** A single document slot in the upload list. */
export interface UploadDoc {
  id: string;
  label: string;
  fileName?: string;
  sizeMb?: number;
  /** 0–100 progress percentage. */
  progress: number;
  status: DocStatus;
  kind: "commercial" | "tax" | "identity" | "optional";
  fileExt?: "PDF" | "PNG" | "JPG";
}

// ---------------------------------------------------------------------------
// Review timeline
// ---------------------------------------------------------------------------

/** Visual state of a single review timeline item. */
export type ReviewItemState = "done" | "active" | "pending";

export interface ReviewTimelineItem {
  id: string;
  /** i18n key for the item title. */
  titleKey: string;
  /** i18n key for the item subtitle. */
  subtitleKey: string;
  state: ReviewItemState;
}
