/**
 * @file useProfileImage.ts
 *
 * TanStack Query hooks for the signed-in user's own profile image
 * (/api/profile/image). Role-neutral, silent — no toasts here.
 *
 * Upload is GET-then-verb: the backend's POST is create-only (409 if an
 * image already exists) and PUT replaces, so every upload first checks
 * whether an image exists and picks the right verb.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileImageApi } from "../api/profileImageApi";

export const profileImageKeys = {
  all: ["profile", "image"] as const,
};

export function useProfileImageQuery() {
  return useQuery({
    queryKey: profileImageKeys.all,
    queryFn: () => profileImageApi.getImage(),
  });
}

export function useUploadProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const existing = await profileImageApi.getImage();
      return existing ? profileImageApi.replaceImage(file) : profileImageApi.createImage(file);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileImageKeys.all });
    },
  });
}

export function useDeleteProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => profileImageApi.deleteImage(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileImageKeys.all });
    },
  });
}
