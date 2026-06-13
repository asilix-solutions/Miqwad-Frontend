import { z } from "zod";

/** Schema used by the admin reject dialog. */
export const rejectProviderSchema = z.object({
  reason: z
    .string()
    .min(3, { message: "common.requiredField" })
    .max(500),
});

export type RejectProviderFormValues = z.infer<typeof rejectProviderSchema>;

/** Schema used by the admin suspend user dialog. */
export const suspendUserSchema = z.object({
  reason: z
    .string()
    .min(3, { message: "common.requiredField" })
    .max(500),
});

export type SuspendUserFormValues = z.infer<typeof suspendUserSchema>;

/** Schema used by the admin reject settlement dialog. */
export const rejectSettlementSchema = z.object({
  reason: z
    .string()
    .min(3, { message: "common.requiredField" })
    .max(500),
});

export type RejectSettlementFormValues = z.infer<typeof rejectSettlementSchema>;

/** Schema used by the admin resolve dispute dialog. */
export const resolveDisputeSchema = z.object({
  decision: z.enum(["release_to_provider", "refund_to_customer", "partial_refund"], {
    error: "common.requiredField",
  }),
  note: z
    .string()
    .min(3, { message: "common.requiredField" })
    .max(500),
  partialAmount: z.number().optional(),
}).superRefine((data, ctx) => {
  if (data.decision === "partial_refund") {
    if (data.partialAmount === undefined || data.partialAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "common.requiredField",
        path: ["partialAmount"],
      });
    }
  }
});

export type ResolveDisputeFormValues = z.infer<typeof resolveDisputeSchema>;

/** Schema used by the admin category create/edit dialog. */
export const categorySchema = z.object({
  nameAr: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  nameEn: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  iconUrl: z.string().url({ message: "common.invalidUrl" }).optional().or(z.literal("")),
  colorHint: z.enum(["blue", "green", "orange", "purple", "red", "navy"]).optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

/** Schema used by the admin city create/edit dialog. */
export const citySchema = z.object({
  nameAr: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  nameEn: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
});

export type CityFormValues = z.infer<typeof citySchema>;

/** Schema used by the admin brand create/edit dialog. */
export const brandSchema = z.object({
  nameAr: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  nameEn: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
});

export type BrandFormValues = z.infer<typeof brandSchema>;

/** Schema used by the admin model create/edit dialog. */
export const modelSchema = z.object({
  nameAr: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  nameEn: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
});

export type ModelFormValues = z.infer<typeof modelSchema>;

/** Schema used by the admin service create/edit dialog. */
export const serviceSchema = z.object({
  nameAr: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  nameEn: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  categoryId: z.number().positive({ message: "common.requiredField" }),
  basePrice: z.number().min(0, { message: "common.requiredField" }),
  estimatedDuration: z.number().nullable().optional(),
  descriptionAr: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().nullable().optional(),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

/** Schema used by the admin package create/edit dialog. */
export const packageSchema = z.object({
  nameAr: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  nameEn: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  serviceIds: z.array(z.number()).min(1, { message: "common.requiredField" }),
  price: z.number().min(0, { message: "common.requiredField" }),
  descriptionAr: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().nullable().optional(),
});

export type PackageFormValues = z.infer<typeof packageSchema>;

/** Schema used by the admin plan create/edit dialog. */
export const planSchema = z.object({
  nameAr: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  nameEn: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  descriptionAr: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  price: z.number().min(0, { message: "common.requiredField" }),
  billingCycle: z.enum(["monthly", "yearly"]),
  features: z.array(
    z.object({
      id: z.string(),
      labelAr: z.string().min(1, { message: "common.requiredField" }),
      labelEn: z.string().min(1, { message: "common.requiredField" }),
    })
  ),
  isActive: z.boolean(),
  sortOrder: z.number().nullable().optional(),
});

export type PlanFormValues = z.infer<typeof planSchema>;

/** Schema used by the admin notification template create/edit dialog. */
export const templateSchema = z.object({
  nameAr: z.string().min(2, { message: "common.requiredField" }).max(100),
  nameEn: z.string().min(2, { message: "common.requiredField" }).max(100),
  titleAr: z.string().min(2, { message: "common.requiredField" }).max(200),
  titleEn: z.string().min(2, { message: "common.requiredField" }).max(200),
  bodyAr: z.string().min(2, { message: "common.requiredField" }),
  bodyEn: z.string().min(2, { message: "common.requiredField" }),
  variables: z.array(z.string()).optional(),
  channel: z.enum(["in_app", "push", "email", "sms"]),
  isActive: z.boolean(),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

/** Schema used by the admin send notification dialog. */
export const sendNotificationSchema = z.object({
  templateId: z.string().optional().nullable(),
  titleAr: z.string().min(2, { message: "common.requiredField" }).max(200),
  titleEn: z.string().min(2, { message: "common.requiredField" }).max(200),
  bodyAr: z.string().min(2, { message: "common.requiredField" }),
  bodyEn: z.string().min(2, { message: "common.requiredField" }),
  audience: z.enum(["all", "customers", "providers"]),
  channel: z.enum(["in_app", "push", "email", "sms"]),
});

export type SendNotificationFormValues = z.infer<typeof sendNotificationSchema>;

/** Schema used by the admin ad placement create/edit dialog. */
export const placementSchema = z.object({
  code: z.string().min(2, { message: "common.requiredField" }),
  nameAr: z.string().min(2, { message: "common.requiredField" }),
  nameEn: z.string().min(2, { message: "common.requiredField" }),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  isActive: z.boolean(),
});

export type PlacementFormValues = z.infer<typeof placementSchema>;

/** Schema used by the admin ad campaign create/edit dialog. */
export const campaignSchema = z.object({
  titleAr: z.string().min(2, { message: "common.requiredField" }),
  titleEn: z.string().min(2, { message: "common.requiredField" }),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string().optional(),
  targetUrl: z.string().url({ message: "common.invalidUrl" }).optional().or(z.literal("")),
  placementId: z.number({ message: "common.requiredField" }),
  startsAt: z.string().min(1, { message: "common.requiredField" }),
  endsAt: z.string().min(1, { message: "common.requiredField" }),
  status: z.enum(["draft", "scheduled", "active", "paused", "ended"]),
  priority: z.number().optional(),
}).refine(d => !d.startsAt || !d.endsAt || new Date(d.endsAt) >= new Date(d.startsAt), {
  message: "superAdmin.ads.errors.endBeforeStart",
  path: ["endsAt"]
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;
