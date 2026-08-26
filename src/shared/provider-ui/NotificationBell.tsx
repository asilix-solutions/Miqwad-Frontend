/**
 * @file NotificationBell.tsx
 *
 * Reusable bell icon + unread badge + dropdown list for provider topbars.
 * Presentation only — receive logic (hub connection, session store) lives
 * in @modules/notifications. Reused by dealer/workshop/scrap; `viewAllHref`
 * lets each role point "view all" at its own full notifications route.
 */
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@app/store";
import {
  markAllRead,
  markRead,
  selectMuted,
  selectNotificationItems,
  selectUnreadCount,
  setMuted,
} from "@modules/notifications/store/notificationsSlice";
import type { NotificationItem } from "@modules/notifications/types";
import { formatRelativeTime } from "@shared/lib/formatRelativeTime";
import { cn } from "@shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NotificationBellProps {
  /** Route to the role's full notifications page, e.g. "/provider/scrap/notifications". */
  viewAllHref: string;
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();

  return (
    <button
      type="button"
      onClick={() => dispatch(markRead(item.id))}
      className={cn(
        "flex w-full items-start gap-2 rounded-[var(--radius-sm,8px)] p-3 text-start transition-colors hover:bg-[var(--color-surface-2)]",
        !item.isRead && "bg-[var(--color-brand-orange)]/5",
      )}
    >
      {!item.isRead && (
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-orange)]"
          aria-hidden
        />
      )}
      <span className={cn("flex-1 min-w-0", item.isRead && "ps-4")}>
        <span className="block truncate text-sm font-medium text-[var(--color-ink-body)]">
          {item.title}
        </span>
        <span className="block truncate text-xs text-[var(--color-muted)]">{item.message}</span>
        <span className="mt-0.5 block text-[11px] text-[var(--color-muted)]">
          {formatRelativeTime(item.sentAt, i18n.language)}
        </span>
      </span>
    </button>
  );
}

export function NotificationBell({ viewAllHref }: NotificationBellProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectNotificationItems);
  const unreadCount = useAppSelector(selectUnreadCount);
  const muted = useAppSelector(selectMuted);

  const recent = items.slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("notifications.bellLabel")}
          className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 && (
            <span
              className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger-500,#E3460F)] px-1 text-[10px] font-semibold leading-none text-white"
              aria-hidden
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-divider)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--color-ink-body)]">
            {t("notifications.title")}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => dispatch(setMuted(!muted))}
              aria-label={muted ? t("notifications.unmute") : t("notifications.mute")}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm,8px)] text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
            >
              {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch(markAllRead())}
                className="flex items-center gap-1 rounded-[var(--radius-sm,8px)] px-2 py-1 text-xs font-medium text-[var(--color-brand-orange)] hover:bg-[var(--color-surface-2)]"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Bell className="h-8 w-8 text-[var(--color-muted)]" aria-hidden />
            <p className="text-sm text-[var(--color-muted)]">{t("notifications.emptyTitle")}</p>
          </div>
        ) : (
          <div className="flex max-h-[360px] flex-col gap-1 overflow-y-auto p-2">
            {recent.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(viewAllHref)}
          className="block w-full border-t border-[var(--color-divider)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-brand-orange)] hover:bg-[var(--color-surface-2)]"
        >
          {t("notifications.viewAll")}
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
