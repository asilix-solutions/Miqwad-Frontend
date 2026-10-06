import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Check, CheckCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProviderTextarea } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import { mutationUncertain } from "../hooks/useChatDrafts";
import { MessageMedia } from "./MessageMedia";
import type { ChatMessage } from "../types";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  onEdit: (id: number, text: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}
export function MessageBubble({ message, isOwn, onEdit, onDelete }: Props) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [text, setText] = useState(message.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const date = new Date(message.sentAt);
  const time = Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
  const open = (next: "edit" | "delete") => {
    setText(message.content);
    setError(null);
    setMode(next);
  };
  const save = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (mode === "edit") await onEdit(message.id, text.trim());
      else await onDelete(message.id);
      setMode(null);
    } catch (e) {
      setError(mutationUncertain(e) ? "chat.media.actionUncertain" : "chat.media.actionFailed");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[90%] min-w-0 flex-col gap-2 rounded-[var(--radius-md)] px-3 py-2.5 sm:max-w-[75%]",
          message.attachments.length > 0 && "w-72",
          isOwn
            ? "bg-[var(--color-brand-orange)] text-white"
            : "border border-[var(--color-divider)] bg-[var(--color-surface)] text-[var(--color-ink-body)]",
        )}
      >
        {message.attachments.map((a) => (
          <MessageMedia key={`${a.id}:${a.filePath}`} attachment={a} />
        ))}
        {message.content && (
          <p
            dir="auto"
            className="text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap"
          >
            {message.content}
          </p>
        )}
        <div className="flex items-center justify-end gap-1 text-[11px]">
          <time dateTime={message.sentAt}>{time}</time>
          {isOwn && message.isRead !== undefined && (
            <span aria-label={t(message.isRead ? "chat.media.read" : "chat.media.sent")}>
              {message.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}
          {isOwn && (
            <>
              {message.attachments.length === 0 && !!message.content && (
                <button
                  type="button"
                  className="ms-1 flex size-9 items-center justify-center rounded focus-visible:outline-2"
                  aria-label={t("chat.media.edit")}
                  onClick={() => open("edit")}
                >
                  <Pencil size={14} />
                </button>
              )}
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded focus-visible:outline-2"
                aria-label={t("chat.media.delete")}
                onClick={() => open("delete")}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      <Dialog
        open={mode !== null}
        onOpenChange={(value) => {
          if (!busy && !value) setMode(null);
        }}
      >
        <DialogContent showCloseButton={false} dir={i18n.dir()}>
          <DialogTitle>{t(mode === "edit" ? "chat.media.edit" : "chat.media.delete")}</DialogTitle>
          <DialogDescription>
            {t(mode === "edit" ? "chat.media.editDescription" : "chat.media.deleteDescription")}
          </DialogDescription>
          {mode === "edit" && (
            <ProviderTextarea
              aria-label={t("chat.media.edit")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              disabled={busy}
              className="max-h-52"
            />
          )}
          {error && (
            <p role="alert" className="text-sm text-[var(--color-danger-500)]">
              {t(error)}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="min-h-11 rounded border px-4"
              disabled={busy}
              onClick={() => setMode(null)}
            >
              {t("chat.media.cancel")}
            </button>
            <button
              type="button"
              className="min-h-11 rounded bg-[var(--color-brand-orange)] px-4 text-white disabled:opacity-40"
              disabled={
                busy ||
                error === "chat.media.actionUncertain" ||
                (mode === "edit" && (!text.trim() || text.length > 2000))
              }
              onClick={() => void save()}
            >
              {t(
                busy
                  ? "chat.media.saving"
                  : mode === "edit"
                    ? "chat.media.save"
                    : "chat.media.delete",
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
