/**
 * @file types.ts
 * Reference-data domain types (car makes / models).
 * Contract is .NET-ready: string ids, camelCase, bilingual labels.
 * The external NHTSA source is an implementation detail hidden in the adapter.
 */

export interface CarMake {
  /** Stable string id (from source). .NET will supply its own — shape is identical. */
  id: string;
  nameEn: string;
  nameAr: string;
}

export interface CarModel {
  id: string;
  makeId: string;
  nameEn: string;
  nameAr: string;
}
