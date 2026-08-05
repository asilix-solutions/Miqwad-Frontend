/**
 * Services catalog domain types.
 * Mirrors Swagger ServiceCategory and ServiceSubcategory.
 */

import type { ProviderType } from "@modules/providers/types";

export interface ServiceCategory {
  id: number;
  nameAr: string;
  nameEn: string;
  /** Backend-issued URL or empty when not provided (we render an icon fallback). */
  iconUrl: string | null;
  /** Optional brand-aligned tint used as card background tone. */
  colorHint?: "blue" | "green" | "orange" | "purple" | "red" | "navy";

  // ── Hierarchy fields (Phase 2) ─────────────────────────────────────────────
  /** null for root (level-1) categories. */
  parentId: number | null;
  /** 1 = root / parent, 2 = child, 3 = sub-child (max depth). */
  level: 1 | 2 | 3;
  /** Limits visibility to one provider type; null = visible to all types. */
  providerTypeScope: ProviderType | null;
  isActive: boolean;
  sortOrder: number;
}

/** Tree node – ServiceCategory with resolved children attached. */
export interface CategoryTreeNode extends ServiceCategory {
  children: CategoryTreeNode[];
}

export interface ServiceSubcategory {
  id: number;
  nameAr: string;
  nameEn: string;
  categoryId: number;
  averagePrice: number | null;
}

/** A priced, bookable offering under a category (distinct from the Service taxonomy node in service.types.ts). */
export interface PricedService {
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


// FUTURE: ProviderServiceOverride { providerId; serviceId; price }
