/**
 * @file CategoryFormDialog.tsx
 * @description Hierarchy-aware category create/edit dialog.
 *  - `isRealParent` true (add-root, or editing a level-1 category sourced
 *    from the real `/api/Categories` backend): renders a single Arabic
 *    "name" field and writes through the real backend.
 *  - `isRealParent` false (add-child, edit on any mocked category —
 *    including legacy mock level-1 roots): unchanged bilingual mock flow.
 *      - mode "add-root": creates L1; providerTypeScope selectable.
 *      - mode "add-child": creates L2 or L3; parentId + scope inherited from parentNode.
 *      - mode "edit": updates existing; scope is locked for L2/L3.
 */

import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useCreateParentCategoryMutation,
  useUpdateParentCategoryMutation,
} from "../../hooks/useAdminQueries";
import {
  categorySchema,
  type CategoryFormValues,
  parentCategorySchema,
  type ParentCategoryFormValues,
} from "../../schemas/admin.schemas";
import type { ServiceCategory, CategoryTreeNode } from "@modules/services/types";
import { useToast } from "@shared/components/ui/toastContext";

type FormMode = "add-root" | "add-child" | "edit";

const PROVIDER_SCOPE_OPTIONS = ["dealer", "workshop", "scrap"] as const;
const COLOR_OPTIONS = ["blue", "green", "orange", "purple", "red", "navy"] as const;
const COLOR_MAP: Record<string, string> = {
  blue: "var(--color-brand-blue)",
  green: "var(--color-success-500)",
  orange: "var(--color-brand-orange)",
  purple: "var(--color-surface-4)",
  red: "var(--color-danger-500)",
  navy: "var(--color-ink-900)",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: FormMode;
  /** Provided when mode = "add-child"; gives parentId, level, and inherited scope. */
  parentNode?: CategoryTreeNode;
  /** Provided when mode = "edit". */
  category?: ServiceCategory;
  /** True for add-root, or editing a level-1 category that came from the real backend. */
  isRealParent?: boolean;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  mode,
  parentNode,
  category,
  isRealParent = false,
}: Props) {
  if (isRealParent) {
    return (
      <ParentCategoryFormDialog
        open={open}
        onOpenChange={onOpenChange}
        mode={mode === "edit" ? "edit" : "add-root"}
        category={category}
      />
    );
  }
  return (
    <MockCategoryFormDialog
      open={open}
      onOpenChange={onOpenChange}
      mode={mode}
      parentNode={parentNode}
      category={category}
    />
  );
}

// ── Real backend (parent / level-1) form ─────────────────────────────────────

interface ParentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "add-root" | "edit";
  category?: ServiceCategory;
}

function ParentCategoryFormDialog({ open, onOpenChange, mode, category }: ParentDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateParentCategoryMutation();
  const updateMutation = useUpdateParentCategoryMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParentCategoryFormValues>({
    resolver: zodResolver(parentCategorySchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ name: mode === "edit" && category ? category.nameAr : "" });
  }, [open, mode, category, reset]);

  const dialogTitle =
    mode === "add-root" ? t("superAdmin.categories.tree.addRoot") : t("superAdmin.categories.edit");

  const onSubmit = async (data: ParentCategoryFormValues) => {
    try {
      if (mode === "edit" && category) {
        await updateMutation.mutateAsync({ id: category.id, name: data.name });
        toast.success(t("superAdmin.categories.success.updated"));
      } else {
        await createMutation.mutateAsync(data.name);
        toast.success(t("superAdmin.categories.success.created"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[420px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] bg-[var(--color-surface-2)] rounded-[var(--radius-sm)] px-3 py-2">
          <span className="font-semibold text-[var(--color-ink-body)]">
            {t("superAdmin.categories.tree.level.l1")}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="parent-cat-name">
              {t("superAdmin.categories.form.singleName")}{" "}
              <span className="text-[var(--color-danger-500)]">*</span>
            </Label>
            <Input id="parent-cat-name" {...register("name")} disabled={isPending} />
            {errors.name && (
              <p className="text-sm text-[var(--color-danger-500)]">
                {t(errors.name.message as string)}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
            >
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Mocked (L2/L3, and legacy mock L1) bilingual form — unchanged ───────────

interface MockDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: FormMode;
  parentNode?: CategoryTreeNode;
  category?: ServiceCategory;
}

function MockCategoryFormDialog({
  open,
  onOpenChange,
  mode,
  parentNode,
  category,
}: MockDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Derived hierarchy context
  const derivedLevel: 1 | 2 | 3 =
    mode === "add-root"
      ? 1
      : mode === "add-child"
        ? ((parentNode!.level + 1) as 2 | 3)
        : category!.level;

  // Scope is locked (inherited) for L2/L3 children
  const inheritedScope =
    mode === "add-child"
      ? parentNode!.providerTypeScope
      : mode === "edit" && derivedLevel > 1
        ? category!.providerTypeScope
        : null;
  const scopeEditable = mode === "add-root" || (mode === "edit" && derivedLevel === 1);

  // colorHint only meaningful for L1 and L2
  const showColor = derivedLevel <= 2;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      iconUrl: undefined,
      colorHint: undefined,
      providerTypeScope: undefined,
    },
  });

  const selectedColor = watch("colorHint");
  const selectedScope = watch("providerTypeScope");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && category) {
      reset({
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        iconUrl: category.iconUrl ?? undefined,
        colorHint: category.colorHint ?? undefined,
        providerTypeScope: category.providerTypeScope ?? undefined,
      });
    } else {
      reset({
        nameAr: "",
        nameEn: "",
        iconUrl: undefined,
        colorHint: undefined,
        providerTypeScope: undefined,
      });
    }
  }, [open, mode, category, reset]);

  const dialogTitle =
    mode === "add-root"
      ? t("superAdmin.categories.tree.addRoot")
      : mode === "add-child"
        ? t("superAdmin.categories.tree.addChild")
        : t("superAdmin.categories.edit");

  const levelKey = derivedLevel === 1 ? "l1" : derivedLevel === 2 ? "l2" : "l3";

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      if (mode === "edit" && category) {
        await updateMutation.mutateAsync({
          id: category.id,
          payload: {
            nameAr: data.nameAr,
            nameEn: data.nameEn,
            iconUrl: data.iconUrl || null,
            colorHint: data.colorHint ?? undefined,
            ...(scopeEditable
              ? { providerTypeScope: data.providerTypeScope ?? null }
              : {}),
          },
        });
        toast.success(t("superAdmin.categories.success.updated"));
      } else {
        await createMutation.mutateAsync({
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          iconUrl: data.iconUrl || null,
          colorHint: data.colorHint ?? undefined,
          parentId: parentNode?.id ?? null,
          level: derivedLevel,
          providerTypeScope:
            mode === "add-child"
              ? (inheritedScope ?? null)
              : (data.providerTypeScope ?? null),
          isActive: true,
          sortOrder: 0,
        });
        toast.success(t("superAdmin.categories.success.created"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[460px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        {/* Level breadcrumb indicator */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] bg-[var(--color-surface-2)] rounded-[var(--radius-sm)] px-3 py-2">
          <span className="font-semibold text-[var(--color-ink-body)]">
            {t(`superAdmin.categories.tree.level.${levelKey}`)}
          </span>
          {mode === "add-child" && parentNode && (
            <>
              <span aria-hidden>{t("superAdmin.categories.tree.breadcrumbSep")}</span>
              <span className="text-[var(--color-ink-secondary)]">{parentNode.nameAr}</span>
              <span aria-hidden>{t("superAdmin.categories.tree.breadcrumbSep")}</span>
              <span className="italic text-[var(--color-muted)]">—</span>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* nameAr */}
          <div className="space-y-2">
            <Label htmlFor="cat-nameAr">
              {t("superAdmin.categories.form.nameAr")}{" "}
              <span className="text-[var(--color-danger-500)]">*</span>
            </Label>
            <Input id="cat-nameAr" {...register("nameAr")} disabled={isPending} />
            {errors.nameAr && (
              <p className="text-sm text-[var(--color-danger-500)]">
                {t(errors.nameAr.message as string)}
              </p>
            )}
          </div>

          {/* nameEn */}
          <div className="space-y-2">
            <Label htmlFor="cat-nameEn">
              {t("superAdmin.categories.form.nameEn")}{" "}
              <span className="text-[var(--color-danger-500)]">*</span>
            </Label>
            <Input
              id="cat-nameEn"
              dir="ltr"
              className="text-left"
              {...register("nameEn")}
              disabled={isPending}
            />
            {errors.nameEn && (
              <p className="text-sm text-[var(--color-danger-500)]">
                {t(errors.nameEn.message as string)}
              </p>
            )}
          </div>

          {/* providerTypeScope */}
          {scopeEditable ? (
            <div className="space-y-2">
              <Label htmlFor="cat-scope">
                {t("superAdmin.categories.tree.scopeLabel")}
              </Label>
              <Select
                disabled={isPending}
                value={selectedScope ?? "all"}
                onValueChange={(val) =>
                  setValue(
                    "providerTypeScope",
                    val === "all"
                      ? undefined
                      : (val as "dealer" | "workshop" | "scrap"),
                  )
                }
              >
                <SelectTrigger id="cat-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">
                    {t("superAdmin.categories.tree.allProviders")}
                  </SelectItem>
                  {PROVIDER_SCOPE_OPTIONS.map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {t(`superAdmin.categories.tree.providerScope.${scope}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-[var(--color-muted)]">
                {t("superAdmin.categories.tree.scopeLabel")}
              </p>
              <p className="text-sm text-[var(--color-ink-body)] font-medium">
                {inheritedScope
                  ? t(`superAdmin.categories.tree.providerScope.${inheritedScope}`)
                  : t("superAdmin.categories.tree.allProviders")}
                <span className="text-[var(--color-muted)] font-normal ms-1.5 text-xs">
                  ({t("superAdmin.categories.tree.inheritedLabel")})
                </span>
              </p>
            </div>
          )}

          {/* colorHint — L1/L2 only */}
          {showColor && (
            <div className="space-y-2">
              <Label htmlFor="cat-colorHint">
                {t("superAdmin.categories.form.colorHint")} (
                {t("common.optional")})
              </Label>
              <Select
                disabled={isPending}
                value={selectedColor ?? "none"}
                onValueChange={(val) =>
                  setValue(
                    "colorHint",
                    val === "none"
                      ? undefined
                      : (val as CategoryFormValues["colorHint"]),
                  )
                }
              >
                <SelectTrigger id="cat-colorHint">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {COLOR_OPTIONS.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border border-[var(--color-divider)] shrink-0"
                          style={{ backgroundColor: COLOR_MAP[color] }}
                        />
                        <span>
                          {t(`superAdmin.categories.form.colorOptions.${color}`)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* iconUrl */}
          <div className="space-y-2">
            <Label htmlFor="cat-iconUrl">
              {t("superAdmin.categories.form.iconUrl")} ({t("common.optional")})
            </Label>
            <Input
              id="cat-iconUrl"
              type="url"
              dir="ltr"
              className="text-left"
              {...register("iconUrl")}
              disabled={isPending}
            />
            {errors.iconUrl && (
              <p className="text-sm text-[var(--color-danger-500)]">
                {t(errors.iconUrl.message as string)}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
            >
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
