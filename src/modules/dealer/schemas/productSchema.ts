/**
 * Dealer product schema
 */
import { z } from "zod";

export const productSchema = z.object({
  nameAr: z.string().min(1, "dealer.products.validation.nameArRequired"),
  nameEn: z.string().min(1, "dealer.products.validation.nameEnRequired"),
  sku: z.string().min(1, "dealer.products.validation.skuRequired"),
  categoryId: z.string().min(1, "dealer.products.validation.categoryRequired"),
  price: z.number().positive("dealer.products.validation.pricePositive"),
  condition: z.enum(["new"]),
  status: z.enum(["active", "draft", "out_of_stock", "archived"]),
  stockQty: z.number().int().min(0, "dealer.products.validation.stockNonNegative"),
  images: z.array(z.string()).optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
