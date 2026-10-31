/**
 * @file types.ts
 * @description Types, constants, and interfaces for the Admin Brands & Models Workspace.
 */
import type { Brand } from "@modules/vehicles/types";

export type ViewMode = "grid" | "list";
export type BrandFilter = "all" | "popular";

/**
 * Curated list of popular vehicle brands in the Saudi market for quick administrative filtering.
 * Note: Does not claim to represent exact real-time demand metrics, but aids discoverability.
 * IDs match verified live backend records.
 */
export const POPULAR_BRAND_IDS: ReadonlySet<number> = new Set([
  9,  // تويوتا / Toyota
  10, // لكزس / Lexus
  11, // نيسان / Nissan
  13, // هوندا / Honda
  19, // هيونداي / Hyundai
  20, // كيا / Kia
  22, // فورد / Ford
  23, // شيفروليه / Chevrolet
  24, // جي إم سي / GMC
  29, // بي إم دبليو / BMW
  30, // مرسيدس بنز / Mercedes-Benz
  44, // جيلي / Geely
  46, // شانجان / Changan
  48, // إم جي / MG
]);

export interface BrandCardProps {
  brand: Brand;
  isSelected: boolean;
  onSelect: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
  isArabic: boolean;
  modelsCount?: number;
}

export interface BrandRowProps {
  brand: Brand;
  isSelected: boolean;
  onSelect: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
  isArabic: boolean;
  modelsCount?: number;
}
