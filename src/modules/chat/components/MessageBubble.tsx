import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Check, CheckCheck, Ellipsis } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useMessageLongPress } from "../hooks/useMessageLongPress";
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
  const actionButton = useRef<HTMLButtonElement>(null);
  const openingDialog = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const longPress = useMessageLongPress(isOwn && !menuOpen && mode === null, () =>
    setMenuOpen(true),
  );
  const date = new Date(message.sentAt);
  const time = Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
  const open = (next: "edit" | "delete") => {
    openingDialog.current = true;
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
    <div
      className={cn(
        "group flex w-full min-w-0 items-start gap-1",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {isOwn && (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} dir={i18n.dir()}>
          <DropdownMenuTrigger asChild>
            <button
              ref={actionButton}
              type="button"
              aria-label={t("chat.media.actions")}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-orange)] data-[state=open]:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100 [@media(pointer:coarse)]:size-11"
            >
              <Ellipsis size={18} aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            collisionPadding={8}
            onCloseAutoFocus={(event) => {
              if (openingDialog.current) {
                event.preventDefault();
                openingDialog.current = false;
              }
            }}
          >
            {message.attachments.length === 0 && !!message.content && (
              <DropdownMenuItem className="min-h-11" onSelect={() => open("edit")}>
                <Pencil aria-hidden />
                {t("chat.media.edit")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="min-h-11"
              variant="destructive"
              onSelect={() => open("delete")}
            >
              <Trash2 aria-hidden />
              {t("chat.media.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <div
        {...longPress}
        className={cn(
          "flex w-fit max-w-[min(85%,32rem)] min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] px-3 py-2",
          isOwn
            ? "bg-[var(--color-brand-orange)] text-white"
            : "border border-[var(--color-divider)] bg-[var(--color-surface)] text-[var(--color-ink-body)]",
        )}
      >
        <MessageMedia attachments={message.attachments} />
        {message.content && (
          <p
            dir="auto"
            className="text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap"
          >
            {message.content}
          </p>
        )}
        <div className="flex items-center justify-end gap-1 text-[11px]">
          <time dir="auto" dateTime={message.sentAt}>
            {time}
          </time>
          {isOwn && message.isRead !== undefined && (
            <span aria-label={t(message.isRead ? "chat.media.read" : "chat.media.sent")}>
              {message.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}
        </div>
      </div>
      <Dialog
        open={mode !== null}
        onOpenChange={(value) => {
          if (!busy && !value) setMode(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          dir={i18n.dir()}
          className="max-h-[calc(100dvh-2rem)] min-w-0 overflow-y-auto p-4 sm:p-6"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            actionButton.current?.focus();
          }}
        >
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
