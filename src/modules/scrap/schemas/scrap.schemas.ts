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

// ── Salvage quotation form (live /api/request-quotations contract) ─────────────
//
// Quantity & Price are intentionally NOT in this schema — the server enforces
// them with a whole-number binder (int >= 1; decimals 400), but both are
// hidden in the UI per product decision and injected as whole-number
// placeholders at submit (see requestQuotationsApi).

export const quotationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "scrap.offer.validation.nameRequired")
    .max(150, "scrap.offer.validation.nameTooLong"),

  notes: z
    .string()
    .trim()
    .max(2000, "scrap.offer.validation.notesTooLong")
    .optional()
    .or(z.literal("")),

  isCompatibleWith: z
    .string()
    .trim()
    .max(500, "scrap.offer.validation.isCompatibleWithTooLong")
    .optional()
    .or(z.literal("")),
});

export type QuotationFormValues = z.infer<typeof quotationFormSchema>;

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
