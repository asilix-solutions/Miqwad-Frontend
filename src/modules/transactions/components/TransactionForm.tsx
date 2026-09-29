import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@shared/components/ui/toastContext";
import type { AdminUserRow } from "@modules/admin/types";
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDealerTransaction,
} from "../hooks/useTransactionsQueries";
import {
  transactionFormSchema,
  type TransactionFormValues,
} from "../schemas/transactionForm.schema";
import { ExistingDealerBalanceError } from "../lib/createDealerBalance";
import { transactionErrorKey } from "../lib/transactionPresentation";
import type { Transaction } from "../types";
import { DealerSelector } from "./DealerSelector";
import { TransactionFeedback } from "./TransactionFeedback";

export function TransactionForm({
  record,
  loadedRecords,
  onClose,
  onEditExisting,
  onPendingChange,
}: {
  record?: Transaction;
  loadedRecords: Transaction[];
  onClose: () => void;
  onEditExisting: (id: number) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const submitLock = useRef(false);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [dealerInvalid, setDealerInvalid] = useState(false);
  const dealerId = selected ? Number(selected.id) : 0;
  const lookup = useDealerTransaction(dealerId);
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { balance: record?.balance, isActive: record?.isActive ?? true },
  });
  const pending = isSubmitting || create.isPending || update.isPending;
  const error = create.error ?? update.error;
  const conflict =
    create.error instanceof ExistingDealerBalanceError && create.error.record.dealerId === dealerId
      ? create.error.record
      : undefined;
  const existing =
    conflict ?? lookup.data ?? loadedRecords.find((item) => item.dealerId === dealerId);
  const submit = async (values: TransactionFormValues) => {
    if (pending || submitLock.current) return;
    if (!record && !selected) {
      setDealerInvalid(true);
      return;
    }
    if (!record && (existing || lookup.isError || lookup.isFetching || !lookup.isSuccess)) return;
    submitLock.current = true;
    onPendingChange(true);
    try {
      if (record)
        await update.mutateAsync({
          id: record.id,
          input: { balance: values.balance, isActive: values.isActive },
        });
      else await create.mutateAsync({ dealerId, balance: values.balance });
      toast.success(t(record ? "transactions.updated" : "transactions.created"));
      onClose();
    } catch (err) {
      if (!(err instanceof ExistingDealerBalanceError)) toast.error(t(transactionErrorKey(err)));
    } finally {
      submitLock.current = false;
      onPendingChange(false);
    }
  };
  return (
    <form noValidate onSubmit={(event) => void handleSubmit(submit)(event)} className="space-y-5">
      {!record ? (
        <DealerSelector
          selected={selected}
          disabled={pending}
          invalid={dealerInvalid}
          onSelect={(user) => {
            setSelected(user);
            setDealerInvalid(false);
            create.reset();
          }}
        />
      ) : (
        <p className="text-sm break-words">
          {record.dealerName ?? t("transactions.userId", { id: record.dealerId })}
        </p>
      )}
      {!record && dealerId > 0 && lookup.isFetching && (
        <p role="status">{t("transactions.checking")}</p>
      )}
      {!record && lookup.isError && (
        <TransactionFeedback error={lookup.error} retry={() => void lookup.refetch()} />
      )}
      {!record && existing && (
        <div
          role="status"
          className="space-y-2 rounded-md border border-[var(--color-divider)] p-3 text-sm"
        >
          <p>{t("transactions.exists")}</p>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onEditExisting(existing.id)}
          >
            {t("transactions.editExisting")}
          </Button>
        </div>
      )}
      <fieldset disabled={pending} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="transaction-balance">{t("transactions.finalBalance")} *</Label>
          <Input
            id="transaction-balance"
            type="number"
            step="any"
            inputMode="decimal"
            dir="ltr"
            aria-required="true"
            aria-invalid={!!errors.balance}
            aria-describedby="transaction-balance-help transaction-balance-error"
            {...register("balance", { valueAsNumber: true })}
          />
          <p id="transaction-balance-help" className="text-sm text-[var(--color-muted)]">
            {t("transactions.balanceHelp")}
          </p>
          {errors.balance && (
            <p
              id="transaction-balance-error"
              role="alert"
              className="text-sm text-[var(--color-danger-500)]"
            >
              {t("transactions.validation.balance")}
            </p>
          )}
        </div>
        {record && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isActive")} />
            {t("transactions.active")}
          </label>
        )}
      </fieldset>
      {error && !(error instanceof ExistingDealerBalanceError) && (
        <TransactionFeedback error={error} />
      )}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={
            pending ||
            (!record &&
              (!!existing ||
                lookup.isError ||
                (dealerId > 0 && !lookup.isSuccess) ||
                lookup.isFetching))
          }
        >
          {t(pending ? "common.loading" : record ? "common.save" : "transactions.create")}
        </Button>
      </DialogFooter>
    </form>
  );
}
