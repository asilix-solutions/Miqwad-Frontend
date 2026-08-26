/**
 * @file MessageBubble.tsx
 *
 * Single chat message bubble. Flat modern style, no tails/shadows. Own
 * messages fill brand-orange and align to the logical end side; peer
 * messages use a bordered surface and align to the logical start side.
 * Locked visual spec — do not reinterpret.
 */

import { useTranslation } from "react-i18next";
import { cn } from "@shared/lib/utils";
import type { ChatMessage } from "../types";

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const { i18n } = useTranslation();

  const time = message.sentAt
    ? new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(message.sentAt))
    : "";

  return (
    <div
      className={cn(
        "provider-fade-up flex w-full",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1 rounded-[var(--radius-md)] px-3.5 py-2.5",
          isOwn
            ? "bg-[var(--color-brand-orange)] text-white"
            : "border border-[var(--color-divider)] bg-[var(--color-surface)] text-[var(--color-ink-body)]",
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </p>
        {time && (
          <span
            className={cn(
              "text-[10px]",
              isOwn ? "text-white/75" : "text-[var(--color-muted)]",
            )}
          >
            {time}
          </span>
        )}
      </div>
    </div>
  );
}
