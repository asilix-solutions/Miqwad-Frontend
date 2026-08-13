/**
 * @file addressAdapter.ts
 * @description Single translation boundary between raw /api/Addresses
 * payloads (numeric ids) and the internal Address model (string ids).
 * Never throws — malformed raw items fall back to neutral values.
 */
import type { RawAddress, AddressWritePayload } from "../api/addressesApi";
import type { Address, WriteAddressInput } from "../types";

export function adaptRawAddress(raw: RawAddress): Address {
  return {
    id: String(raw?.id ?? ""),
    userId: String(raw?.userId ?? ""),
    title: raw?.title ?? "",
    description: raw?.description ?? "",
    shortNumber: raw?.shortNumber ?? "",
    longitude: raw?.longitude ?? 0,
    latitude: raw?.latitude ?? 0,
    createdAt: raw?.createdAt ?? "",
  };
}

export function adaptToWritePayload(input: WriteAddressInput): AddressWritePayload {
  return {
    title: input.title,
    description: input.description,
    shortNumber: input.shortNumber,
    longitude: input.longitude,
    latitude: input.latitude,
  };
}
