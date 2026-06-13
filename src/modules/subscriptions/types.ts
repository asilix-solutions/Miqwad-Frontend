/**
 * @file Data types for the Subscriptions module.
 *
 * A Subscription Plan represents an admin-defined tier (e.g., Basic, Pro)
 * that providers can subscribe to.
 */

export type BillingCycle = "monthly" | "yearly";

export interface PlanFeature {
  id: string;
  labelAr: string;
  labelEn: string;
}

export interface SubscriptionPlan {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  price: number;
  billingCycle: BillingCycle;
  features: PlanFeature[];
  isActive: boolean;
  sortOrder?: number | null;
}

// FUTURE: ProviderSubscription { providerId; planId; status; startDate; endDate }
