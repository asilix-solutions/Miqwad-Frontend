/**
 * @file Layer 3 (part 1) — provider-type → config registry.
 * The single lookup table the resolver and register page use to go from
 * a resolved `ProviderType` to its per-type signup config.
 */

import type { ProviderType } from "@modules/providers/types";
import type { ProviderRegisterConfig } from "./types";
import { workshopRegisterConfig } from "./workshop.config";
import { dealerRegisterConfig } from "./dealer.config";
import { scrapRegisterConfig } from "./scrap.config";

export const providerRegisterConfigs: Record<ProviderType, ProviderRegisterConfig> = {
  workshop: workshopRegisterConfig,
  dealer: dealerRegisterConfig,
  scrap: scrapRegisterConfig,
};

export type { ProviderRegisterConfig, ProviderRegisterFormValues } from "./types";
