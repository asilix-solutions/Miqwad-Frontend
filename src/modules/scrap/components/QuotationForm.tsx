/**
 * @file QuotationForm.tsx
 *
 * Create / edit form for a salvage quotation against a customer part-request
 * (live `/api/request-quotations`). Fields: Name*, Notes, IsCompatibleWith,
 * Files[]. Quantity & Price are HIDDEN per product decision and injected as
 * placeholders in the API layer (server enforces Quantity>=1 & Price>=0.01).
 *
 * On edit, prefills from the quotation; OrderId is path-bound and not sent.
 * Silent hooks — toasts are raised here in the UI, not in the query hooks.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ProviderInput, ProviderTextarea } from "@shared/provider-ui";
import { useToast } from "@shared/components/ui/toastContext";
import { quotationFormSchema } from "../schemas/scrap.schemas";
import type { QuotationFormValues } from "../schemas/scrap.schemas";
import {
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
} from "../hooks/useRequestQuotations";
import type { RequestQuotation } from "../types";
import { QuotationFilePicker } from "./QuotationFilePicker";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuotationFormProps {
  /** The salvage order this quotation targets (used only on create). */
  orderId: string;
  /** When set, the form edits this quotation instead of creating a new one. */
  existing?: RequestQuotation;
  onDone?: () => void;
  onCancel?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Create/edit form for a salvage quotation. */
export function QuotationForm({ orderId, existing, onDone, onCancel }: QuotationFormProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const formId = useId();

  const [files, setFiles] = useState<File[]>([]);

  const createMutation = useCreateQuotationMutation();
  const updateMutation = useUpdateQuotationMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      name: existing?.name ?? "",
      notes: existing?.notes ?? "",
      isCompatibleWith: existing?.isCompatibleWith ?? "",
    },
  });

  function onSubmit(values: QuotationFormValues) {
    const shared = {
      name: values.name,
      notes: values.notes || undefined,
      isCompatibleWith: values.isCompatibleWith || undefined,
      files: files.length > 0 ? files : undefined,
    };

    if (existing) {
      updateMutation.mutate(
        { id: existing.id, input: shared },
        {
          onSuccess: () => {
            toast.success(t("scrap.offer.updateSuccess"));
            onDone?.();
          },
          onError: () => toast.error(t("common.saveFailed")),
        },
      );
      return;
    }

    createMutation.mutate(
      { orderId, ...shared },
      {
        onSuccess: () => {
          toast.success(t("scrap.offer.success"));
          onDone?.();
        },
        onError: () => toast.error(t("common.saveFailed")),
      },
    );
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <ProviderInput
        id={`${formId}-name`}
        label={t("scrap.offer.nameLabel")}
        placeholder={t("scrap.offer.namePlaceholder")}
        error={errors.name?.message ? t(errors.name.message) : undefined}
        {...register("name")}
      />

      <ProviderTextarea
        id={`${formId}-notes`}
        label={t("scrap.offer.notesLabel")}
        placeholder={t("scrap.offer.notesPlaceholder")}
        rows={3}
        error={errors.notes?.message ? t(errors.notes.message) : undefined}
        {...register("notes")}
      />

      <ProviderInput
        id={`${formId}-isCompatibleWith`}
        label={t("scrap.offer.isCompatibleWithLabel")}
        placeholder={t("scrap.offer.isCompatibleWithPlaceholder")}
        hint={t("scrap.offer.isCompatibleWithHint")}
        error={
          errors.isCompatibleWith?.message
            ? t(errors.isCompatibleWith.message)
            : undefined
        }
        {...register("isCompatibleWith")}
      />

      <QuotationFilePicker
        value={files}
        onChange={setFiles}
        existing={existing?.attachments}
      />

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={[
              "flex-1 rounded-[var(--radius-md)] border border-[var(--color-divider)]",
              "py-2.5 text-sm font-medium text-[var(--color-ink-body)]",
              "transition-colors hover:bg-[var(--color-surface-2)]",
              "disabled:opacity-50",
            ].join(" ")}
          >
            {t("common.cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className={[
            "flex-1 inline-flex items-center justify-center gap-2",
            "rounded-[var(--radius-md)] bg-[var(--color-brand-orange)]",
            "h-[var(--size-input-h)] px-5 text-sm font-semibold text-white",
            "transition-colors duration-[var(--dur-fast)]",
            "hover:bg-[var(--color-brand-orange-hover)]",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-[var(--color-brand-orange)]/40",
            "disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {existing ? t("scrap.offer.saveEdit") : t("scrap.offer.submit")}
        </button>
      </div>
    </form>
  );
}
