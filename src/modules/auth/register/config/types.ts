/**
 * @file Shared config contract for the per-type provider signup engine.
 * Each provider type (workshop/dealer/scrap) supplies one of these so the
 * engine (RegisterProviderShell + useRegisterProviderForm) can render an
 * on-brand, type-aware signup form from a single implementation.
 */

import type { ZodType } from "zod";
import type { LucideIcon } from "lucide-react";
import type { ProviderType } from "@modules/providers/types";

/** Fields collected by the signup engine, shared across all provider types. */
export interface ProviderRegisterFormValues {
  type: ProviderType;
  companyName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsOfServiceAccepted: boolean;
}

export interface ProviderRegisterConfig {
  type: ProviderType;
  schema: ZodType<ProviderRegisterFormValues, ProviderRegisterFormValues>;
  /** Large distinctive icon shown in the form panel. */
  icon: LucideIcon;
  /** Tailwind text-color utility class for the per-type accent (icon/heading/hover). */
  accentClass: string;
  /** Tailwind bg-color utility class (soft tint) for the icon badge background. */
  accentBgClass: string;
  titleKey: string;
  subtitleKey: string;
  companyNameLabelKey: string;
  companyNamePlaceholderKey: string;
}
