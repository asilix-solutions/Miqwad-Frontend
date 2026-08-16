/**
 * @file types.ts
 * @description Frontend Address model for the admin Addresses module,
 * backed by the real /api/Addresses backend.
 */
import type { PaginatedResponse } from "@shared/types/api";

export interface Address {
  id: string;
  userId: string;
  title: string;
  description: string;
  shortNumber: string;
  longitude: number;
  latitude: number;
  createdAt: string;
}

export interface WriteAddressInput {
  title: string;
  description: string;
  shortNumber: string;
  longitude: number;
  latitude: number;
}

export type AddressesPage = PaginatedResponse<Address>;
