/**
 * @file scrap.schemas.ts
 *
 * Zod validation schemas for scrap provider forms.
 * Bilingual validation messages (ar + en) via i18n keys.
 */

import { z } from "zod";

// ── Offer form ────────────────────────────────────────────────────────────────

export const offerSchema = z.object({
  price: z
    .number()
    .positive({ message: "scrap.offer.validation.pricePositive" }),
  note: z.string().max(500).optional(),
  photos: z.array(z.string().url()).optional(),
});

export type OfferFormValues = z.infer<typeof offerSchema>;

// ── Profile form ──────────────────────────────────────────────────────────────

export const scrapProfileSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: "scrap.profile.validation.companyNameRequired" }),
  email: z
    .string()
    .email({ message: "scrap.profile.validation.emailInvalid" })
    .optional()
    .or(z.literal("")),
  bannerUrl: z
    .string()
    .optional()
    .or(z.literal("")),
  "contact.phone": z
    .string()
    .min(9, { message: "scrap.profile.validation.phoneRequired" }),
  "contact.whatsapp": z.string().optional(),
  "location.address": z
    .string()
    .min(1, { message: "scrap.profile.validation.addressRequired" })
    .optional()
    .or(z.literal("")),
  "location.city": z
    .string()
    .min(1, { message: "scrap.profile.validation.cityRequired" })
    .optional()
    .or(z.literal("")),
  "location.lat": z.number().optional(),
  "location.lng": z.number().optional(),
});

export type ScrapProfileFormValues = z.infer<typeof scrapProfileSchema>;
