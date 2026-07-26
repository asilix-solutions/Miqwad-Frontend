/**
 * @file Workshop (ورشة) provider signup config — Layer 2 of the register engine.
 */

import { Wrench } from "lucide-react";
import { createProviderRegisterSchema } from "../schemas/providerRegisterBase";
import type { ProviderRegisterConfig } from "./types";

export const workshopRegisterSchema = createProviderRegisterSchema("workshop");

export const workshopRegisterConfig: ProviderRegisterConfig = {
  type: "workshop",
  schema: workshopRegisterSchema,
  icon: Wrench,
  accentClass: "text-[var(--color-brand-blue)]",
  accentBgClass: "bg-[var(--color-brand-blue)]/10",
  titleKey: "providers.registerTypes.workshop.title",
  subtitleKey: "providers.registerTypes.workshop.subtitle",
  companyNameLabelKey: "providers.registerTypes.workshop.companyNameLabel",
  companyNamePlaceholderKey: "providers.registerTypes.workshop.companyNamePlaceholder",
};
