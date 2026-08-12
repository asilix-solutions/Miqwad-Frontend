/**
 * @file useAttachmentsQueries.ts
 * @description TanStack Query hooks for the Attachments admin module. No UI
 * here — toasts are wired via the shared toast context so consuming screens
 * don't each have to repeat success/error messaging.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useToast } from "@shared/components/ui/toastContext";
import { attachmentsApi } from "../api/attachmentsApi";
import type { UpdateAttachmentInput, UploadAttachmentInput } from "../types";

export const attachmentKeys = {
  all: ["attachments"] as const,
  lists: () => [...attachmentKeys.all, "list"] as const,
  detail: (id: string) => [...attachmentKeys.all, "detail", id] as const,
};

export function useAttachmentsList() {
  // TODO: replace with server-side GET /api/attachments?userName= when
  // backend supports it — grouping by user is currently done client-side
  // over this same list (see lib/groupByUser.ts).
  return useQuery({
    queryKey: attachmentKeys.lists(),
    queryFn: () => attachmentsApi.list(),
  });
}

export function useAttachment(id: string | null) {
  return useQuery({
    queryKey: id ? attachmentKeys.detail(id) : [...attachmentKeys.all, "detail", "noop"],
    queryFn: () => attachmentsApi.get(id!),
    enabled: id != null,
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ file, userId }: UploadAttachmentInput) => attachmentsApi.upload(file, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: attachmentKeys.lists() });
      toast.success(t("common.saved"));
    },
    onError: () => {
      toast.error(t("common.saveFailed"));
    },
  });
}

export function useUpdateAttachment() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, file }: UpdateAttachmentInput) => attachmentsApi.replace(id, file),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: attachmentKeys.lists() });
      void qc.invalidateQueries({ queryKey: attachmentKeys.detail(variables.id) });
      toast.success(t("common.saved"));
    },
    onError: () => {
      toast.error(t("common.saveFailed"));
    },
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => attachmentsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: attachmentKeys.lists() });
      toast.success(t("common.deleted"));
    },
    onError: () => {
      toast.error(t("common.deleteFailed"));
    },
  });
}
