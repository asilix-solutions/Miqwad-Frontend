import { useTranslation } from "react-i18next";
import { useSentNotificationsQuery } from "../../hooks/useAdminQueries";
import { DataTable } from "../shared/DataTable";
import { StatusBadge } from "../shared/StatusBadge";
import type { SentNotification } from "@modules/notifications/types";
import { formatDate } from "@shared/lib/formatDate";

export function SentHistoryPanel() {
  const { t, i18n } = useTranslation();
  
  const { data: notifications, isLoading, error } = useSentNotificationsQuery({ page: 1, pageSize: 10 });

  const columns = [
    {
      key: "titleAr",
      header: t("superAdmin.notifications.history.columns.titleAr"),
      render: (row: SentNotification) => (
        <span>{row.titleAr}</span>
      ),
    },
    {
      key: "audience",
      header: t("superAdmin.notifications.history.columns.audience"),
      render: (row: SentNotification) => (
        <span className="text-sm">
          {t(`superAdmin.notifications.history.audiences.${row.audience}`)}
        </span>
      ),
    },
    {
      key: "channel",
      header: t("superAdmin.notifications.history.columns.channel"),
      render: (row: SentNotification) => (
        <span className="text-sm">
          {t(`superAdmin.notifications.channels.${row.channel}`)}
        </span>
      ),
    },
    {
      key: "recipientsCount",
      header: t("superAdmin.notifications.history.columns.recipientsCount"),
      render: (row: SentNotification) => (
        <span className="tabular-nums">
          {row.recipientsCount}
        </span>
      ),
    },
    {
      key: "sentAt",
      header: t("superAdmin.notifications.history.columns.sentAt"),
      render: (row: SentNotification) => (
        <span className="tabular-nums text-sm">
          {formatDate(row.sentAt, i18n.language)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("superAdmin.notifications.history.columns.status"),
      render: (row: SentNotification) => (
        <StatusBadge status={row.status} kind="notification" />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<SentNotification>
          rows={notifications?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          isError={!!error}
          getRowKey={(row) => String(row.id)}
          emptyText={t("common.empty.noData")}
        />
      </div>
    </div>
  );
}
