/**
 * @file offer.schema.ts
 *
 * Zod schema for the dealer Offer create/edit form. Mirrors the confirmed
 * write DTO (`OfferWritePayload` in `../types`):
 *   { title, startDate, endDate, items: [ { providerServiceId, discountAmount } ] }
 *
 * Client-side (per-field) validation runs before submit; the backend's 400
 * body carries a flat array of already-localised strings with NO field keys,
 * so server errors are shown as a form-level banner, not mapped per field.
 *
 * All messages are i18n keys under `dealer.offers.form.validation.*` — resolved
 * bilingually (ar + en) by the form via i18next. `discountAmount > servicePrice`
 * is NOT expressible here (needs the live provider-service price) — the dialog
 * gates that via `computeLinePreview` before submit.
 *
 * Input and output types do not diverge (no `.default` / `.transform`), so a
 * single-generic `useForm<OfferFormValues>` is enough.
 */
import { z } from "zod";

const TITLE_MAX = 150;

/** One discount line in the form. */
export const offerLineSchema = z.object({
  providerServiceId: z
    .string()
    .min(1, "dealer.offers.form.validation.lineServiceRequired"),
  discountAmount: z
    .number("dealer.offers.form.validation.discountRequired")
    .positive("dealer.offers.form.validation.discountPositive"),
});

export const offerFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "dealer.offers.form.validation.titleRequired")
      .max(TITLE_MAX, "dealer.offers.form.validation.titleMax"),
    startDate: z.string().min(1, "dealer.offers.form.validation.startRequired"),
    endDate: z.string().min(1, "dealer.offers.form.validation.endRequired"),
    items: z
      .array(offerLineSchema)
      .min(1, "dealer.offers.form.validation.itemsMin"),
  })
  .refine(
    (v) => !v.startDate || !v.endDate || v.endDate > v.startDate,
    {
      message: "dealer.offers.form.validation.endAfterStart",
      path: ["endDate"],
    },
  );

export type OfferLineFormValues = z.infer<typeof offerLineSchema>;
export type OfferFormValues = z.infer<typeof offerFormSchema>;
