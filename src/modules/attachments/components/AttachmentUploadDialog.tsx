/**
 * @file AttachmentUploadDialog.tsx
 * @description Upload/replace dialog for attachments. In "upload" mode
 * collects a file + owner (via a searchable Combobox over the real
 * `/api/Users` list, reused from the admin module rather than duplicating
 * it). In "replace" mode only the file is collected — the confirmed
 * `PUT /api/attachments/{id}` contract takes `File` only, no `UserId`.
 */
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FileUpload } from "@shared/components/ui/fileUpload";
import { useUsersQuery } from "@modules/admin/hooks/useAdminQueries";
import { useUploadAttachment, useUpdateAttachment } from "../hooks/useAttachmentsQueries";
import {
  replaceAttachmentSchema,
  uploadAttachmentSchema,
  type ReplaceAttachmentFormValues,
  type UploadAttachmentFormValues,
} from "../schemas/attachmentSchemas";
import type { Attachment } from "../types";

interface AttachmentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presence switches the dialog into "replace" mode for this attachment. */
  replaceTarget?: Attachment | null;
}

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function AttachmentUploadDialog({ open, onOpenChange, replaceTarget }: AttachmentUploadDialogProps) {
  const { t, i18n } = useTranslation();
  const isReplaceMode = !!replaceTarget;

  const [userSearch, setUserSearch] = useState("");
  const usersQuery = useUsersQuery({ page: 1, pageSize: 20, search: userSearch || undefined });

  const uploadMutation = useUploadAttachment();
  const updateMutation = useUpdateAttachment();
  const isPending = uploadMutation.isPending || updateMutation.isPending;

  const uploadForm = useForm<UploadAttachmentFormValues>({
    resolver: zodResolver(uploadAttachmentSchema),
    defaultValues: { userId: undefined as unknown as number, file: undefined as unknown as File },
  });
  const replaceForm = useForm<ReplaceAttachmentFormValues>({
    resolver: zodResolver(replaceAttachmentSchema),
    defaultValues: { file: undefined as unknown as File },
  });

  const userOptions: ComboboxOption[] = useMemo(
    () =>
      (usersQuery.data?.items ?? []).map((u) => ({
        value: String(u.id),
        label: u.fullName,
        description: u.phoneNumber,
      })),
    [usersQuery.data],
  );

  const resetAll = () => {
    uploadForm.reset({ userId: undefined as unknown as number, file: undefined as unknown as File });
    replaceForm.reset({ file: undefined as unknown as File });
    setUserSearch("");
  };

  const handleOpenChange = (val: boolean) => {
    if (isPending) return;
    if (!val) resetAll();
    onOpenChange(val);
  };

  const onSubmitUpload = async (data: UploadAttachmentFormValues) => {
    await uploadMutation.mutateAsync({ file: data.file, userId: data.userId });
    handleOpenChange(false);
  };

  const onSubmitReplace = async (data: ReplaceAttachmentFormValues) => {
    if (!replaceTarget) return;
    await updateMutation.mutateAsync({ id: replaceTarget.id, file: data.file });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="sm" dir={i18n.dir()}>
        <DialogHeader>
          <DialogTitle>
            {isReplaceMode ? t("attachments.replace.title") : t("attachments.upload.title")}
          </DialogTitle>
        </DialogHeader>

        {isReplaceMode ? (
          <form
            id="attachment-form"
            onSubmit={replaceForm.handleSubmit(onSubmitReplace)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>{t("attachments.form.file")}</Label>
              <FileUpload
                label={t("attachments.form.filePickLabel")}
                accept={ACCEPT}
                onPick={(picked) =>
                  replaceForm.setValue("file", picked.file, { shouldValidate: true })
                }
                picked={
                  replaceForm.watch("file")
                    ? { name: replaceForm.watch("file").name, size: replaceForm.watch("file").size }
                    : null
                }
                onRemove={() => replaceForm.setValue("file", undefined as unknown as File)}
              />
              {replaceForm.formState.errors.file && (
                <p className="text-sm text-danger-500">
                  {t(replaceForm.formState.errors.file.message ?? "")}
                </p>
              )}
            </div>
          </form>
        ) : (
          <form
            id="attachment-form"
            onSubmit={uploadForm.handleSubmit(onSubmitUpload)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>{t("attachments.form.file")}</Label>
              <FileUpload
                label={t("attachments.form.filePickLabel")}
                accept={ACCEPT}
                onPick={(picked) =>
                  uploadForm.setValue("file", picked.file, { shouldValidate: true })
                }
                picked={
                  uploadForm.watch("file")
                    ? { name: uploadForm.watch("file").name, size: uploadForm.watch("file").size }
                    : null
                }
                onRemove={() => uploadForm.setValue("file", undefined as unknown as File)}
              />
              {uploadForm.formState.errors.file && (
                <p className="text-sm text-danger-500">
                  {t(uploadForm.formState.errors.file.message ?? "")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("attachments.form.owner")}</Label>
              <Combobox
                options={userOptions}
                value={uploadForm.watch("userId") ? String(uploadForm.watch("userId")) : null}
                onValueChange={(val) =>
                  uploadForm.setValue("userId", Number(val), { shouldValidate: true })
                }
                onSearchChange={setUserSearch}
                loading={usersQuery.isLoading}
                placeholder={t("attachments.form.ownerPlaceholder")}
                searchPlaceholder={t("attachments.form.ownerSearchPlaceholder")}
                emptyText={t("attachments.form.ownerEmpty")}
                invalid={!!uploadForm.formState.errors.userId}
              />
              {uploadForm.formState.errors.userId && (
                <p className="text-sm text-danger-500">
                  {t(uploadForm.formState.errors.userId.message ?? "")}
                </p>
              )}
            </div>
          </form>
        )}

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="attachment-form" disabled={isPending}>
            {isPending ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
