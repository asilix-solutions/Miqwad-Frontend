/**
 * @file attachmentAdapter.ts
 * @description Translation boundary between the real `/api/attachments`
 * backend and the internal `Attachment` model. Confirmed live contract
 * (2026-08-10): `{ id, originalFileName, filePath, contentType, type,
 * fileSize, createdAt }` — direct array on GET list (no pagination), no
 * `status`/approval field, GET never returns `userId`.
 */
import type { Attachment, AttachmentFileKind } from "../types";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}

export interface RawAttachment {
  id: number;
  originalFileName?: string | null;
  filePath?: string | null;
  contentType?: string | null;
  type?: number | null;
  fileSize?: number | null;
  createdAt?: string | null;
  userName?: string | null;
  [key: string]: unknown;
}

const IMAGE_MIME_PREFIXES = ["image/"];
const DOC_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** Derives the client-side icon/filter bucket from a raw MIME type. Never throws. */
export function fileKindFromContentType(contentType: string | null | undefined): AttachmentFileKind {
  const mime = contentType ?? "";
  if (IMAGE_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))) return "image";
  if (mime === "application/pdf") return "pdf";
  if (DOC_MIME_TYPES.includes(mime)) return "doc";
  return "other";
}

/**
 * Adapts one raw backend attachment into the internal `Attachment` shape.
 * Never throws — falls back to empty/neutral values so a malformed item
 * can't crash the grid render.
 */
export function adaptRawAttachment(raw: RawAttachment): Attachment {
  const contentType = raw.contentType ?? "";
  return {
    id: String(raw.id ?? ""),
    originalFileName: raw.originalFileName ?? "",
    filePath: raw.filePath ?? "",
    contentType,
    type: raw.type === 2 ? 2 : 1,
    fileSize: typeof raw.fileSize === "number" ? raw.fileSize : 0,
    createdAt: raw.createdAt ?? new Date(0).toISOString(),
    fileKind: fileKindFromContentType(contentType),
    userName: raw.userName && raw.userName.trim() ? raw.userName : null,
  };
}

/** Human-readable size (B/KB/MB), used on attachment cards. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
