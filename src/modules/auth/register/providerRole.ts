/**
 * @file Maps a provider type to its backend `UserRole` number. Single
 * source of truth — every place that needs to turn a `ProviderType` into
 * the numeric role the backend expects (register, future admin creation,
 * etc.) should import this instead of re-declaring the mapping.
 * Backend enum: Dealer=2, WorkshopOwner=3, SalvageSpecialist=4.
 * (5=TowTruckDriver exists on the backend but is out of scope here.)
 */

import type { ProviderType } from "@modules/providers/types";

export const PROVIDER_TYPE_TO_ROLE: Record<ProviderType, number> = {
  dealer: 2,
  workshop: 3,
  scrap: 4,
};
