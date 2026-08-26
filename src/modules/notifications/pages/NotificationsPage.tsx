/**
 * @file NotificationsPage.tsx
 *
 * Full notifications list for the current session. There is no persisted
 * backend yet (see ../types.ts) so the honest default is the empty state —
 * this list only ever holds what arrived live over the hub since the tab
 * was opened. Registered per-role (currently only the scrap subtree, see
 * src/app/router.tsx) since each role's guard/layout differs, even though
 * the page itself is role-agnostic.
 */
import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@app/store";
import {
  markAllRead,
  markRead,
  selectNotificationItems,
  selectUnreadCount,
} from "../store/notificationsSlice";
import type { NotificationItem } from "../types";
import { formatRelativeTime } from "@shared/lib/formatRelativeTime";
import { cn } from "@shared/lib/utils";
import { ProviderEmptyState, ProviderPageHeader } from "@shared/provider-ui";

function NotificationRow({ item }: { item: NotificationItem }) {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();

  return (
    <button
      type="button"
      onClick={() => dispatch(markRead(item.id))}
      className={cn(
        "flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4 text-start shadow-[var(--shadow-provider-sm)] transition-colors hover:bg-[var(--color-surface-2)]",
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          item.isRead ? "bg-transparent" : "bg-[var(--color-brand-orange)]",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-[var(--color-ink-body)]">
            {item.title}
          </span>
          <span className="shrink-0 text-xs text-[var(--color-muted)]">
            {formatRelativeTime(item.sentAt, i18n.language)}
          </span>
        </span>
        <span className="mt-1 block text-sm text-[var(--color-muted)]">{item.message}</span>
      </span>
    </button>
  );
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectNotificationItems);
  const unreadCount = useAppSelector(selectUnreadCount);

  return (
    <div className="flex flex-col gap-6">
      <ProviderPageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle")}
        icon={<Bell className="h-5 w-5" />}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => dispatch(markAllRead())}
              className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-brand-orange)] hover:bg-[var(--color-surface-2)]"
            >
              <CheckCheck className="h-4 w-4" />
              {t("notifications.markAllRead")}
            </button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <ProviderEmptyState
          icon={<Bell className="h-8 w-8" />}
          title={t("notifications.emptyTitle")}
          description={t("notifications.emptyDescription")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
