/**
 * @file scrap.schemas.ts
 *
 * Zod validation schemas for scrap provider forms.
 * Bilingual validation messages (ar + en) via i18n keys.
 * All nested objects match react-hook-form register paths (contact.phone, etc.).
 */

import { z } from "zod";
import type { ScrapVehicleBrand } from "../types";

// ── Vehicle brand enum ─────────────────────────────────────────────────────────

const SCRAP_VEHICLE_BRANDS = [
  "toyota",
  "hyundai",
  "mercedes",
  "ford",
  "chevrolet",
  "nissan",
  "bmw",
  "gmc",
  "kia",
  "other",
] as const satisfies readonly ScrapVehicleBrand[];

export { SCRAP_VEHICLE_BRANDS };

// ── Salvage offer form (confirmed CreateOfferDto / UpdateOfferDto fields) ────────

export const salvageOfferSchema = z
  .object({
    providerServiceId: z
      .string()
      .min(1, "scrap.offer.validation.providerServiceRequired"),

    startDate: z
      .string()
      .min(1, "scrap.offer.validation.startDateRequired"),

    endDate: z
      .string()
      .min(1, "scrap.offer.validation.endDateRequired"),
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.endDate ||
      new Date(value.endDate) >= new Date(value.startDate),
    {
      message: "scrap.offer.validation.endDateAfterStart",
      path: ["endDate"],
    },
  );

export type SalvageOfferFormValues = z.infer<typeof salvageOfferSchema>;

// ── Profile form ──────────────────────────────────────────────────────────────

export const scrapProfileSchema = z.object({
  companyName: z
    .string()
    .min(2, "scrap.profile.validation.companyNameRequired"),
  email: z
    .string()
    .email("scrap.profile.validation.emailInvalid")
    .optional()
    .or(z.literal("")),
  bannerUrl: z.string().optional(),
  photos: z.array(z.string()),
  workingHoursLabel: z.string().max(100).optional().or(z.literal("")),
  specializations: z.object({
    vehicleBrands: z
      .array(z.enum(SCRAP_VEHICLE_BRANDS))
      .min(1, "scrap.profile.validation.brandsRequired"),
  }),
  contact: z.object({
    phone: z.string().min(9, "scrap.profile.validation.phoneInvalid"),
    whatsapp: z.string().optional().or(z.literal("")),
  }),
  location: z
    .object({
      address: z.string().optional().or(z.literal("")),
      city: z.string().optional().or(z.literal("")),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
});

export type ScrapProfileFormValues = z.infer<typeof scrapProfileSchema>;
