/**
 * @file advertisements.schemas.ts
 *
 * Zod validation schema for the admin Advertisement create/edit form.
 * Bilingual validation messages via i18n keys. The image file is handled
 * as separate local state in AdvertisementFormDialog (react-hook-form does
 * not track File inputs well) — its "required on create" rule is enforced
 * imperatively at submit time, not here.
 */

import { z } from "zod";

export const advertisementFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "superAdmin.ads.validation.titleRequired")
    .max(200, "superAdmin.ads.validation.titleTooLong"),

  deepLink: z
    .string()
    .trim()
    .min(1, "superAdmin.ads.validation.deepLinkRequired")
    .url("superAdmin.ads.validation.deepLinkInvalid"),

  isActive: z.boolean(),
});

export type AdvertisementFormValues = z.infer<typeof advertisementFormSchema>;
