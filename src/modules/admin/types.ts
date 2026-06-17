/**
 * Admin domain types.
 *
 * The MVP plan calls for an admin review surface, but the current
 * Swagger does not yet expose admin endpoints. We model the shapes
 * here so the FE can ship today and switch to the real backend by
 * flipping VITE_USE_MOCKS off once the API team publishes them.
 *
 * Expected endpoints (mocked today, real later):
 *   GET    /admin/providers?status=pending|approved|rejected
 *   PATCH  /admin/providers/{id}/approve
 *   PATCH  /admin/providers/{id}/reject  body: { reason: string }
 */

import type { ProviderProfile } from "@modules/providers/types";

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
}

export type AdminProviderStatus = "pending" | "approved" | "rejected" | "all";

/** Re-export so the admin module doesn't need a direct providers import. */
export type AdminProvider = ProviderProfile;

export interface RejectProviderRequest {
  reason: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  phone: string;
  role: "customer" | "provider" | "driver" | "admin" | "super_admin";
  status: "active" | "suspended" | "pending";
}

export interface AdminUserDetail extends AdminUserRow {
  createdAt: string;
  lastActiveAt: string | null;
  email?: string | null;
  ordersCount?: number;
}

export interface MonthlyPoint { month: string; value: number; }
export interface StatusCount  { status: string; count: number; }

export interface DashboardStats {
  totalUsers: number;
  activeProviders: number;
  pendingVerifications: number;
  openDisputes: number;
  monthlyRevenue: number;

  // Trend deltas vs previous month (percentage, can be negative)
  trends?: {
    totalUsers: number;
    activeProviders: number;
    pendingVerifications: number;
    openDisputes: number;
    monthlyRevenue: number;
  };

  // Time series — last 12 months, oldest first
  revenueSeries?: MonthlyPoint[];
  usersSeries?: MonthlyPoint[];

  // Distributions for pie/bar charts
  providerStatusBreakdown?: StatusCount[];
  disputeStatusBreakdown?: StatusCount[];
}


export type EscrowStatus = "held" | "released" | "refunded" | "disputed";

export type DisputeStatus = "open" | "under_review" | "resolved";

export type ResolveDecision = "release_to_provider" | "refund_to_customer" | "partial_refund";

export interface EscrowTransaction {
  id: string;
  orderId: string;
  amount: number;
  status: EscrowStatus;
  createdAt: string;
}

export interface DisputeRecord {
  id: string;
  orderId: string;
  escrowTransactionId: string;
  openedByName: string;
  openedByRole: "customer" | "provider";
  status: DisputeStatus;
  amount: number;
  reason: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolution?: {
    decision: ResolveDecision;
    note: string;
    partialAmount?: number;
  } | null;
}

export interface DisputeEvidence {
  id: string;
  fileUrl: string;
  fileName: string;
  uploadedByRole: "customer" | "provider";
  uploadedAt: string;
}

export interface DisputeDetail extends DisputeRecord {
  evidence: DisputeEvidence[];
}
