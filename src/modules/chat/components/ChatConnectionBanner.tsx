/**
 * @file ChatConnectionBanner.tsx
 *
 * Top strip reflecting OUR OWN live SignalR connection state — this is the
 * one place self-connection status is shown (no dot beside the peer name;
 * see ConnectionStatusDot.tsx). Renders nothing when connected/connecting.
 * "reconnecting" uses the warning tone; "disconnected" uses the danger tone
 * so a real service outage reads as unambiguously more severe than a
 * transient reconnect.
 */

import { useTranslation } from "react-i18next";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@shared/lib/utils";
import type { ConnectionStatus } from "../types";

export interface ChatConnectionBannerProps {
  status: ConnectionStatus;
}

export function ChatConnectionBanner({ status }: ChatConnectionBannerProps) {
  const { t } = useTranslation();

  if (status === "connected" || status === "idle" || status === "connecting") return null;

  const isReconnecting = status === "reconnecting";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-xs font-medium",
        isReconnecting
          ? "bg-[var(--color-warning-50)] text-[var(--color-warning-500)]"
          : "bg-[var(--color-danger-50)] text-[var(--color-danger-500)]",
      )}
    >
      {isReconnecting ? (
        <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      <span>{isReconnecting ? t("chat.connection.reconnecting") : t("chat.connection.disconnected")}</span>
    </div>
  );
}
