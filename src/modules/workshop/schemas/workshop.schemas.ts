/**
 * @file workshop.schemas.ts
 *
 * Zod schemas for workshop profile editing.
 * Validation message strings are i18n keys — bilingual messages will be
 * wired in the form layer (next round).
 */

import { z } from "zod";

// ── Day schedule ──────────────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const dayHoursSchema = z
  .object({
    isClosed: z.boolean(),
    open: z
      .string()
      .regex(timeRegex, "workshop.profile.validation.invalidTime")
      .optional(),
    close: z
      .string()
      .regex(timeRegex, "workshop.profile.validation.invalidTime")
      .optional(),
  })
  .refine(
    (d) => d.isClosed || (Boolean(d.open) && Boolean(d.close)),
    { message: "workshop.profile.validation.openCloseRequired" },
  );

const weeklyHoursSchema = z.object({
  sat: dayHoursSchema,
  sun: dayHoursSchema,
  mon: dayHoursSchema,
  tue: dayHoursSchema,
  wed: dayHoursSchema,
  thu: dayHoursSchema,
  fri: dayHoursSchema,
});

// ── Specializations ───────────────────────────────────────────────────────────

const workshopServiceTypeSchema = z.enum([
  "mechanical",
  "bodywork",
  "electrical",
  "tires",
  "periodicMaintenance",
]);

const workshopVehicleBrandSchema = z.enum([
  "toyota",
  "hyundai",
  "mercedes",
  "ford",
  "chevrolet",
  "nissan",
  "bmw",
  "other",
]);

const workshopSpecializationsSchema = z.object({
  serviceTypes: z.array(workshopServiceTypeSchema),
  vehicleBrands: z.array(workshopVehicleBrandSchema),
});

// ── Location ──────────────────────────────────────────────────────────────────

const locationSchema = z.object({
  lat: z.number({ error: "workshop.profile.validation.latRequired" }),
  lng: z.number({ error: "workshop.profile.validation.lngRequired" }),
  address: z.string().min(1, "workshop.profile.validation.addressRequired"),
  city: z.string().min(1, "workshop.profile.validation.cityRequired"),
});

// ── Contact ───────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  phone: z.string().min(9, "workshop.profile.validation.phoneRequired"),
  whatsapp: z.string().optional(),
});

// ── Root profile schema ───────────────────────────────────────────────────────

export const workshopProfileSchema = z.object({
  companyName: z.string().min(1, "workshop.profile.validation.companyNameRequired"),
  email: z.string().email("workshop.profile.validation.emailInvalid"),
  bannerUrl: z.string().url("workshop.profile.validation.bannerUrlInvalid").optional(),
  photos: z.array(z.string()),
  workingHours: weeklyHoursSchema,
  location: locationSchema.optional(),
  specializations: workshopSpecializationsSchema,
  contact: contactSchema,
});

export type WorkshopProfileFormValues = z.infer<typeof workshopProfileSchema>;
