/**
 * @file DeleteCategoryDialog.tsx
 * @description Smart-guard delete dialog for categories.
 *
 * `isRealParent` true (level-1 category sourced from the real
 * `/api/Categories` backend): simpler flow — the real backend has no
 * `isActive` concept, so there is no "deactivate instead" fallback; a 409
 * just surfaces as a blocked-delete toast.
 *
 * `isRealParent` false (mocked category, any level — including legacy
 * mock L1 roots): unchanged. On a 409 Conflict response (children or
 * references exist) the dialog explains the block and offers "تعطيل بدل
 * الحذف" (deactivate instead of delete) as a safe alternative.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useDeleteCategoryMutation,
  usePatchCategoryActiveMutation,
  useDeleteParentCategoryMutation,
} from "../../hooks/useAdminQueries";
import type { ServiceCategory } from "@modules/services/types";
import { AppError } from "@shared/types/api";
import { useToast } from "@shared/components/ui/toastContext";

interface ConflictInfo {
  childCount: number;
  referenceCount: number;
}

interface Props {
  category: ServiceCategory | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** True when `category` is a level-1 category sourced from the real backend. */
  isRealParent?: boolean;
}

function is409(err: unknown): err is { response: { status: number; data: ConflictInfo & { error: string } } } {
  return (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    (err as { response: { status: number } }).response?.status === 409
  );
}

export function DeleteCategoryDialog({ category, open, onOpenChange, isRealParent = false }: Props) {
  if (isRealParent) {
    return <ParentDeleteCategoryDialog category={category} open={open} onOpenChange={onOpenChange} />;
  }
  return <MockDeleteCategoryDialog category={category} open={open} onOpenChange={onOpenChange} />;
}

// ── Real backend (parent / level-1) delete ───────────────────────────────────

interface ParentDeleteProps {
  category: ServiceCategory | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function ParentDeleteCategoryDialog({ category, open, onOpenChange }: ParentDeleteProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const deleteMutation = useDeleteParentCategoryMutation();
  const isPending = deleteMutation.isPending;
  const categoryName = category?.nameAr ?? "";

  const handleDelete = async () => {
    if (!category) return;
    try {
      await deleteMutation.mutateAsync(category.id);
      toast.success(t("superAdmin.categories.success.deleted"));
      onOpenChange(false);
    } catch (err) {
      if (err instanceof AppError && err.status === 409) {
        toast.error(t("superAdmin.categories.tree.deleteBlockedGeneric"));
      } else {
        toast.error(t("common.deleteFailed"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[420px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-danger-500)]">
            {t("superAdmin.categories.deleteConfirm.title")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("superAdmin.categories.deleteConfirm.description", { name: categoryName })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("superAdmin.categories.deleteConfirm.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? t("common.loading") : t("superAdmin.categories.deleteConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Mocked (L2/L3, and legacy mock L1) delete — unchanged ───────────────────

interface MockDeleteProps {
  category: ServiceCategory | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function MockDeleteCategoryDialog({ category, open, onOpenChange }: MockDeleteProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const deleteMutation = useDeleteCategoryMutation();
  const patchActiveMutation = usePatchCategoryActiveMutation();
  const isPending = deleteMutation.isPending || patchActiveMutation.isPending;

  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  // Reset conflict state when dialog opens/closes
  useEffect(() => {
    if (!open) setConflict(null);
  }, [open]);

  const handleDelete = async () => {
    if (!category) return;
    try {
      await deleteMutation.mutateAsync(category.id);
      toast.success(t("superAdmin.categories.success.deleted"));
      onOpenChange(false);
    } catch (err) {
      if (is409(err)) {
        setConflict({
          childCount: err.response.data.childCount ?? 0,
          referenceCount: err.response.data.referenceCount ?? 0,
        });
      } else {
        toast.error(t("common.deleteFailed"));
      }
    }
  };

  const handleDeactivate = async () => {
    if (!category) return;
    try {
      await patchActiveMutation.mutateAsync({ id: category.id, isActive: false });
      toast.success(t("superAdmin.categories.success.deactivated"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  const categoryName = category?.nameAr ?? "";

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[440px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className={conflict ? "text-[var(--color-warning-500)]" : "text-[var(--color-danger-500)]"}>
            {t("superAdmin.categories.deleteConfirm.title")}
          </DialogTitle>

          {conflict ? (
            /* 409 block: explain and offer deactivate instead */
            <div className="pt-2 space-y-3">
              <div className="flex gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-warning-50,#FFFBEB)] border border-[var(--color-warning-200,#FDE68A)]">
                <AlertTriangle className="h-4 w-4 text-[var(--color-warning-500)] shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm text-[var(--color-ink-body)]">
                  {conflict.childCount > 0 && (
                    <p>{t("superAdmin.categories.tree.deleteBlockedChildren", { count: conflict.childCount })}</p>
                  )}
                  {conflict.referenceCount > 0 && (
                    <p>{t("superAdmin.categories.tree.deleteBlockedInUse", { count: conflict.referenceCount })}</p>
                  )}
                </div>
              </div>
              <DialogDescription className="text-sm text-[var(--color-muted)]">
                {t("superAdmin.categories.tree.deactivateInstead")} —{" "}
                {categoryName}
              </DialogDescription>
            </div>
          ) : (
            <DialogDescription className="pt-2">
              {t("superAdmin.categories.deleteConfirm.description", {
                name: categoryName,
              })}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="pt-4 gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("superAdmin.categories.deleteConfirm.cancel")}
          </Button>

          {conflict ? (
            /* Offer deactivate as the safe path */
            <Button
              onClick={handleDeactivate}
              disabled={isPending}
              className="bg-[var(--color-warning-500,#F59E0B)] hover:bg-[var(--color-warning-600,#D97706)] text-white"
            >
              {patchActiveMutation.isPending
                ? t("common.loading")
                : t("superAdmin.categories.tree.deactivateInstead")}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {deleteMutation.isPending
                ? t("common.loading")
                : t("superAdmin.categories.deleteConfirm.confirm")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
