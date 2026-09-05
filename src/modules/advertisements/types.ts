/**
 * @file types.ts
 *
 * Admin Advertisements domain types (.NET-ready), for the live
 * `/api/Advertisement` CRUD endpoint. Single flat resource — no
 * campaigns/placements split, no status enum, no scheduling/priority,
 * no bilingual fields.
 */

export type { PaginatedResponse } from "@shared/types/api";

/** Raw shape returned by GET /api/Advertisement (list item and detail). */
export interface RawAdvertisement {
  id: string;
  title: string;
  image: string;
  deepLink: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** View-model adapted from {@link RawAdvertisement}. Currently a 1:1 passthrough. */
export interface Advertisement {
  id: string;
  title: string;
  image: string;
  deepLink: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Query params for GET /api/Advertisement. SortBy is best-effort (unvalidated server-side). */
export interface AdvertisementsListParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

/** Fields the create/edit form collects. `image` is a new File only when replacing/uploading. */
export interface AdvertisementFormInput {
  title: string;
  deepLink: string;
  isActive: boolean;
  image?: File;
}

/** POST /api/Advertisement input (multipart) — Image is required on create. */
export interface CreateAdvertisementInput extends AdvertisementFormInput {
  image: File;
}

/** PUT /api/Advertisement/{id} input (multipart) — id is path-bound; Image optional (keeps current if omitted). */
export type UpdateAdvertisementInput = AdvertisementFormInput;
