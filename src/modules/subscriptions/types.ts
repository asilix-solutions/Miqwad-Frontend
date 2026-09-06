/**
 * @file Data types for the Subscriptions module (admin Super Admin panel).
 *
 * Built to the CONFIRMED live backend shape (write-probe 2026-09-05), NOT to
 * Swagger — Swagger's response examples lie about enum wire types. See
 * `scratchpad/SUBSCRIPTIONS_DIAGNOSIS.md`.
 *
 * Real endpoints:
 *   - GET/POST         /api/SubscriptionPlans
 *   - GET/PUT          /api/SubscriptionPlans/{id}
 *   - PATCH            /api/SubscriptionPlans/{id}/activate
 *   - PATCH            /api/SubscriptionPlans/{id}/deactivate
 *   - GET              /api/ProviderSubscriptions        (read-only for us)
 *   - GET              /api/ProviderSubscriptions/{id}
 *
 * There is NO DELETE for plans and NO cancel/update for provider
 * subscriptions on the real backend — do not model them.
 */

// =============================================================================
// Enum wire types + isolated mappings
// =============================================================================

/**
 * `billingCycle` is a raw int on the wire (values [1, 2]), never a string.
 *
 * TODO: confirm enum mapping with backend team (write-probe could not prove
 * it — the backend does not validate the range or expose varnames; this is
 * convention only). Flip in this ONE place if it turns out reversed.
 */
export const BILLING_CYCLE = {
  monthly: 1,
  yearly: 2,
} as const;

export type BillingCycleValue = (typeof BILLING_CYCLE)[keyof typeof BILLING_CYCLE];

/** Reverse lookup: wire int -> stable key (for i18n / display). */
export const BILLING_CYCLE_LABEL_KEY: Record<number, "monthly" | "yearly"> = {
  [BILLING_CYCLE.monthly]: "monthly",
  [BILLING_CYCLE.yearly]: "yearly",
};

/**
 * `status` on ProviderSubscription is a raw int enum (values [1, 2]).
 *
 * TODO: confirm enum mapping with backend team (0 live rows existed at probe
 * time; meaning of 1/2 is UNCONFIRMED — convention only). Flip here if wrong.
 */
export const SUBSCRIPTION_STATUS = {
  active: 1,
  expired: 2,
} as const;

export type SubscriptionStatusValue =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/** Reverse lookup: wire int -> stable key (for i18n / display). */
export const SUBSCRIPTION_STATUS_LABEL_KEY: Record<number, "active" | "expired"> = {
  [SUBSCRIPTION_STATUS.active]: "active",
  [SUBSCRIPTION_STATUS.expired]: "expired",
};

// =============================================================================
// SubscriptionPlan — list row === detail (backend returns no extra fields)
// =============================================================================

/**
 * Exhaustive response DTO for `GET /api/SubscriptionPlans[/{id}]`.
 * Plans have NO `status` field — only `isActive`.
 * `createdAt` / `updatedAt` come back WITHOUT a 'Z'/offset and are
 * normalised to UTC ISO strings by the api layer.
 */
export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string | null;
  /** TRUE decimal (99.50 preserved) — not int-bound. */
  price: number;
  /** Raw int enum [1, 2] — never a string. See {@link BILLING_CYCLE}. */
  billingCycle: number;
  isActive: boolean;
  /** ISO string, normalised to UTC by the api layer. */
  createdAt: string;
  /** ISO string (UTC-normalised) or null. */
  updatedAt: string | null;
}

/**
 * Create/Update payload for `POST /api/SubscriptionPlans` and
 * `PUT /api/SubscriptionPlans/{id}`. Send ONLY these — the backend silently
 * ignores extras.
 */
export interface SubscriptionPlanWritePayload {
  name: string;
  description?: string | null;
  price?: number;
  billingCycle: number;
}

// =============================================================================
// ProviderSubscription — read-only
// =============================================================================

/**
 * Exhaustive response DTO for `GET /api/ProviderSubscriptions[/{id}]`.
 * Real fields ONLY — there is no `providerType`, `price`, or `billingCycle`
 * on this DTO (those live on SubscriptionPlan and would need a join).
 */
export interface ProviderSubscription {
  id: number;
  userId: number;
  userFullName: string | null;
  subscriptionPlanId: number;
  subscriptionPlanName: string | null;
  /** ISO string, UTC-normalised by the api layer. */
  startDate: string;
  /** ISO string, UTC-normalised by the api layer. */
  endDate: string;
  /** Raw int enum [1, 2]. See {@link SUBSCRIPTION_STATUS}. */
  status: number;
  /** ISO string, UTC-normalised by the api layer. */
  createdAt: string;
  /** ISO string (UTC-normalised) or null. */
  updatedAt: string | null;
}
