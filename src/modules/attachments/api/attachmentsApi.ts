/**
 * @file attachmentsApi.ts
 * @description Transport layer for the real `/api/attachments` endpoints.
 * Confirmed live contract (2026-08-10): POST/PUT are multipart (`File` +
 * `UserId` on create only); GET list returns a direct `Attachment[]`, not a
 * paginated envelope; DELETE returns `data: null` (still standard `unwrap`,
 * not `unwrapVoid`, since the response is still a 200 envelope).
 */
import { apiClient } from "@shared/lib/axios";
import { adaptRawAttachment, type ApiEnvelope, type RawAttachment } from "../lib/attachmentAdapter";
import type { Attachment } from "../types";

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

export const attachmentsApi = {
  list: async (): Promise<Attachment[]> => {
    const { data } = await apiClient.get<ApiEnvelope<RawAttachment[]>>("/attachments");
    const payload = unwrap(data);
    const rawItems = Array.isArray(payload) ? payload : [];
    return rawItems.map(adaptRawAttachment);
  },

  get: async (id: string): Promise<Attachment> => {
    const { data } = await apiClient.get<ApiEnvelope<RawAttachment>>(`/attachments/${id}`);
    return adaptRawAttachment(unwrap(data));
  },

  upload: async (file: File, userId: number): Promise<Attachment> => {
    const form = new FormData();
    form.append("File", file);
    form.append("UserId", String(userId));
    const { data } = await apiClient.post<ApiEnvelope<RawAttachment>>("/attachments", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return adaptRawAttachment(unwrap(data));
  },

  replace: async (id: string, file: File): Promise<Attachment> => {
    const form = new FormData();
    form.append("File", file);
    const { data } = await apiClient.put<ApiEnvelope<RawAttachment>>(`/attachments/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return adaptRawAttachment(unwrap(data));
  },

  remove: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiEnvelope<null>>(`/attachments/${id}`);
    unwrap(data);
  },
};
