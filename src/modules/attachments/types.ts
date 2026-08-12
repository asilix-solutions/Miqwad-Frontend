/**
 * @file types.ts
 * @description Domain types for the Attachments admin module. Mirrors the
 * confirmed live `/api/attachments` contract (2026-08-10 probe): the backend
 * returns `id: int64`, `filePath` as a full URL, no approval/status field,
 * and GET never returns `userId` (only POST accepts it as a multipart field).
 */

/** Backend `type` enum on the Attachment entity — meaning unconfirmed by backend team. */
export type AttachmentType = 1 | 2;

/** File-kind bucket derived client-side from `contentType`, used for icons/filters. */
export type AttachmentFileKind = "image" | "pdf" | "doc" | "other";

export interface Attachment {
  id: string;
  originalFileName: string;
  filePath: string;
  contentType: string;
  type: AttachmentType;
  fileSize: number;
  createdAt: string;
  fileKind: AttachmentFileKind;
  /**
   * Confirmed live on POST responses (2026-08-10); assumed present on GET
   * list/detail too since the backend added it globally. Null-tolerant for
   * legacy attachments uploaded before this field existed.
   */
  userName: string | null;
  /**
   * Forward-compat seam only — the backend has no approval workflow today.
   * TODO: wire to backend once a status + transition endpoint exists.
   */
  status?: "pending" | "approved" | "rejected";
}

export interface UploadAttachmentInput {
  file: File;
  userId: number;
}

export interface UpdateAttachmentInput {
  id: string;
  file: File;
}
