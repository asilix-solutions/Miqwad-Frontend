/**
 * @file Dealer (تاجر) provider signup config — Layer 2 of the register engine.
 */

import { z } from "zod";
import { Store } from "lucide-react";
import { providerRegisterBaseFields } from "../schemas/providerRegisterBase";
import type { ProviderRegisterConfig } from "./types";

export const dealerRegisterSchema = z.object({
  type: z.literal("dealer"),
  ...providerRegisterBaseFields,
});

export const dealerRegisterConfig: ProviderRegisterConfig = {
  type: "dealer",
  schema: dealerRegisterSchema,
  icon: Store,
  accentClass: "text-[var(--color-brand-orange)]",
  accentBgClass: "bg-[var(--color-brand-orange)]/10",
  titleKey: "providers.registerTypes.dealer.title",
  subtitleKey: "providers.registerTypes.dealer.subtitle",
  companyNameLabelKey: "providers.registerTypes.dealer.companyNameLabel",
  companyNamePlaceholderKey: "providers.registerTypes.dealer.companyNamePlaceholder",
};
