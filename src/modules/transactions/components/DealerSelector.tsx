import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUsersQuery } from "@modules/admin/hooks/useAdminQueries";
import type { AdminUserRow } from "@modules/admin/types";
import { TransactionFeedback } from "./TransactionFeedback";
import { TransactionPagination } from "./TransactionPagination";

export function DealerSelector({
  selected,
  onSelect,
  disabled,
  invalid,
}: {
  selected: AdminUserRow | null;
  onSelect: (user: AdminUserRow) => void;
  disabled: boolean;
  invalid: boolean;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const q = useUsersQuery({ page, pageSize: 20, roleId: 2 });
  // Users supports ONE FilterBy pair: don't add a misleading global name search.
  const dealers =
    q.data?.items.filter(
      (user) => user.role === 2 && Number.isSafeInteger(Number(user.id)) && Number(user.id) > 0,
    ) ?? [];
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="mb-2 text-sm font-medium">{t("transactions.dealer")} *</legend>
      <p id="dealer-help" className="text-xs text-[var(--color-muted)]">
        {t("transactions.dealerHelp")}
      </p>
      {selected && (
        <p className="rounded-md bg-[var(--color-surface-2)] p-2 text-sm break-words">
          {t("transactions.selected", { name: selected.fullName, id: selected.id })}
        </p>
      )}
      {q.isError ? (
        <TransactionFeedback error={q.error} retry={() => void q.refetch()} />
      ) : q.isPending ? (
        <p role="status">{t("common.loading")}</p>
      ) : (
        <>
          <div
            className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-[var(--color-divider)] p-2"
            role="radiogroup"
            aria-label={t("transactions.dealer")}
            aria-invalid={invalid}
            aria-describedby="dealer-help dealer-error"
            aria-required="true"
          >
            {dealers.length === 0 && (
              <p className="p-2 text-sm">{t("transactions.noDealersPage")}</p>
            )}
            {dealers.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-[var(--color-surface-2)]"
              >
                <input
                  type="radio"
                  name="dealer"
                  value={user.id}
                  checked={selected?.id === user.id}
                  onChange={() => onSelect(user)}
                  disabled={disabled || q.isFetching}
                  className="mt-1"
                />
                <span className="min-w-0 text-sm break-words">
                  <bdi>{user.fullName}</bdi>
                  <span className="mt-1 block text-xs text-[var(--color-muted)]">
                    <bdi>
                      {user.email || user.phoneNumber || t("transactions.userId", { id: user.id })}
                    </bdi>
                  </span>
                </span>
              </label>
            ))}
          </div>
          <TransactionPagination
            page={q.data?.page ?? page}
            totalPages={q.data?.totalPages ?? 0}
            busy={disabled || q.isFetching}
            onPage={setPage}
          />
        </>
      )}
      <p
        id="dealer-error"
        role={invalid ? "alert" : undefined}
        className="text-sm text-[var(--color-danger-500)]"
      >
        {invalid ? t("transactions.validation.dealer") : ""}
      </p>
    </fieldset>
  );
}
