/**
 * @file MessageComposer.tsx
 *
 * Message input + send button. Enter sends, Shift+Enter inserts a newline.
 * Sending is REST-based and always available (empty/too-long/sending guards
 * only) — the SignalR hub is receive-only, so its status never gates send.
 * When the hub isn't "connected" a soft, non-blocking hint informs that new
 * messages may arrive late. Enforces the hub's content rules client-side
 * (1–2000 chars) so obviously invalid sends never reach the API, and
 * surfaces a bilingual inline error if the send fails anyway (never crashes).
 */

import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { ProviderTextarea } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import { chatHubErrorI18nKey } from "../lib/chatErrors";
import type { ConnectionStatus } from "../types";

const MAX_CONTENT_LENGTH = 2000;
const COUNTER_WARNING_THRESHOLD = 1800;

export interface MessageComposerProps {
  status: ConnectionStatus;
  onSend: (content: string) => Promise<void>;
}

export function MessageComposer({ status, onSend }: MessageComposerProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const receiveDegraded = status !== "connected";
  const isEmpty = value.trim().length === 0;
  const isTooLong = value.length > MAX_CONTENT_LENGTH;
  const disabled = isEmpty || isTooLong || sending;

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || isTooLong || sending) return;

    setSending(true);
    setSendError(null);
    try {
      await onSend(trimmed);
      setValue("");
    } catch (error) {
      setSendError(t(chatHubErrorI18nKey(error)));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-1.5 border-t border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
      <div className="flex items-end gap-2">
        <ProviderTextarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (sendError) setSendError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.composerPlaceholder")}
          rows={1}
          className="min-h-0 resize-none py-2.5"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={disabled}
          aria-label={t("chat.send")}
          className={cn(
            "flex h-[var(--size-input-h)] w-[var(--size-input-h)] shrink-0 items-center justify-center",
            "rounded-[var(--radius-md)] bg-[var(--color-brand-orange)] text-white",
            "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-brand-orange-hover)]",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {value.length > COUNTER_WARNING_THRESHOLD && (
        <p
          className={cn(
            "text-xs",
            isTooLong ? "text-[var(--color-danger-500)]" : "text-[var(--color-muted)]",
          )}
        >
          {t("chat.composer.charCounter", { count: value.length, max: MAX_CONTENT_LENGTH })}
          {isTooLong ? ` — ${t("chat.composer.tooLong")}` : ""}
        </p>
      )}

      {sendError && (
        <p role="alert" className="text-xs text-[var(--color-danger-500)]">
          {sendError}
        </p>
      )}

      {receiveDegraded && (
        <p className="text-xs text-[var(--color-muted)]">
          {t("chat.composerReceiveDegradedHint")}
        </p>
      )}
    </div>
  );
}
