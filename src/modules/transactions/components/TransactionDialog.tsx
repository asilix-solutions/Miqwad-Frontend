import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@shared/components/ui/toastContext";
import { formatDate } from "@shared/lib/formatDate";
import { useTransaction, useDeleteTransaction } from "../hooks/useTransactionsQueries";
import { transactionAmount, transactionErrorKey } from "../lib/transactionPresentation";
import { TransactionForm } from "./TransactionForm";
import { TransactionFeedback } from "./TransactionFeedback";
import { TransactionStatus } from "./TransactionStatus";
import type { Transaction } from "../types";

export type TransactionDialogState =
  | { action: "create" }
  | { action: "detail" | "edit" | "delete"; id: number };
export function TransactionDialog({
  state,
  loadedRecords,
  onClose,
  onEditExisting,
  restoreFocus,
}: {
  state: TransactionDialogState;
  loadedRecords: Transaction[];
  onClose: () => void;
  onEditExisting: (id: number) => void;
  restoreFocus: () => void;
}) {
  const { t, i18n } = useTranslation();
  const q = useTransaction(state.action === "create" ? 0 : state.id);
  const pending = useRef(false);
  const close = () => {
    if (!pending.current) onClose();
  };
  const onPendingChange = (value: boolean) => {
    pending.current = value;
  };
  const title = {
    create: "transactions.create",
    detail: "transactions.details",
    edit: "transactions.edit",
    delete: "transactions.deleteTitle",
  }[state.action];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        size="lg"
        dir={i18n.dir()}
        showCloseButton={false}
        className="max-h-[85svh] overflow-y-auto"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle>{t(title)}</DialogTitle>
          <DialogDescription>{t("transactions.dialogHint")}</DialogDescription>
        </DialogHeader>
        {state.action === "create" ? (
          <TransactionForm
            loadedRecords={loadedRecords}
            onClose={onClose}
            onEditExisting={onEditExisting}
            onPendingChange={onPendingChange}
          />
        ) : q.isPending ? (
          <div role="status" className="space-y-3">
            <span>{t("common.loading")}</span>
            <Skeleton className="h-32 w-full" />
          </div>
        ) : q.isError ? (
          <TransactionFeedback error={q.error} retry={() => void q.refetch()} />
        ) : q.data ? (
          state.action === "edit" ? (
            <TransactionForm
              key={q.data.id}
              record={q.data}
              loadedRecords={loadedRecords}
              onClose={onClose}
              onEditExisting={onEditExisting}
              onPendingChange={onPendingChange}
            />
          ) : state.action === "detail" ? (
            <TransactionDetails record={q.data} />
          ) : (
            <DeleteTransaction
              record={q.data}
              onClose={onClose}
              onPendingChange={onPendingChange}
            />
          )
        ) : null}
        {(state.action === "detail" ||
          (state.action !== "create" && (q.isPending || q.isError))) && (
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
function TransactionDetails({ record }: { record: Transaction }) {
  const { t, i18n } = useTranslation();
  const date = (value: string | null) =>
    value === null
      ? t("transactions.notUpdated")
      : formatDate(value, i18n.language, { dateStyle: "medium", timeStyle: "short" });
  const fields = [
    ["recordId", String(record.id)],
    ["dealer", record.dealerName ?? t("transactions.unnamed")],
    ["dealerUserId", String(record.dealerId)],
    ["balance", transactionAmount(record.balance, i18n.language)],
    ["createdAt", date(record.createdAt)],
    ["updatedAt", date(record.updatedAt)],
  ];
  return (
    <div className="space-y-5">
      <TransactionStatus active={record.isActive} />
      <dl className="grid gap-5 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-[var(--color-muted)]">{t(`transactions.${label}`)}</dt>
            <dd className="mt-1 font-medium break-words">
              <bdi>{value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
function DeleteTransaction({
  record,
  onClose,
  onPendingChange,
}: {
  record: Transaction;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const remove = useDeleteTransaction();
  const locked = useRef(false);
  const confirm = async () => {
    if (locked.current) return;
    locked.current = true;
    onPendingChange(true);
    try {
      await remove.mutateAsync(record.id);
      toast.success(t("transactions.deleted"));
      onClose();
    } catch (error) {
      toast.error(t(transactionErrorKey(error)));
    } finally {
      locked.current = false;
      onPendingChange(false);
    }
  };
  return (
    <div className="space-y-4">
      <p className="break-words">
        {record.dealerName ?? t("transactions.userId", { id: record.dealerId })}
      </p>
      <p className="font-semibold">
        <bdi>{transactionAmount(record.balance, i18n.language)}</bdi>
      </p>
      <p>{t("transactions.deleteDescription")}</p>
      {remove.isError && <TransactionFeedback error={remove.error} />}
      <DialogFooter>
        <Button variant="outline" disabled={remove.isPending} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="destructive" disabled={remove.isPending} onClick={() => void confirm()}>
          {t(remove.isPending ? "common.loading" : "common.delete")}
        </Button>
      </DialogFooter>
    </div>
  );
}
