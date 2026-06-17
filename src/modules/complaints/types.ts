/**
 * @file src/modules/complaints/types.ts
 * @description Types for the complaints module.
 */

export type ComplaintStatus = "new" | "under_review" | "resolved";

export interface Complaint {
  id: string;
  customerName: string;
  title: string;
  body: string;
  status: ComplaintStatus;
  createdAt: string; // ISO
}

export interface ComplaintsQuery {
  page: number;
  pageSize: number;
  status?: ComplaintStatus;
  search?: string;
}
