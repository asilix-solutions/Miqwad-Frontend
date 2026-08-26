/**
 * @file ConnectionStatusDot.tsx
 *
 * Small live indicator reflecting OUR OWN hub connection status — never the
 * peer's presence, since no presence API exists. A colored dot plus an
 * optional short label: connected → green (pulsing), connecting/
 * reconnecting → amber (pulsing), disconnected/idle → red (static). Pulse
 * respects prefers-reduced-motion via the shared `provider-status-pulse`
 * utility in globals.css. The `title` tooltip spells out that this is a
 * self-status indicator so the honest meaning is discoverable even though
 * the compact label alone ("Connected"/"Disconnected") could otherwise read
 * as the peer's online status.
 *
 * Currently UNUSED: it previously sat beside the peer's name in
 * ChatWindow's header, where — despite the honest copy above — its position
 * read as the peer's online status (our own hub connection stayed green
 * even while messaging a non-existent user). Our own status now surfaces
 * only in ChatConnectionBanner, where "your connection to the service" is
 * unambiguous. This component is kept, unused, to be repurposed for real
 * per-peer presence — see the TODO below.
 *
 * // TODO: wire to backend — peer presence (a `UserOnline`/`UserOffline`
 * // hub event, an `IsUserOnline(userId)` call, or `GET /api/users/{id}/presence`)
 * // for a real per-peer dot. When available, render it beside the peer's
 * // name sourced from peer presence — NOT from our own connection status.
 * // `getStatusVisual` below is the one place to swap the data source from
 * // `status: ConnectionStatus` (ours) to a peer-presence enum when the
 * // backend provides one.
 */

import { useTranslation } from "react-i18next";
import { cn } from "@shared/lib/utils";
import type { ConnectionStatus } from "../types";

export interface ConnectionStatusDotProps {
  status: ConnectionStatus;
  /** Show the short status label beside the dot. Defaults to true. */
  showLabel?: boolean;
  className?: string;
}

interface StatusVisual {
  color: string;
  labelKey: string;
  pulse: boolean;
}

function getStatusVisual(status: ConnectionStatus): StatusVisual {
  switch (status) {
    case "connected":
      return { color: "var(--color-success-500)", labelKey: "chat.status.connected", pulse: true };
    case "connecting":
    case "reconnecting":
      return { color: "var(--color-warning-500)", labelKey: "chat.status.connecting", pulse: true };
    case "disconnected":
    case "idle":
    default:
      return { color: "var(--color-danger-500)", labelKey: "chat.status.disconnected", pulse: false };
  }
}

export function ConnectionStatusDot({ status, showLabel = true, className }: ConnectionStatusDotProps) {
  const { t } = useTranslation();
  const { color, labelKey, pulse } = getStatusVisual(status);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={t("chat.status.selfHint")}>
      <span
        aria-hidden
        className={cn("h-2 w-2 shrink-0 rounded-full", pulse && "provider-status-pulse")}
        style={{ backgroundColor: color }}
      />
      {showLabel && (
        <span className="text-xs font-medium text-[var(--color-muted)]">{t(labelKey)}</span>
      )}
    </span>
  );
}
