/**
 * Services catalog domain types.
 * Mirrors Swagger ServiceCategory and ServiceSubcategory.
 */

export interface ServiceCategory {
  id: number;
  nameAr: string;
  nameEn: string;
  /** Backend-issued URL or empty when not provided (we render an icon fallback). */
  iconUrl: string | null;
  /** Optional brand-aligned tint used as card background tone. */
  colorHint?: "blue" | "green" | "orange" | "purple" | "red" | "navy";
}

export interface ServiceSubcategory {
  id: number;
  nameAr: string;
  nameEn: string;
  categoryId: number;
  averagePrice: number | null;
}

export interface Service {
  id: number;
  nameAr: string;
  nameEn: string;
  categoryId: number;
  basePrice: number;
  estimatedDuration?: number | null;
  isActive: boolean;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  sortOrder?: number | null;
}

// FUTURE: ServicePackage { id; nameAr; nameEn; serviceIds: number[] }
// FUTURE: ProviderServiceOverride { providerId; serviceId; price }
