/**
 * @file profileImageApi.ts
 *
 * Transport layer for /api/profile/image — the signed-in user's own profile
 * picture. Confirmed live contract:
 *  - GET 404s when no image exists yet; this layer degrades that to `null`
 *    instead of throwing, so callers never treat "no image" as an error.
 *  - POST is create-only (409 if one already exists); PUT replaces cleanly.
 *    Callers must GET first to decide which verb to use.
 *  - DELETE returns 200 with `data: null`, not 204.
 *  - multipart/form-data field name is `File` (capital F).
 */
import { apiClient } from "@shared/lib/axios";
import { AppError } from "@shared/types/api";
import { unwrapEnvelope } from "@modules/auth/api/auth.adapter";
import type { ProfileImage } from "../types";

interface RawProfileImage {
  url?: string | null;
  [key: string]: unknown;
}

function buildImageForm(file: File): FormData {
  const form = new FormData();
  form.append("File", file);
  return form;
}

export const profileImageApi = {
  getImage: async (): Promise<ProfileImage | null> => {
    try {
      const { data } = await apiClient.get("/profile/image");
      const raw = unwrapEnvelope<RawProfileImage>(data);
      return raw?.url ? { url: raw.url } : null;
    } catch (err) {
      if (err instanceof AppError && err.status === 404) return null;
      throw err;
    }
  },

  createImage: async (file: File): Promise<ProfileImage> => {
    const { data } = await apiClient.post("/profile/image", buildImageForm(file), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const raw = unwrapEnvelope<RawProfileImage>(data);
    return { url: raw?.url ?? "" };
  },

  replaceImage: async (file: File): Promise<ProfileImage> => {
    const { data } = await apiClient.put("/profile/image", buildImageForm(file), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const raw = unwrapEnvelope<RawProfileImage>(data);
    return { url: raw?.url ?? "" };
  },

  deleteImage: async (): Promise<void> => {
    await apiClient.delete("/profile/image");
  },
};
