/**
 * @file attachmentSchemas.ts
 * @description Zod schemas for the attachments upload/replace dialog. Error
 * `message` values are i18n keys (not literal text) — call sites resolve
 * them with `t(errors.field.message)`, matching the rest of the codebase.
 */
import { z } from "zod";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const uploadFileSchema = z
  .instanceof(File, { message: "attachments.errors.fileRequired" })
  .refine((file) => file.size > 0, { message: "attachments.errors.fileRequired" })
  .refine((file) => file.size <= MAX_SIZE_BYTES, { message: "attachments.errors.fileTooLarge" })
  .refine((file) => ACCEPTED_MIME_TYPES.includes(file.type), {
    message: "attachments.errors.fileTypeInvalid",
  });

export const uploadAttachmentSchema = z.object({
  file: uploadFileSchema,
  userId: z
    .number({ message: "attachments.errors.ownerRequired" })
    .int()
    .positive({ message: "attachments.errors.ownerRequired" }),
});

export type UploadAttachmentFormValues = z.infer<typeof uploadAttachmentSchema>;

export const replaceAttachmentSchema = z.object({
  file: uploadFileSchema,
});

export type ReplaceAttachmentFormValues = z.infer<typeof replaceAttachmentSchema>;
