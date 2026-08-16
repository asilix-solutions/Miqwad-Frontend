/**
 * @file productSchema.ts
 * @description Dealer product (provider-service offering) form schema —
 * pick a service, then set price/quantity/notes. `serviceId` stays in the
 * schema for both modes so a single form type covers create and edit; the
 * edit form just never lets the user change it (PUT doesn't accept it).
 */
import { z } from "zod";

export const productSchema = z.object({
  serviceId: z.string().min(1, "dealer.products.validation.serviceRequired"),
  quantity: z.number().int("dealer.products.validation.quantityMin").min(1, "dealer.products.validation.quantityMin"),
  price: z.number().min(0, "dealer.products.validation.priceNonNegative"),
  notes: z.string().max(500, "dealer.products.validation.notesMax").optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
