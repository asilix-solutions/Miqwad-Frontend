/**
 * @file Scrap (تشليح) provider signup config — Layer 2 of the register engine.
 */

import { Recycle } from "lucide-react";
import { createProviderRegisterSchema } from "../schemas/providerRegisterBase";
import type { ProviderRegisterConfig } from "./types";

export const scrapRegisterSchema = createProviderRegisterSchema("scrap");

export const scrapRegisterConfig: ProviderRegisterConfig = {
  type: "scrap",
  schema: scrapRegisterSchema,
  icon: Recycle,
  accentClass: "text-emerald-600",
  accentBgClass: "bg-emerald-600/10",
  titleKey: "providers.registerTypes.scrap.title",
  subtitleKey: "providers.registerTypes.scrap.subtitle",
  companyNameLabelKey: "providers.registerTypes.scrap.companyNameLabel",
  companyNamePlaceholderKey: "providers.registerTypes.scrap.companyNamePlaceholder",
};
