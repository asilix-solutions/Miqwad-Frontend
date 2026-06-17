/**
 * Provider domain types.
 *
 * Field shapes mirror the .NET Swagger contract (RegisterProviderRequest,
 * ProviderProfile, Service, CreateServiceRequest, …). A few extension
 * fields (`status`, `categoryIds`, `documents`, `rejectionReason`) are
 * required by the MVP plan but not yet in the Swagger; they will be
 * exposed by the backend once the related endpoints are implemented.
 */

import type { ProviderStatus } from "@modules/auth/types";

/** Provider's KYC document type. */
export type KycDocumentType = "commercial" | "tax" | "identity";

/** Lightweight reference to an uploaded file. */
export interface ProviderDocument {
  type: KycDocumentType;
  fileName: string;
  fileSize: number;
  /** Mock URL or backend-issued public URL. */
  url: string;
  uploadedAt: string;
}

export type ProviderType = "dealer" | "workshop" | "scrap";

/**
 * Profile entity returned by GET /ServiceProviders/{id}/profile.
 * Extended with `status` + `documents` so the admin review screen
 * can render everything from one call.
 */
export interface ProviderProfile {
  id: number;
  type: ProviderType;
  /** Identity link to the User who owns this provider record. */
  userId: string;
  companyName: string;
  email: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  city: string | null;
  workingHours: string | null;
  rating: number;
  totalRatings: number;
  isVerified: boolean;
  status: ProviderStatus;
  /** Service categories the provider covers (FK to ServiceCategory). */
  categoryIds: number[];
  documents: ProviderDocument[];
  rejectionReason: string | null;
  createdAt: string;
  commissionRate?: number;
  photos?: string[];
  specialization?: string;
  brandSpecialization?: string[];
  monthlySales?: number;
  productCategories?: string[];
  productsCount?: number;
  inventoryCount?: number;
}

/**
 * Payload accepted by POST /ServiceProviders/register.
 *
 * Note: backend will derive the `userId` from the JWT, so we don't
 * send it explicitly.
 */
export interface RegisterProviderRequest {
  companyName: string;
  email: string;
  phone: string;
  password: string;
  lat?: number | null;
  lng?: number | null;
  address?: string;
  city?: string;
  workingHours?: string;
  categoryIds?: number[];
  documents?: Array<Pick<ProviderDocument, "type" | "fileName" | "fileSize">>;
}

/** A service a provider offers. Mirrors Swagger `Service`. */
export interface ProviderService {
  id: number;
  providerId: number;
  name: string;
  description: string | null;
  price: number;
  estimatedDuration: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  /** Denormalised display labels resolved by the mock for convenience. */
  categoryName?: string | null;
  subcategoryName?: string | null;
}

export type CreateProviderServiceRequest = Omit<
  ProviderService,
  "id" | "providerId" | "categoryName" | "subcategoryName"
>;

export type UpdateProviderServiceRequest = CreateProviderServiceRequest;
