/**
 * @file NotificationToastHost.tsx
 *
 * Fixed top-right toast host for live notification pop-ups + chime, on top
 * of the app's global bottom-start ToastProvider (@shared/components/ui/toast)
 * which only handles success/error/info copy, has no click-through action,
 * and is not positioned for this. Built directly on @radix-ui/react-toast
 * (already a dependency) rather than adding a new one.
 *
 * Deliberately pinned to the physical top-right corner in BOTH languages
 * (not inset-inline-end, which would flip to top-left under RTL) — this is
 * a fixed screen-corner notification tray, not part of the mirrored reading
 * layout; only the vertical offset uses a logical property since block
 * direction doesn't flip between ar/en.
 *
 * Presentation only — subscribes to @modules/notifications' Redux slice for
 * data and plays the chime via its lib/notificationSound; does not own the
 * hub connection (see @modules/notifications/hooks/useNotificationsHub).
 */
import * as ToastPrimitive from "@radix-ui/react-toast";
import { Bell, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@app/store";
import { playNotificationSound } from "@modules/notifications/lib/notificationSound";
import { selectMuted, selectNotificationItems } from "@modules/notifications/store/notificationsSlice";
import type { NotificationItem } from "@modules/notifications/types";

export interface NotificationToastHostProps {
  /** Route to the role's full notifications page, e.g. "/provider/scrap/notifications". */
  viewAllHref: string;
}

export function NotificationToastHost({ viewAllHref }: NotificationToastHostProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useAppSelector(selectNotificationItems);
  const muted = useAppSelector(selectMuted);
  const [visible, setVisible] = useState<NotificationItem[]>([]);
  const lastSeenIdRef = useRef<string | null>(null);

  useEffect(() => {
    const latest = items[0];
    if (!latest || latest.id === lastSeenIdRef.current) return;
    lastSeenIdRef.current = latest.id;
    setVisible((prev) => [...prev, latest]);
    playNotificationSound(muted);
    // `muted` deliberately excluded: this effect must fire once per new
    // notification (identity change of items[0]), not re-fire on mute toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const dismiss = (id: string) => setVisible((prev) => prev.filter((n) => n.id !== id));

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
      {visible.map((item) => (
        <ToastPrimitive.Root
          key={item.id}
          onOpenChange={(open) => {
            if (!open) dismiss(item.id);
          }}
          className="flex w-[340px] items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-3,0_8px_24px_rgba(0,0,0,0.12))] data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-80"
        >
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand-orange)]" aria-hidden />
          <button
            type="button"
            onClick={() => {
              navigate(viewAllHref);
              dismiss(item.id);
            }}
            className="min-w-0 flex-1 text-start"
          >
            <ToastPrimitive.Title className="truncate text-sm font-semibold text-[var(--color-ink-body)]">
              {item.title}
            </ToastPrimitive.Title>
            <ToastPrimitive.Description className="mt-0.5 line-clamp-2 text-xs text-[var(--color-muted)]">
              {item.message}
            </ToastPrimitive.Description>
          </button>
          <ToastPrimitive.Close
            aria-label={t("common.close")}
            className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-ink-body)]"
          >
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport
        style={{
          position: "fixed",
          insetBlockStart: "1rem",
          right: "1rem",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          width: 360,
          maxWidth: "calc(100vw - 2rem)",
          outline: "none",
          listStyle: "none",
        }}
      />
    </ToastPrimitive.Provider>
  );
}
